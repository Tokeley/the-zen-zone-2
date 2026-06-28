'use client';

/**
 * Keeps off-screen <video> elements warm while a map popup is open.
 * ScenePlayer claims the element when entering from the map zoom transition.
 */

const preloads = new Map<string, { video: HTMLVideoElement; url: string }>();

const MAP_ENTRY_KEY = 'zen-scene-from-map';

function getPool(): HTMLElement {
  let pool = document.getElementById('zen-scene-preload-pool');
  if (!pool) {
    pool = document.createElement('div');
    pool.id = 'zen-scene-preload-pool';
    pool.hidden = true;
    pool.setAttribute('aria-hidden', 'true');
    document.body.appendChild(pool);
  }
  return pool;
}

/** Begin fetching/decoding a scene video (map popup open). */
export function preloadSceneVideo(sceneId: string, videoUrl: string): void {
  if (!videoUrl) return;

  const existing = preloads.get(sceneId);
  if (existing?.url === videoUrl) return;

  if (existing) {
    existing.video.remove();
    preloads.delete(sceneId);
  }

  const video = document.createElement('video');
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.src = videoUrl;
  getPool().appendChild(video);
  video.load();

  preloads.set(sceneId, { video, url: videoUrl });
}

/** Drop a preload when the popup closes or the user picks another pin. */
export function releaseSceneVideoPreload(sceneId: string): void {
  const entry = preloads.get(sceneId);
  if (!entry) return;
  entry.video.remove();
  preloads.delete(sceneId);
}

/** Take ownership of a preloaded video for the scene page (map entry only). */
export function claimSceneVideoPreload(sceneId: string): HTMLVideoElement | null {
  const entry = preloads.get(sceneId);
  if (!entry) return null;
  preloads.delete(sceneId);
  entry.video.remove();
  return entry.video;
}

export function markMapSceneEntry(sceneId: string): void {
  try {
    sessionStorage.setItem(MAP_ENTRY_KEY, sceneId);
  } catch {
    // ignore
  }
}

export function consumeMapSceneEntry(sceneId: string): boolean {
  try {
    const stored = sessionStorage.getItem(MAP_ENTRY_KEY);
    if (stored !== sceneId) return false;
    sessionStorage.removeItem(MAP_ENTRY_KEY);
    return true;
  } catch {
    return false;
  }
}
