'use client';

import { useState, useCallback, useMemo } from 'react';
import { Scene, textures } from '@/src/data/textures';
import { VolumeSlider } from './volume-slider';

interface AudioMixerProps {
  scene: Scene;
}

interface AudioState {
  id: string;
  enabled: boolean;
  volume: number;
}

// Create initial state outside component to ensure all sounds are included
const createInitialAmbientLayers = (): AudioState[] =>
  textures.map((sound) => ({
    id: sound.id,
    enabled: false,
    volume: 50,
  }));

export function AudioMixer({ scene }: AudioMixerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Main scene audio state
  const [mainVolume, setMainVolume] = useState(75);
  const [isMainPlaying, setIsMainPlaying] = useState(true);

  // Ambient layers state
  const [ambientLayers, setAmbientLayers] = useState<AudioState[]>(createInitialAmbientLayers);

  const toggleAmbientLayer = useCallback((id: string) => {
    setAmbientLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, enabled: !layer.enabled } : layer
      )
    );
  }, []);

  const setAmbientVolume = useCallback((id: string, volume: number) => {
    setAmbientLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, volume } : layer
      )
    );
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-20">
      {/* Always visible play/pause button with toggle arrow */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsMainPlaying(!isMainPlaying)}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-md transition-colors hover:bg-black/40"
          aria-label={isMainPlaying ? 'Pause' : 'Play'}
        >
          {isMainPlaying ? (
            <PauseIcon className="h-5 w-5 text-white" />
          ) : (
            <PlayIcon className="h-5 w-5 text-white" />
          )}
        </button>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
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
        className={`absolute bottom-16 left-0 rounded-lg border border-white/20 bg-black/30 p-5 min-w-[320px] md:min-w-[500px] transition-all duration-300 ease-out ${
          isExpanded 
            ? 'translate-y-0 opacity-100 pointer-events-auto' 
            : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <MixerContent
            scene={scene}
            mainVolume={mainVolume}
            setMainVolume={setMainVolume}
            isMainPlaying={isMainPlaying}
            setIsMainPlaying={setIsMainPlaying}
            ambientLayers={ambientLayers}
            toggleAmbientLayer={toggleAmbientLayer}
            setAmbientVolume={setAmbientVolume}
        />
      </div>
    </div>
  );
}

interface MixerContentProps {
  scene: Scene;
  mainVolume: number;
  setMainVolume: (v: number) => void;
  isMainPlaying: boolean;
  setIsMainPlaying: (v: boolean) => void;
  ambientLayers: AudioState[];
  toggleAmbientLayer: (id: string) => void;
  setAmbientVolume: (id: string, volume: number) => void;
}

function MixerContent({
  scene,
  mainVolume,
  setMainVolume,
  ambientLayers,
  toggleAmbientLayer,
  setAmbientVolume,
}: MixerContentProps) {
  return (
    <div className="space-y-4">
      {/* Main Track */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-light text-white/90">{scene.title} Scene Volume</span>
            <span className="text-xs text-white/60">{mainVolume}%</span>
          </div>
          <VolumeSlider value={mainVolume} onChange={setMainVolume} variant="glass" />
        </div>
      </div>

      <div className="h-px w-full bg-white/20" />

      {/* Ambient Layers */}
      <div className="grid gap-3 md:grid-cols-2">
        {textures.map((sound) => {
          const layer = ambientLayers.find((l) => l.id === sound.id) || {
            id: sound.id,
            enabled: false,
            volume: 50,
          };

          return (
            <div key={sound.id} className="flex items-center gap-3">
              <button
                onClick={() => toggleAmbientLayer(sound.id)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  layer.enabled
                    ? 'border-white/40 bg-white/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/50 hover:bg-white/10'
                }`}
                aria-label={`Toggle ${sound.name}`}
              >
                <SoundIcon name={sound.icon} className="h-3 w-3" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center justify-between">
                  <span className={`text-xs truncate ${layer.enabled ? 'text-white/90' : 'text-white/50'}`}>
                    {sound.name}
                  </span>
                  {layer.enabled && (
                    <span className="text-xs text-white/60 ml-2">{layer.volume}%</span>
                  )}
                </div>
                <VolumeSlider
                  value={layer.volume}
                  onChange={(v) => setAmbientVolume(sound.id, v)}
                  disabled={!layer.enabled}
                  variant="glass"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SoundIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'cloud-rain':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        </svg>
      );
    case 'flame':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        </svg>
      );
    case 'wind':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM2 8h15.5M10 16a2 2 0 100-4 2 2 0 000 4zM2 12h8M14 19a2 2 0 100-4 2 2 0 000 4zM2 17h12" />
        </svg>
      );
    case 'bird':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M16 7h.01M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
          <path d="m20 7 2 .5-2 .5M10 18v3M14 17.75V21M7 18a6 6 0 0 0 3.84-10.61" />
        </svg>
      );
    case 'waves':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546" />
        </svg>
      );
    case 'users':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      );
    default:
      return null;
  }
}

function MixerIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}
