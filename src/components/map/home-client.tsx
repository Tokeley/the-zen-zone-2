'use client';

import { useState } from 'react';
import { MapView } from './map-view';
import { SearchOverlay } from '@/src/components/scene-search/search-overlay';
import type { Scene } from '@/src/data/textures';

interface HomeClientProps {
  scenes: Scene[];
}

export function HomeClient({ scenes }: HomeClientProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
