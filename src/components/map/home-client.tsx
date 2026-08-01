'use client';

import { useEffect, useState } from 'react';
import { MapView } from './map-view';
import { SearchOverlay } from '@/src/components/scene-search/search-overlay';
import { preloadThumbnails } from '@/src/lib/thumbnail-preload';
import type { Scene } from '@/src/data/textures';

interface HomeClientProps {
  scenes: Scene[];
}

export function HomeClient({ scenes }: HomeClientProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Warm the thumbnail cache up front — scene count is small enough today that
  // preloading all of them is cheap. Revisit with viewport/pagination scoping
  // if the catalog grows large enough to make this wasteful.
  useEffect(() => {
    preloadThumbnails(scenes.map((scene) => scene.thumbnailUrl));
  }, [scenes]);

  return (
    <main className="relative h-screen w-full overflow-hidden">
      <MapView scenes={scenes} onSearchOpen={() => setIsSearchOpen(true)} />
      <SearchOverlay
        scenes={scenes}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </main>
  );
}
