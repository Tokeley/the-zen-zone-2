'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Scene } from '@/src/data/soundscapes';
import { AudioMixer } from '@/src/components/audio-mixer/audio-mixer';

interface ScenePlayerProps {
  scene: Scene;
}

export function ScenePlayer({ scene }: ScenePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const searchParams = useSearchParams();
  const fromMap = searchParams.get('from') === 'map';

  useEffect(() => {
    // Slight delay so the browser can paint the scaled-up starting state first
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setHasEntered(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Video Background — starts slightly zoomed in and settles to fill */}
      <video
        ref={videoRef}
        src={scene.videoUrl}
        className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] ease-out ${
          isVideoLoaded ? 'opacity-100' : 'opacity-0'
        } ${fromMap ? (hasEntered ? 'scale-100 duration-[1400ms]' : 'scale-[1.12] duration-[1400ms]') : ''}`}
        loop
        muted
        playsInline
        onLoadedData={() => setIsVideoLoaded(true)}
      />

      {/* Green curtain — always shown while loading; fades to reveal video once ready.
          For map transitions it also covers the portal animation handoff. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-40 bg-accent transition-opacity duration-500 ${
          isVideoLoaded && (fromMap ? hasEntered : true) ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Spinner visible while the video is still buffering */}
        {!isVideoLoaded && (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Overlay gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/20 via-transparent to-foreground/40" />

      {/* Navigation */}
      <nav className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-light tracking-widest uppercase text-card transition-colors hover:text-accent"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Map</span>
        </Link>
        
        <h1 className="text-sm font-light tracking-widest uppercase text-card/90">
          {scene.title}
        </h1>
      </nav>

      {/* Audio Mixer */}
      <AudioMixer scene={scene} />
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
