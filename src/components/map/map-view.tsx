'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Map, { Marker, Popup, MapRef } from 'react-map-gl';
import type { Scene } from '@/src/data/textures';
import {
  markMapSceneEntry,
  preloadSceneVideo,
  releaseSceneVideoPreload,
} from '@/src/lib/scene-video-preload';
import { useRouter } from 'next/navigation';
import { SidePanel } from './side-panel';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAP_VIEW_STATE_KEY = 'zen-map-view-state';
// Snapshot taken just before the zoom-in animation so we can restore it on return
const MAP_RETURN_STATE_KEY = 'zen-map-return-state';

// First load: centered on Auckland, where all current scenes are located
const INITIAL_FIRST_LOAD = {
  longitude: 174.76,
  latitude: -36.85,
  zoom: 10.5,
};

/** Minimum zoom when selecting a pin — only zoom in if the map is more zoomed out than this. */
const PIN_SELECT_ZOOM = 5;

function getSavedViewState(): {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
} {
  if (typeof window === 'undefined') return INITIAL_FIRST_LOAD;
  try {
    // Prefer the pre-zoom snapshot when returning from a scene
    const returnRaw = sessionStorage.getItem(MAP_RETURN_STATE_KEY);
    if (returnRaw) {
      sessionStorage.removeItem(MAP_RETURN_STATE_KEY);
      return JSON.parse(returnRaw);
    }
    const raw = sessionStorage.getItem(MAP_VIEW_STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return INITIAL_FIRST_LOAD;
}

interface MapViewProps {
  scenes: Scene[];
  onSearchOpen: () => void;
}

export function MapView({ scenes, onSearchOpen }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const router = useRouter();
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'about' | 'contact' | null>(null);
  const panelOpen = activePanel !== null;
  const navRightClass = panelOpen ? 'right-6 sm:right-[calc(100%/3+1.5rem)]' : 'right-6';
  const [viewState, setViewState] = useState(getSavedViewState);
  const [isZoomingIn, setIsZoomingIn] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const userHasInteractedRef = useRef(false);

  useEffect(() => {
    userHasInteractedRef.current = userHasInteracted;
  }, [userHasInteracted]);

  const handleUserInteraction = useCallback(() => {
    userHasInteractedRef.current = true;
    setUserHasInteracted(true);
  }, []);

  const handleMarkerClick = useCallback((scene: Scene) => {
    setSelectedScene((prev) => {
      if (!prev || prev.id !== scene.id) {
        if (prev) releaseSceneVideoPreload(prev.id);
        setThumbnailLoaded(false);
      }
      return scene;
    });
    preloadSceneVideo(scene.id, scene.videoUrl);
    const currentZoom = mapRef.current?.getMap()?.getZoom() ?? PIN_SELECT_ZOOM;
    mapRef.current?.flyTo({
      center: [scene.lng, scene.lat],
      zoom: Math.max(currentZoom, PIN_SELECT_ZOOM),
      duration: 1200,
    });
  }, []);

  const handlePopupClose = useCallback(() => {
    setSelectedScene((prev) => {
      if (prev) releaseSceneVideoPreload(prev.id);
      return null;
    });
  }, []);

  const handlePopupNavigate = useCallback(() => {
    if (!selectedScene) return;

    // Snapshot the current position before the zoom-in overwrites sessionStorage
    try {
      sessionStorage.setItem(MAP_RETURN_STATE_KEY, JSON.stringify(viewState));
    } catch {
      // ignore
    }

    // Rapidly zoom the map into the scene location
    mapRef.current?.flyTo({
      center: [selectedScene.lng, selectedScene.lat],
      zoom: 14,
      duration: 750,
      essential: true,
    });

    // Trigger the circular portal overlay
    setIsZoomingIn(true);

    // Navigate once the overlay has fully covered the screen
    const sceneId = selectedScene.id;
    markMapSceneEntry(sceneId);
    setTimeout(() => {
      router.push(`/scene/${sceneId}`);
    }, 750);
  }, [selectedScene, viewState, router]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Title + logo — direct child so mix-blend-difference works against the map */}
      <div className="absolute left-6 top-4 z-20 flex h-10 items-center gap-2.5 text-white mix-blend-difference">
        <span className="text-xl font-light tracking-widest uppercase">
          <span className="hidden sm:inline">The Zen Zone</span>
          <span className="inline sm:hidden">TZZ</span>
        </span>
        <ZenLogo className="h-6 w-6" />
      </div>

      {/* Explore button — centred */}
      <button
        onClick={onSearchOpen}
        className="absolute left-1/2 top-4 z-20 -translate-x-1/2 flex items-center gap-2 rounded-full bg-card/50 border border-border/60 backdrop-blur-sm px-10 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-card/70 transition-colors"
        aria-label="Search scenes"
      >
        <SearchIcon className="h-4 w-4" />
        <span>Explore</span>
      </button>

      {/* Burger / X — direct child so mix-blend-difference works against the map */}
      <button
        onClick={() => {
          if (activePanel) {
            setActivePanel(null);
          } else {
            setMenuOpen((o) => !o);
          }
        }}
        className={`absolute top-4 z-20 flex h-10 items-center px-2 mix-blend-difference transition-[right] duration-300 ease-out ${navRightClass}`}
        aria-label={menuOpen || panelOpen ? 'Close menu' : 'Open menu'}
      >
        <div className="flex flex-col gap-1.5">
          <span className={`block h-px w-6 bg-white origin-center transition-all duration-300 ${menuOpen || panelOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`block h-px w-6 bg-white transition-all duration-300 ${menuOpen || panelOpen ? 'opacity-0 scale-x-0' : ''}`} />
          <span className={`block h-px w-6 bg-white origin-center transition-all duration-300 ${menuOpen || panelOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </div>
      </button>

      {/* Dropdown menu */}
      <div
        className={`absolute top-20 z-20 mix-blend-difference transition-all duration-300 ${navRightClass} ${
          menuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col text-right">
          <button
            onClick={() => { setActivePanel('about'); setMenuOpen(false); }}
            className="py-3 text-sm font-light tracking-widest uppercase text-white hover:opacity-60 transition-opacity text-right"
          >
            About
          </button>
          <div className="h-px w-full bg-white/40" />
          <button
            onClick={() => { setActivePanel('contact'); setMenuOpen(false); }}
            className="py-3 text-sm font-light tracking-widest uppercase text-white hover:opacity-60 transition-opacity text-right"
          >
            Contact
          </button>
        </nav>
      </div>

      {/* About / Contact side panel */}
      <SidePanel content={activePanel} />

      {/* Map */}
      <Map
        ref={mapRef}
        {...viewState}
        projection={{ name: 'globe' }}
        onLoad={() => setMapLoaded(true)}
        onMove={(evt) => {
          setViewState(evt.viewState);
          try {
            sessionStorage.setItem(MAP_VIEW_STATE_KEY, JSON.stringify(evt.viewState));
          } catch {
            // ignore
          }
        }}
        onMouseDown={handleUserInteraction}
        onTouchStart={handleUserInteraction}
        onWheel={handleUserInteraction}
        onDragStart={handleUserInteraction}
        onZoomStart={handleUserInteraction}
        onRotateStart={handleUserInteraction}
        onPitchStart={handleUserInteraction}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtby12MCIsImEiOiJjbHd4eWV6eGowMDFqMmlxd2F5OXRwMWZpIn0.demo-token'}
        attributionControl={false}
        fog={{
          color: 'rgb(240, 239, 237)',
          'high-color': 'rgb(240, 239, 237)',
          'horizon-blend': 0.1,
        }}
      >
        {mapLoaded &&
          scenes.map((scene) => (
            <Marker
              key={scene.id}
              longitude={scene.lng}
              latitude={scene.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(scene);
              }}
            >
              <div
                className={`group cursor-pointer transition-all duration-300 ${
                  selectedScene?.id === scene.id ? 'scale-125' : 'hover:scale-125'
                }`}
              >
                <div className={`h-4 w-4 rounded-full border-2 border-white/60 shadow-sm transition-colors duration-300 ${
                  selectedScene?.id === scene.id
                    ? 'bg-accent'
                    : 'bg-accent group-hover:bg-accent/70'
                }`} />
              </div>
            </Marker>
          ))}

        {selectedScene && (
          <Popup
            longitude={selectedScene.lng}
            latitude={selectedScene.lat}
            anchor="bottom"
            offset={20}
            closeOnClick={false}
            onClose={handlePopupClose}
            className="zen-popup"
          >
            <div className="w-full">
              {/* Thumbnail */}
              <div className="relative aspect-[16/9] overflow-hidden rounded-t-sm bg-muted">
                <Image
                  src={selectedScene.thumbnailUrl}
                  alt={selectedScene.title}
                  fill
                  className="object-cover"
                  sizes="240px"
                  onLoad={() => setThumbnailLoaded(true)}
                />
                {!thumbnailLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
                  </div>
                )}
              </div>

              {/* Text content */}
              <div className="p-4">
                <h3 className="text-sm font-normal tracking-wide text-foreground">
                  {selectedScene.title}
                </h3>
                <div className="my-2 h-px w-full bg-border" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedScene.description}
                </p>

                {/* Enter Scene button */}
                <button
                  onClick={handlePopupNavigate}
                  className="mt-4 w-full rounded-full border border-accent px-4 py-2 text-xs font-light tracking-widest uppercase text-accent transition-all duration-150 hover:bg-accent/10 active:scale-95 active:bg-accent/20"
                >
                  Enter Scene
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Map loading spinner — covers the canvas until the map style/tiles have loaded */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-4 left-4 z-10">
        <p className="text-xs text-muted-foreground/60 font-light">
          Click a marker to explore
        </p>
      </div>

      {/* Portal zoom overlay — expands from the centre on "Enter Scene" */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-50"
        style={{
          background: isZoomingIn ? 'black' : 'oklch(0.56 0.04 135)',
          clipPath: isZoomingIn ? 'circle(150% at 50% 50%)' : 'circle(0% at 50% 50%)',
          transition: isZoomingIn
            ? 'clip-path 750ms cubic-bezier(0.7, 0, 1, 1), background-color 750ms ease-in'
            : 'none',
        }}
      />
    </div>
  );
}

function ZenLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Filled circle — matches the map pin style */}
      <circle cx="6" cy="12" r="3" fill="currentColor" />
      {/* Sound waves — right-side arcs of increasing radius, inset to clear the stroke */}
      <path d="M 6,7 A 5,5 0 0,1 6,17"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 6,4 A 8,8 0 0,1 6,20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}
