'use client';

import { useState } from 'react';
import { MapView } from '@/src/components/map/map-view';
import { SearchOverlay } from '@/src/components/scene-search/search-overlay';

export default function HomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <main className="relative h-screen w-full overflow-hidden">
      <MapView onSearchOpen={() => setIsSearchOpen(true)} />
      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </main>
  );
}
