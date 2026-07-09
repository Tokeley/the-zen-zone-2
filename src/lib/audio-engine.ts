'use client';

/**
 * Web Audio API mixing engine for The Zen Zone.
 *
 * Audio graph per scene:
 *
 *   [<video> or <audio> scene] → [masterGain] ─┐
 *   [BufferSource L1] → [layerGain1] ──────────┤→ [AudioContext.destination]
 *   [BufferSource L2] → [layerGain2] ──────────┤
 *   ...                                        ┘
 *
 * - AudioContext is created lazily on the first user gesture (iOS-safe).
 * - New scenes route the video element's audio through masterGain.
 * - Legacy scenes with a separate audio.mp3 use a hidden <audio> element.
 * - Texture layers are fetched + decoded into AudioBuffers on first enable.
 * - Mix state is persisted to localStorage via src/lib/session.ts.
 */

import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { AmbientSound } from '@/src/data/textures';
import { sceneUsesVideoAudio } from '@/src/data/textures';
import { loadMixState, makeDefaultMixState, saveMixState, type MixState } from './session';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface LayerState {
  id: string;
  enabled: boolean;
  volume: number; // 0–100
  loading: boolean;
}

export interface UseAudioEngineReturn {
  /** True once the AudioContext has been started by a user gesture. */
  isReady: boolean;
  isPlaying: boolean;
  masterVolume: number; // 0–100
  layers: LayerState[];
  /** Start/pause scene audio. First call also initialises the AudioContext. */
  toggle: () => void;
  setMasterVolume: (v: number) => void;
  /** Enable/disable a texture layer. Lazy-loads the buffer on first enable. */
  toggleLayer: (id: string) => void;
  setLayerVolume: (id: string, v: number) => void;
}

export interface SceneMediaConfig {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoUrl: string;
  audioUrl: string;
}

// ─── Internal types ──────────────────────────────────────────────────────────

interface LayerNode {
  gainNode: GainNode;
  source: AudioBufferSourceNode | null;
  buffer: AudioBuffer | null;
}

interface EngineCallbacks {
  onPlayState: (ready: boolean, playing: boolean) => void;
  onLayerLoading: (id: string, loading: boolean) => void;
  onMixState: (state: MixState) => void;
}

// ─── AudioEngineCore class ────────────────────────────────────────────────────

class AudioEngineCore {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sceneMedia: HTMLMediaElement | null = null;
  private detachedAudio: HTMLAudioElement | null = null;
  private layerNodes = new Map<string, LayerNode>();

  private ready = false;
  private playing = false;
  private mixState: MixState;
  private readonly useVideoAudio: boolean;

  constructor(
    private readonly sceneId: string,
    private readonly getVideoElement: () => HTMLVideoElement | null,
    private readonly fallbackAudioUrl: string,
    private readonly useVideoAudioFlag: boolean,
    private readonly textureDefs: AmbientSound[],
    initialMixState: MixState,
    private readonly cbs: EngineCallbacks,
  ) {
    this.mixState = initialMixState;
    this.useVideoAudio = useVideoAudioFlag;
  }

  // ── Graph initialisation ──────────────────────────────────────────────────

  private initCtx(): AudioContext {
    if (this.ctx) return this.ctx;

    const ctx = new AudioContext();
    this.ctx = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = this.mixState.master / 100;
    masterGain.connect(ctx.destination);
    this.masterGain = masterGain;

    this.textureDefs.forEach((t) => {
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(ctx.destination);
      this.layerNodes.set(t.id, { gainNode, source: null, buffer: null });
    });

    let media: HTMLMediaElement;

    if (this.useVideoAudio) {
      const video = this.getVideoElement();
      if (!video) {
        throw new Error('[AudioEngine] Video element not available');
      }
      video.crossOrigin = 'anonymous';
      media = video;
    } else {
      const audio = new Audio();
      audio.src = this.fallbackAudioUrl;
      audio.loop = true;
      audio.crossOrigin = 'anonymous';
      this.detachedAudio = audio;
      media = audio;
    }

    this.sceneMedia = media;
    const mediaSource = ctx.createMediaElementSource(media);
    mediaSource.connect(masterGain);

    return ctx;
  }

  // ── Buffer loading ────────────────────────────────────────────────────────

  private async fetchBuffer(url: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const arrayBuf = await resp.arrayBuffer();
      return await this.ctx.decodeAudioData(arrayBuf);
    } catch (e) {
      console.error('[AudioEngine] Failed to load texture:', url, e);
      return null;
    }
  }

  // ── Layer source management ───────────────────────────────────────────────

  private stopLayerSource(node: LayerNode) {
    if (node.source) {
      try {
        node.source.stop();
      } catch {
        // Already stopped
      }
      node.source.disconnect();
      node.source = null;
    }
  }

  private async startLayerSource(id: string, url: string, volume: number) {
    const node = this.layerNodes.get(id);
    if (!this.ctx || !node) return;

    if (!node.buffer) {
      this.cbs.onLayerLoading(id, true);
      node.buffer = await this.fetchBuffer(url);
      this.cbs.onLayerLoading(id, false);
      if (!node.buffer) return;
    }

    this.stopLayerSource(node);

    const source = this.ctx.createBufferSource();
    source.buffer = node.buffer;
    source.loop = true;
    source.connect(node.gainNode);
    source.start();
    node.source = source;
    node.gainNode.gain.value = volume / 100;
  }

  private async ensureSceneMediaPlaying() {
    const media = this.sceneMedia;
    if (!media) return;

    if (this.useVideoAudio && media instanceof HTMLVideoElement) {
      media.muted = false;
    }

    await media.play().catch((e) => console.warn('[AudioEngine] Scene play blocked:', e));
  }

  // ── Persist ───────────────────────────────────────────────────────────────

  private persist() {
    saveMixState(this.sceneId, this.mixState);
    this.cbs.onMixState(this.mixState);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async toggle() {
    if (!this.ready) {
      const ctx = this.initCtx();
      if (ctx.state === 'suspended') await ctx.resume();
      await this.ensureSceneMediaPlaying();
      this.ready = true;
      this.playing = true;
      this.cbs.onPlayState(true, true);

      for (const [id, layerState] of Object.entries(this.mixState.layers)) {
        if (layerState.enabled) {
          const def = this.textureDefs.find((t) => t.id === id);
          if (def) {
            this.startLayerSource(id, def.audioUrl, layerState.volume);
          }
        }
      }
      return;
    }

    if (this.playing) {
      if (!this.useVideoAudio) {
        this.sceneMedia?.pause();
      }
      await this.ctx?.suspend();
      this.playing = false;
    } else {
      await this.ctx?.resume();
      if (!this.useVideoAudio) {
        await this.sceneMedia?.play().catch(() => {});
      }
      this.playing = true;
    }
    this.cbs.onPlayState(this.ready, this.playing);
  }

  setMasterVolume(v: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = v / 100;
    }
    this.mixState = { ...this.mixState, master: v };
    this.persist();
  }

  async toggleLayer(id: string) {
    const def = this.textureDefs.find((t) => t.id === id);
    if (!def) return;

    if (!this.ready) {
      await this.toggle();
    }

    const node = this.layerNodes.get(id);
    if (!node) return;

    const current = this.mixState.layers[id];
    const willEnable = !(current?.enabled ?? false);
    const volume = current?.volume ?? 50;

    if (willEnable) {
      await this.startLayerSource(id, def.audioUrl, volume);
    } else {
      this.stopLayerSource(node);
      node.gainNode.gain.value = 0;
    }

    this.mixState = {
      ...this.mixState,
      layers: {
        ...this.mixState.layers,
        [id]: { ...current, enabled: willEnable },
      },
    };
    this.persist();
  }

  setLayerVolume(id: string, volume: number) {
    const node = this.layerNodes.get(id);
    const isEnabled = this.mixState.layers[id]?.enabled ?? false;
    if (node && isEnabled) {
      node.gainNode.gain.value = volume / 100;
    }
    this.mixState = {
      ...this.mixState,
      layers: {
        ...this.mixState.layers,
        [id]: { ...this.mixState.layers[id], volume },
      },
    };
    this.persist();
  }

  syncMixState(state: MixState) {
    this.mixState = state;
    this.cbs.onMixState(state);
  }

  destroy() {
    if (!this.useVideoAudio) {
      this.sceneMedia?.pause();
    }
    this.detachedAudio = null;
    this.layerNodes.forEach((node) => this.stopLayerSource(node));
    this.ctx?.close().catch(() => {});
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAudioEngine(
  sceneId: string,
  media: SceneMediaConfig,
  textureDefs: AmbientSound[],
): UseAudioEngineReturn {
  const layerIds = textureDefs.map((t) => t.id);
  const useVideoAudio = sceneUsesVideoAudio(media);
  const fallbackAudioUrl = media.audioUrl || media.videoUrl;

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mixState, setMixState] = useState<MixState>(() => makeDefaultMixState(layerIds));
  const [loadingSet, setLoadingSet] = useState<ReadonlySet<string>>(new Set());

  const [engine] = useState(
    () =>
      new AudioEngineCore(
        sceneId,
        () => media.videoRef.current,
        fallbackAudioUrl,
        useVideoAudio,
        textureDefs,
        mixState,
        {
          onPlayState: (ready, playing) => {
            setIsReady(ready);
            setIsPlaying(playing);
          },
          onLayerLoading: (id, loading) => {
            setLoadingSet((prev) => {
              const next = new Set(prev);
              if (loading) next.add(id);
              else next.delete(id);
              return next;
            });
          },
          onMixState: setMixState,
        },
      ),
  );

  useEffect(() => () => engine.destroy(), [engine]);

  useEffect(() => {
    const saved = loadMixState(sceneId, layerIds);
    engine.syncMixState(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, sceneId]);

  const toggle = useCallback(() => {
    engine.toggle();
  }, [engine]);

  const setMasterVolume = useCallback((v: number) => engine.setMasterVolume(v), [engine]);

  const toggleLayer = useCallback((id: string) => engine.toggleLayer(id), [engine]);

  const setLayerVolume = useCallback(
    (id: string, v: number) => engine.setLayerVolume(id, v),
    [engine],
  );

  const layers: LayerState[] = textureDefs.map((t) => ({
    id: t.id,
    enabled: mixState.layers[t.id]?.enabled ?? false,
    volume: mixState.layers[t.id]?.volume ?? 50,
    loading: loadingSet.has(t.id),
  }));

  return {
    isReady,
    isPlaying,
    masterVolume: mixState.master,
    layers,
    toggle,
    setMasterVolume,
    toggleLayer,
    setLayerVolume,
  };
}
