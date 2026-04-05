'use client';

/**
 * Web Audio API mixing engine for The Zen Zone.
 *
 * Audio graph per scene:
 *
 *   [<audio> scene]  → [masterGain] ─┐
 *   [BufferSource L1] → [layerGain1] ─┤→ [AudioContext.destination]
 *   [BufferSource L2] → [layerGain2] ─┤
 *   ...                               ┘
 *
 * - AudioContext is created lazily on the first user gesture (iOS-safe).
 * - Scene audio uses createMediaElementSource so large files stream rather
 *   than buffer entirely in memory.
 * - Texture layers are fetched + decoded into AudioBuffers on first enable
 *   and reused for the lifetime of the component.
 * - Mix state is persisted to localStorage via src/lib/session.ts.
 */

import { useCallback, useEffect, useState } from 'react';
import type { AmbientSound } from '@/src/data/textures';
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
// Holds all Web Audio API objects. Stored in a React ref so it survives
// re-renders without recreating the audio graph.

class AudioEngineCore {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sceneAudio: HTMLAudioElement | null = null;
  private layerNodes = new Map<string, LayerNode>();

  private ready = false;
  private playing = false;
  private mixState: MixState;

  constructor(
    private readonly sceneId: string,
    private readonly sceneAudioUrl: string,
    private readonly textureDefs: AmbientSound[],
    initialMixState: MixState,
    private readonly cbs: EngineCallbacks
  ) {
    this.mixState = initialMixState;
  }

  // ── Graph initialisation ──────────────────────────────────────────────────

  private initCtx(): AudioContext {
    if (this.ctx) return this.ctx;

    const ctx = new AudioContext();
    this.ctx = ctx;

    // Master gain → destination
    const masterGain = ctx.createGain();
    masterGain.gain.value = this.mixState.master / 100;
    masterGain.connect(ctx.destination);
    this.masterGain = masterGain;

    // One gain node per texture layer, all silent until enabled
    this.textureDefs.forEach((t) => {
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(ctx.destination);
      this.layerNodes.set(t.id, { gainNode, source: null, buffer: null });
    });

    // Scene audio: stream via <audio> element to avoid buffering large files
    const audio = new Audio();
    audio.src = this.sceneAudioUrl;
    audio.loop = true;
    // crossOrigin required to use the element with Web Audio API + R2
    audio.crossOrigin = 'anonymous';
    this.sceneAudio = audio;

    const mediaSource = ctx.createMediaElementSource(audio);
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

    // Load buffer on first enable
    if (!node.buffer) {
      this.cbs.onLayerLoading(id, true);
      node.buffer = await this.fetchBuffer(url);
      this.cbs.onLayerLoading(id, false);
      if (!node.buffer) return; // load failed — stay disabled
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

  // ── Persist ───────────────────────────────────────────────────────────────

  private persist() {
    saveMixState(this.sceneId, this.mixState);
    this.cbs.onMixState(this.mixState);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async toggle() {
    if (!this.ready) {
      // First interaction — boot the audio graph (required for iOS)
      const ctx = this.initCtx();
      if (ctx.state === 'suspended') await ctx.resume();
      await this.sceneAudio?.play().catch((e) =>
        console.warn('[AudioEngine] Scene play blocked:', e)
      );
      this.ready = true;
      this.playing = true;
      this.cbs.onPlayState(true, true);

      // Restore any layers that were enabled in the saved session
      for (const [id, layerState] of Object.entries(this.mixState.layers)) {
        if (layerState.enabled) {
          const def = this.textureDefs.find((t) => t.id === id);
          if (def) {
            // Fire-and-forget; loading indicators handled via callbacks
            this.startLayerSource(id, def.audioUrl, layerState.volume);
          }
        }
      }
      return;
    }

    if (this.playing) {
      this.sceneAudio?.pause();
      await this.ctx?.suspend();
      this.playing = false;
    } else {
      await this.ctx?.resume();
      await this.sceneAudio?.play().catch(() => {});
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

    // Boot audio context if not yet started
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

  /**
   * Overwrites the engine's internal mix state without affecting any active
   * audio nodes. Safe to call before the AudioContext has been started (i.e.
   * before the first user gesture / toggle() call).
   */
  syncMixState(state: MixState) {
    this.mixState = state;
    this.cbs.onMixState(state);
  }

  destroy() {
    this.sceneAudio?.pause();
    this.layerNodes.forEach((node) => this.stopLayerSource(node));
    this.ctx?.close().catch(() => {});
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAudioEngine(
  sceneId: string,
  sceneAudioUrl: string,
  textureDefs: AmbientSound[]
): UseAudioEngineReturn {
  const layerIds = textureDefs.map((t) => t.id);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  // Start with defaults so SSR and the initial client render agree, then load
  // the real saved mix from localStorage after hydration in a useEffect below.
  const [mixState, setMixState] = useState<MixState>(() =>
    makeDefaultMixState(layerIds)
  );
  const [loadingSet, setLoadingSet] = useState<ReadonlySet<string>>(new Set());

  // Engine is created once (lazy useState initialiser runs only on first render).
  // All setState functions passed as callbacks are stable references from React.
  const [engine] = useState(
    () =>
      new AudioEngineCore(sceneId, sceneAudioUrl, textureDefs, mixState, {
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
      })
  );

  // Destroy on unmount
  useEffect(() => () => engine.destroy(), [engine]);

  // Load the saved mix from localStorage after hydration so the initial SSR
  // render (which uses defaults) matches the first client render.
  useEffect(() => {
    const saved = loadMixState(sceneId, layerIds);
    engine.syncMixState(saved);
  // layerIds is derived from textureDefs which is stable; sceneId won't change
  // for the lifetime of this component instance.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, sceneId]);

  // ── Stable public callbacks ───────────────────────────────────────────────

  const toggle = useCallback(() => {
    engine.toggle();
  }, [engine]);

  const setMasterVolume = useCallback(
    (v: number) => engine.setMasterVolume(v),
    [engine]
  );

  const toggleLayer = useCallback(
    (id: string) => engine.toggleLayer(id),
    [engine]
  );

  const setLayerVolume = useCallback(
    (id: string, v: number) => engine.setLayerVolume(id, v),
    [engine]
  );

  // ── Derived layer states ──────────────────────────────────────────────────

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
