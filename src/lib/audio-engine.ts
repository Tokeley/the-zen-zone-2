'use client';

/**
 * Web Audio API mixing engine for The Zen Zone.
 *
 * Audio graph per scene:
 *
 *   [Scene BufferSource] → [masterGain] ─┐
 *   [BufferSource L1] → [layerGain1] ────┤→ [AudioContext.destination]
 *   [BufferSource L2] → [layerGain2] ────┤
 *   ...                                  ┘
 *
 * - AudioContext is created lazily on the first user gesture (iOS-safe).
 * - Scene audio is decoded into an AudioBuffer and looped sample-accurately
 *   (avoids the gap from HTMLMediaElement loop seeks). The <video> stays muted.
 * - Falls back to MediaElementSource if decode fails or the clip is very long.
 * - Texture layers are fetched + decoded into AudioBuffers on first enable.
 * - Mix state is persisted to localStorage via src/lib/session.ts.
 */

import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { AmbientSound } from '@/src/data/textures';
import { getSceneFallbackAudioUrl } from '@/src/data/textures';
import { loadMixState, makeDefaultMixState, saveMixState, type MixState } from './session';

/** Scene clips longer than this use media-element fallback (RAM safety). */
const MAX_BUFFER_LOOP_SECONDS = 180;

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
  /** True while scene audio is being fetched/decoded on first play. */
  sceneLoading: boolean;
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

interface SceneAudioNode {
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  /** false when using MediaElementSource fallback */
  usesBufferLoop: boolean;
}

interface EngineCallbacks {
  onPlayState: (ready: boolean, playing: boolean) => void;
  onSceneLoading: (loading: boolean) => void;
  onLayerLoading: (id: string, loading: boolean) => void;
  onMixState: (state: MixState) => void;
}

// ─── AudioEngineCore class ────────────────────────────────────────────────────

class AudioEngineCore {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sceneAudio: SceneAudioNode = { buffer: null, source: null, usesBufferLoop: true };
  private sceneMedia: HTMLMediaElement | null = null;
  private detachedAudio: HTMLAudioElement | null = null;
  private layerNodes = new Map<string, LayerNode>();

  private ready = false;
  private playing = false;
  private mixState: MixState;
  private readonly sceneAudioUrl: string;
  private readonly hasVideo: boolean;

  constructor(
    private readonly sceneId: string,
    private readonly getVideoElement: () => HTMLVideoElement | null,
    sceneAudioUrl: string,
    hasVideo: boolean,
    private readonly textureDefs: AmbientSound[],
    initialMixState: MixState,
    private readonly cbs: EngineCallbacks,
  ) {
    this.mixState = initialMixState;
    this.sceneAudioUrl = sceneAudioUrl;
    this.hasVideo = hasVideo;
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

    return ctx;
  }

  private initMediaElementFallback(): void {
    if (!this.ctx || !this.masterGain || this.sceneMedia) return;

    let media: HTMLMediaElement;

    if (this.hasVideo) {
      const video = this.getVideoElement();
      if (!video) {
        throw new Error('[AudioEngine] Video element not available');
      }
      video.crossOrigin = 'anonymous';
      media = video;
    } else {
      const audio = new Audio();
      audio.src = this.sceneAudioUrl;
      audio.loop = true;
      audio.crossOrigin = 'anonymous';
      this.detachedAudio = audio;
      media = audio;
    }

    this.sceneMedia = media;
    const mediaSource = this.ctx.createMediaElementSource(media);
    mediaSource.connect(this.masterGain);
    this.sceneAudio.usesBufferLoop = false;
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
      console.error('[AudioEngine] Failed to decode audio:', url, e);
      return null;
    }
  }

  // ── Scene audio (buffer loop or media fallback) ───────────────────────────

  private stopSceneBufferSource() {
    if (this.sceneAudio.source) {
      try {
        this.sceneAudio.source.stop();
      } catch {
        // Already stopped
      }
      this.sceneAudio.source.disconnect();
      this.sceneAudio.source = null;
    }
  }

  private async startSceneBufferSource(): Promise<boolean> {
    if (!this.ctx || !this.masterGain) return false;

    if (!this.sceneAudio.buffer) {
      this.sceneAudio.buffer = await this.fetchBuffer(this.sceneAudioUrl);
    }

    const buffer = this.sceneAudio.buffer;
    if (!buffer) return false;

    if (buffer.duration > MAX_BUFFER_LOOP_SECONDS) {
      console.warn(
        `[AudioEngine] Scene audio (${buffer.duration.toFixed(0)}s) exceeds buffer limit — using media fallback`,
      );
      return false;
    }

    this.stopSceneBufferSource();

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.masterGain);

    let offset = 0;
    if (this.hasVideo) {
      const video = this.getVideoElement();
      if (video && buffer.duration > 0) {
        offset = video.currentTime % buffer.duration;
      }
    }

    source.start(0, offset);
    this.sceneAudio.source = source;
    this.sceneAudio.usesBufferLoop = true;
    return true;
  }

  private async ensureMediaElementFallbackPlaying(): Promise<void> {
    this.initMediaElementFallback();
    const media = this.sceneMedia;
    if (!media) return;

    if (this.hasVideo && media instanceof HTMLVideoElement) {
      media.muted = false;
    }

    await media.play().catch((e) => console.warn('[AudioEngine] Scene play blocked:', e));
  }

  private async ensureVideoPlaying(): Promise<void> {
    if (!this.hasVideo) return;

    const video = this.getVideoElement();
    if (!video) return;

    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.loop = true;
    await video.play().catch((e) => console.warn('[AudioEngine] Video play blocked:', e));
  }

  private async startSceneAudio(): Promise<void> {
    this.cbs.onSceneLoading(true);
    try {
      const bufferOk = await this.startSceneBufferSource();
      if (!bufferOk) {
        await this.ensureMediaElementFallbackPlaying();
      } else {
        await this.ensureVideoPlaying();
      }
    } finally {
      this.cbs.onSceneLoading(false);
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

  private pauseSceneMedia() {
    if (this.sceneAudio.usesBufferLoop) {
      const video = this.getVideoElement();
      video?.pause();
      return;
    }
    this.sceneMedia?.pause();
  }

  private async resumeSceneMedia() {
    if (this.sceneAudio.usesBufferLoop) {
      await this.ensureVideoPlaying();
      return;
    }
    await this.sceneMedia?.play().catch(() => {});
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
      await this.startSceneAudio();
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
      this.pauseSceneMedia();
      await this.ctx?.suspend();
      this.playing = false;
    } else {
      await this.ctx?.resume();
      await this.resumeSceneMedia();
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
    this.stopSceneBufferSource();
    if (!this.sceneAudio.usesBufferLoop) {
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
  const sceneAudioUrl = getSceneFallbackAudioUrl(media);
  const hasVideo = !!media.videoUrl;

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [mixState, setMixState] = useState<MixState>(() => makeDefaultMixState(layerIds));
  const [loadingSet, setLoadingSet] = useState<ReadonlySet<string>>(new Set());

  const [engine] = useState(
    () =>
      new AudioEngineCore(
        sceneId,
        () => media.videoRef.current,
        sceneAudioUrl,
        hasVideo,
        textureDefs,
        mixState,
        {
          onPlayState: (ready, playing) => {
            setIsReady(ready);
            setIsPlaying(playing);
          },
          onSceneLoading: setSceneLoading,
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
    sceneLoading,
    masterVolume: mixState.master,
    layers,
    toggle,
    setMasterVolume,
    toggleLayer,
    setLayerVolume,
  };
}
