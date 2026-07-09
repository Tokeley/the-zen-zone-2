# The Zen Zone

A map-based ambient sound app. Users explore a world map to discover scenes (video + ambient audio) and can layer ambient additions (rain, fire, wind, etc.) to create custom mixes. No login—session tokens persist mix preferences. Map view is primary; a secondary search view (grid + search bar) is available via magnifying glass icon and appears as a popup with the blurred map visible behind it.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Map | Mapbox GL JS |
| Styling | Tailwind CSS |
| Database, auth, admin | Supabase (Postgres, Auth) |
| Scene media (audio/video) | Cloudflare R2 |
| Audio mixing | Web Audio API |
| Session | localStorage (session token → mix levels) |

## Commands

- `pnpm dev` — Start dev server
- `pnpm build` — Production build
- `pnpm start` — Run production server
- `pnpm lint` — Run ESLint

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Map view (main entry)
│   ├── scene/[id]/page.tsx    # Scene view (video + audio mix)
│   ├── admin/page.tsx         # Admin: add scenes (protected)
│   └── api/                   # API routes
├── components/
│   ├── map/                   # Mapbox map, scene pins
│   ├── scene-search/          # Search overlay: magnifying glass trigger, popup, grid, search bar
│   ├── scene-player/          # Video player, audio mixer UI
│   ├── audio-mixer/           # Web Audio API mixing logic
│   └── admin/                 # Scene form, upload UI
├── lib/
│   ├── supabase.ts            # Supabase client (DB, auth)
│   ├── r2.ts                  # R2 client; presigned URLs or public bucket for scene media
│   ├── audio-engine.ts        # Web Audio API: mix scene + soundscapes
│   └── session.ts             # Session token, persist mix levels
└── data/
    └── soundscapes.ts         # Catalog of add-on sounds (rain, fire, etc.)
```

## Cloudflare R2 buckets (scene media)

- `scenes/{scene-id}/` — per scene:
  - `video.mp4` — silent loop (picture only; played muted in the app)
  - `audio.{wav|flac|mp3|ogg}` — separate loop track for Web Audio playback
  - `thumbnail.jpg` — auto-generated from first video frame on upload
- `soundscapes/` — Reusable texture layers: `rain.mp3`, `fire-crackle.mp3`, `wind.mp3`, `white-noise.mp3`, `ambient-chatter.mp3`

Scene and soundscape files are served from R2 (public bucket URLs stored in Supabase). Supabase handles DB (scene metadata, URLs), auth (admin), and admin UI only.

## Conventions

- Use Server Components by default; add `"use client"` only when needed (e.g. map, audio, interactivity)
- Components live in `src/components/`, organized by feature
- API routes in `src/app/api/`
- Extract business logic to `src/lib/`—avoid putting it in page components
- Use Mapbox GL JS for the world map; scenes are pins at `(lat, lng)`
- Search overlay: magnifying glass icon (top-left or top-right of map) opens a modal. Inside: search bar + scene grid. Map visible behind modal, blurred (e.g. `backdrop-blur`). Clicking a grid item navigates to that scene.

## Key technical notes

1. **Web Audio API** — Scene audio is decoded into an `AudioBuffer` and looped sample-accurately via `AudioBufferSourceNode` (avoids HTMLMediaElement loop gaps). Video stays muted. Texture layers use the same buffer-loop pattern. Mix levels persist via session token → stored gain values → restore on return. Falls back to `MediaElementSource` if decode fails or clip exceeds ~3 minutes.
2. **Mobile background audio** — Start `AudioContext` on user gesture. Design for PWA / in-app playback where possible.
3. **Video** — Keep scenes short (1–3 min), compressed. MP4 (H.264) for compatibility. Upload video and audio as separate files in admin.
4. **Admin** — Protect `/admin` with Supabase Auth (middleware or auth check). Admin uploads video + audio separately to R2 via API route; thumbnail extracted client-side; scene metadata (title, coords, R2 URLs) saved to Supabase. Prefer WAV or FLAC for scene audio (lossless loops).

## Non-core features (to be added later)

- **Pomodoro timer** — Focus/break timer integrated with the app
- **Onboarding quiz** — First-time visitors take a short quiz; AI uses responses to recommend a scene tailored to their preferences

## Avoid

- Don’t add new dependencies without checking bundle size (especially for map/audio)
- Don’t put scene metadata or mixing logic in page components—use `lib/`
- Don’t assume background audio works on all mobile browsers—document limitations
