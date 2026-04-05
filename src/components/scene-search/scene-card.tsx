'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Scene } from '@/src/data/textures';

interface SceneCardProps {
  scene: Scene;
}

export function SceneCard({ scene }: SceneCardProps) {
  return (
    <Link
      href={`/scene/${scene.id}`}
      className="group block"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
        <Image
          src={scene.thumbnailUrl}
          alt={scene.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="200px"
        />
        <div className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/10" />
      </div>

      <div className="mt-2">
        <p className="truncate text-xs font-normal tracking-wide text-foreground group-hover:text-accent transition-colors">
          {scene.title}
        </p>
        <div className="my-1.5 h-px w-full bg-border" />
        <p className="text-xs font-light text-muted-foreground leading-relaxed line-clamp-2">
          {scene.description}
        </p>
      </div>
    </Link>
  );
}
