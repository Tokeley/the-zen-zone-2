'use client';

import { useState, useMemo, useEffect } from 'react';
import { scenes, filterGroups, SceneTag } from '@/src/data/soundscapes';
import { SceneCard } from './scene-card';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<SceneTag>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleFilter = (tag: SceneTag) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const filteredScenes = useMemo(() => {
    return scenes.filter((scene) => {
      const matchesQuery =
        !searchQuery.trim() ||
        scene.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scene.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilters =
        activeFilters.size === 0 ||
        [...activeFilters].every((tag) => scene.tags.includes(tag));

      return matchesQuery && matchesFilters;
    });
  }, [searchQuery, activeFilters]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop — click to close */}
      <div
        className="absolute inset-0 bg-background/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — pinned to same position as the search button (top-4, centred) */}
      <div className="fixed left-1/2 top-4 z-10 w-full max-w-xl -translate-x-1/2 px-4">
        <div className="animate-in fade-in zoom-in-95 duration-200 origin-top">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-md">

            {/* Search bar — mirrors the button's pill shape */}
            <div className="flex items-center gap-3 px-5 py-3">
              <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Explore scenes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm font-light text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                autoFocus
              />
              <button
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-border/60" />

            {/* Filters toggle row */}
            <div className="px-4 py-2">
              <button
                onClick={() => setFiltersOpen((o) => !o)}
                className="flex items-center gap-1.5 text-xs font-light tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Filters</span>
                {activeFilters.size > 0 && (
                  <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-accent">
                    {activeFilters.size}
                  </span>
                )}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`h-3 w-3 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Collapsible filter chips */}
              <div className={`overflow-hidden transition-all duration-200 ${filtersOpen ? 'mt-3 max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="space-y-2">
                  {filterGroups.map((group) => (
                    <div key={group.label} className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-xs font-light tracking-wider text-muted-foreground/60 uppercase">
                        {group.label}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {group.tags.map((tag) => {
                          const active = activeFilters.has(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => toggleFilter(tag)}
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-light transition-all duration-150 ${
                                active
                                  ? 'border-accent bg-accent/10 text-accent'
                                  : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {activeFilters.size > 0 && (
                    <button
                      onClick={() => setActiveFilters(new Set())}
                      className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline underline-offset-2"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-border/60" />

            {/* Scene grid */}
            <div className="max-h-[65vh] overflow-y-auto p-4">
              {filteredScenes.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {filteredScenes.map((scene) => (
                    <SceneCard key={scene.id} scene={scene} />
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-xs text-muted-foreground">
                    No scenes found matching &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
