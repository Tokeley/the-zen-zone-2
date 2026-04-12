'use client';

import { useState } from 'react';
import { Scene, textures } from '@/src/data/textures';
import { useAudioEngine } from '@/src/lib/audio-engine';
import { VolumeSlider } from './volume-slider';

interface AudioMixerProps {
  scene: Scene;
}

export function AudioMixer({ scene }: AudioMixerProps) {
  const engine = useAudioEngine(scene.id, scene.audioUrl, textures);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-20">
      {/* Always-visible controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={engine.toggle}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-md transition-colors hover:bg-black/40"
          aria-label={engine.isPlaying ? 'Pause' : 'Play'}
        >
          {engine.isPlaying ? (
            <PauseIcon className="h-5 w-5 text-white" />
          ) : (
            <PlayIcon className="h-5 w-5 text-white" />
          )}
        </button>

        <button
          onClick={() => setIsExpanded((v) => !v)}
          className={`flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${
            isExpanded
              ? 'border-white/40 bg-white/20 text-white'
              : 'border-white/20 bg-black/30 text-white hover:bg-black/40'
          }`}
          aria-label={isExpanded ? 'Hide mixer' : 'Show mixer'}
        >
          <MixerIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Expandable mixer panel */}
      <div
        className={`fixed bottom-[88px] left-6 right-6 rounded-lg border border-white/20 bg-black/30 p-5 transition-[opacity,transform] duration-300 ease-out sm:absolute sm:bottom-16 sm:left-0 sm:right-auto sm:min-w-[320px] md:min-w-[500px] ${
          isExpanded
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        }`}
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <MixerPanel scene={scene} engine={engine} />
      </div>
    </div>
  );
}

// ─── Mixer panel ──────────────────────────────────────────────────────────────

interface MixerPanelProps {
  scene: Scene;
  engine: ReturnType<typeof useAudioEngine>;
}

function MixerPanel({ scene, engine }: MixerPanelProps) {
  return (
    <div className="space-y-4">
      {/* Scene master volume */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-light text-white/90">
              {scene.title} — Scene Volume
            </span>
            <span className="text-xs text-white/60">{engine.masterVolume}%</span>
          </div>
          <VolumeSlider
            value={engine.masterVolume}
            onChange={engine.setMasterVolume}
            variant="glass"
          />
        </div>
      </div>

      <div className="h-px w-full bg-white/20" />

      {/* Ambient texture layers */}
      <div className="grid gap-3 md:grid-cols-2">
        {textures.map((texture) => {
          const layer = engine.layers.find((l) => l.id === texture.id) ?? {
            id: texture.id,
            enabled: false,
            volume: 50,
            loading: false,
          };

          return (
            <div key={texture.id} className="flex items-center gap-3">
              <button
                onClick={() => engine.toggleLayer(texture.id)}
                disabled={layer.loading}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
                  layer.enabled
                    ? 'border-white/40 bg-white/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/50 hover:bg-white/10'
                }`}
                aria-label={`${layer.enabled ? 'Disable' : 'Enable'} ${texture.name}`}
                aria-pressed={layer.enabled}
              >
                {layer.loading ? (
                  <SpinnerIcon className="h-3 w-3 animate-spin" />
                ) : (
                  <SoundIcon name={texture.icon} className="h-3 w-3" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`truncate text-xs transition-colors ${
                      layer.enabled ? 'text-white/90' : 'text-white/50'
                    }`}
                  >
                    {texture.name}
                  </span>
                  {layer.enabled && (
                    <span className="ml-2 text-xs text-white/60">{layer.volume}%</span>
                  )}
                </div>
                <VolumeSlider
                  value={layer.volume}
                  onChange={(v) => engine.setLayerVolume(texture.id, v)}
                  disabled={!layer.enabled}
                  variant="glass"
                />
              </div>
            </div>
          );
        })}
      </div>

      {!engine.isReady && (
        <p className="text-center text-[10px] tracking-wide text-white/30">
          Press play to start audio
        </p>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SoundIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'cloud-rain':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
          />
        </svg>
      );
    case 'flame':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
          />
        </svg>
      );
    case 'wind':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM2 8h15.5M10 16a2 2 0 100-4 2 2 0 000 4zM2 12h8M14 19a2 2 0 100-4 2 2 0 000 4zM2 17h12"
          />
        </svg>
      );
    case 'waves':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546"
          />
        </svg>
      );
    case 'users':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={className}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      );
    case 'bird':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M16 7h.01M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
          <path d="m20 7 2 .5-2 .5M10 18v3M14 17.75V21M7 18a6 6 0 0 0 3.84-10.61" />
        </svg>
      );
    default:
      return null;
  }
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function MixerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
      />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      className={className}
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      className={className}
    >
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}
