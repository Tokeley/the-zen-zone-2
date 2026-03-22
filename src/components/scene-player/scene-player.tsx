'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Scene } from '@/src/data/soundscapes';
import { AudioMixer } from '@/src/components/audio-mixer/audio-mixer';

interface ScenePlayerProps {
  scene: Scene;
}

export function ScenePlayer({ scene }: ScenePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  

  useEffect(() => {
    // Auto-play video when loaded
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked
      });
    }
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        src={scene.videoUrl}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
          isVideoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loop
        muted
        playsInline
        onLoadedData={() => setIsVideoLoaded(true)}
      />

      {/* Loading State */}
      {!isVideoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}

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
