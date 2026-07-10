'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Scene } from '@/src/data/textures';
import { AudioMixer } from '@/src/components/audio-mixer/audio-mixer';
import { PomodoroTimer } from '@/src/components/pomodoro/pomodoro-timer';
import { usePomodoroContext } from '@/src/components/pomodoro/pomodoro-provider';
import {
  claimSceneVideoPreload,
  consumeMapSceneEntry,
} from '@/src/lib/scene-video-preload';

interface ScenePlayerProps {
  scene: Scene;
}

function buildVideoClassName(isVideoLoaded: boolean, hasEntered: boolean): string {
  return [
    'absolute inset-0 h-full w-full object-cover transition-[opacity,transform] ease-out',
    isVideoLoaded ? 'opacity-100' : 'opacity-0',
    hasEntered ? 'scale-100 duration-[1400ms]' : 'scale-[1.12] duration-[1400ms]',
  ].join(' ');
}

export function ScenePlayer({ scene }: ScenePlayerProps) {
  const videoHostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [mixerOpen, setMixerOpen] = useState(false);
  const {
    isPanelOpen: pomodoroOpen,
    closePanel: closePomodoroPanel,
    status: pomodoroStatus,
    pause: pausePomodoro,
  } = usePomodoroContext();

  const toggleMixer = useCallback(() => {
    setMixerOpen((v) => !v);
    if (window.innerWidth < 720) closePomodoroPanel();
  }, [closePomodoroPanel]);

  // Mirror the mixer's narrow-viewport exclusivity: closing/opening the Pomodoro
  // panel should also collapse the mixer.
  useEffect(() => {
    if (pomodoroOpen && window.innerWidth < 720) setMixerOpen(false);
  }, [pomodoroOpen]);

  // Pause the Pomodoro timer when leaving this scene (e.g. back to the map) —
  // it shouldn't keep counting down while the user isn't looking at a scene.
  const pomodoroStatusRef = useRef(pomodoroStatus);
  pomodoroStatusRef.current = pomodoroStatus;
  useEffect(() => {
    return () => {
      if (pomodoroStatusRef.current === 'running') pausePomodoro();
    };
  }, [pausePomodoro]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setHasEntered(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Mount video — reuse map preloaded element when entering from the map zoom
  useEffect(() => {
    const host = videoHostRef.current;
    if (!host) return;

    const fromMap = consumeMapSceneEntry(scene.id);
    const preloaded = fromMap ? claimSceneVideoPreload(scene.id) : null;
    const owned = !preloaded;

    const video = preloaded ?? document.createElement('video');
    if (owned) {
      video.src = scene.videoUrl;
    }

    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.className = buildVideoClassName(false, false);

    host.replaceChildren(video);
    videoRef.current = video;

    const markLoaded = () => setIsVideoLoaded(true);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      markLoaded();
    } else {
      video.addEventListener('loadeddata', markLoaded, { once: true });
    }

    video.play().catch(() => {});

    return () => {
      video.removeEventListener('loadeddata', markLoaded);
      video.pause();
      video.remove();
      videoRef.current = null;
    };
  }, [scene.id, scene.videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.className = buildVideoClassName(isVideoLoaded, hasEntered);
  }, [isVideoLoaded, hasEntered]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div ref={videoHostRef} className="absolute inset-0" />

      {!isVideoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        </div>
      )}

      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-40 bg-black transition-opacity duration-700 ${
          hasEntered ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-foreground/20 via-transparent to-foreground/40" />

      <nav className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-light tracking-widest uppercase text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Map</span>
        </Link>

        <h1 className="text-sm font-light tracking-widest uppercase text-card/90">
          {scene.title}
        </h1>
      </nav>

      <AudioMixer scene={scene} videoRef={videoRef} isOpen={mixerOpen} onToggle={toggleMixer} />

      <PomodoroTimer />
    </div>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
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
        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
      />
    </svg>
  );
}
