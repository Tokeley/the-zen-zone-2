'use client';

/**
 * Warms the browser's HTTP cache for scene thumbnails so the map popup, Explore
 * grid, and admin list render instantly instead of showing their loading spinners.
 * Relies on `images.unoptimized` in next.config so <Image> requests this same URL.
 */

const preloaded = new Set<string>();

export function preloadThumbnails(urls: string[]): void {
  for (const url of urls) {
    if (!url || preloaded.has(url)) continue;
    preloaded.add(url);
    const img = new window.Image();
    img.src = url;
  }
}
