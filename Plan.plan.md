---
name: 4-Week Build Plan
overview: A structured 4-week plan to build The Zen Zone from design through production-ready shipping, covering UI design, infrastructure setup, feature development, and testing.
todos:
  - id: phase1-design
    content: "Phase 1: Generate UI designs in v0.dev for all screens, establish design tokens in tailwind.config.ts"
    status: pending
  - id: phase1-infra
    content: "Phase 1: Provision Supabase, Cloudflare R2, Mapbox; bootstrap Next.js project with all env vars; set up GitHub Actions CI"
    status: pending
  - id: phase2-api
    content: "Phase 2: Build Supabase schema and API routes (GET /api/scenes, GET /api/scenes/[id])"
    status: pending
  - id: phase2-map
    content: "Phase 2: Build full-screen Mapbox map view with scene pins and popup navigation"
    status: pending
  - id: phase2-scene
    content: "Phase 2: Build scene view with full-screen video and synced audio"
    status: pending
  - id: phase2-mixer
    content: "Phase 2: Build Web Audio API mixer with GainNodes and localStorage session persistence"
    status: pending
  - id: phase2-search
    content: "Phase 2: Build search overlay with backdrop-blur modal, scene grid, and search bar"
    status: pending
  - id: phase3-admin
    content: "Phase 3: Build protected admin page with Supabase Auth, scene form, and R2 file upload"
    status: pending
  - id: phase3-polish
    content: "Phase 3: Responsive design, mobile audio handling, loading/error states, accessibility, Lighthouse audit"
    status: pending
  - id: phase4-testing
    content: "Phase 4: Write unit tests (vitest), integration tests (@testing-library/react), and E2E tests (Playwright)"
    status: pending
  - id: phase4-launch
    content: "Phase 4: Deploy to Vercel, verify R2/Supabase production config, add Sentry, launch"
    status: pending
isProject: false
---

# The Zen Zone — 4-Week Build Plan

## Overview

This is a properly engineered, production-ready build — not a prototype. Four phases map cleanly to one week each. Each phase has a clear deliverable you can demo or review before moving on.

---

## Phase 1 — Design & Infrastructure (Week 1)

### UI Design

The design should be done *before* a single component is written. Two recommended approaches:

**Option A — v0 by Vercel (recommended for this stack)**

- Prompt-to-component UI generation, outputs React + Tailwind directly
- Since the stack is Next.js + Tailwind, generated code drops straight in
- Design the map view, scene player, search overlay, and admin page here
- URL: [v0.dev](https://v0.dev)

**Option B — Galileo AI**

- High-fidelity UI mockup generation from text prompts (more design-focused, less code-focused)
- Good if you want polished Figma-like screens before writing any code
- Export to Figma for refinement

**Recommended flow:**

1. Use v0 to generate screen layouts for: map view, scene popup, scene player with mixer, search overlay, admin form
2. Screenshot / export and consolidate into a simple Figma file for final decisions on spacing, color, typography
3. Establish a small design token set: primary background color (dark, immersive), accent color, font family — encode these in `tailwind.config.ts`

### Infrastructure Setup

- **Supabase** — Create project, define `scenes` table schema:

```
  scenes(id, title, lat, lng, video_url, audio_url, description, created_at)
  

```

  Enable Supabase Auth for admin route protection

- **Cloudflare R2** — Create two buckets: `scenes/` and `soundscapes/`; configure public access or CORS for presigned URLs
- **Mapbox** — Register account, get API token, set allowed URLs
- **Next.js project** — Bootstrap with `pnpm create next-app`, configure Tailwind, add `.env.local` with all keys
- **CI** — Set up GitHub Actions: lint + type-check on every PR

### Deliverable

All third-party services provisioned, env vars wired, app boots with a blank map on screen. Design screens signed off.

---

## Phase 2 — Core Features (Week 2)

Build in this order (each unblocks the next):

1. **Database + API layer** (`src/lib/supabase.ts`, `src/app/api/scenes/`)
  - `GET /api/scenes` — return all scenes with coordinates
  - `GET /api/scenes/[id]` — return single scene with media URLs
2. **Map view** (`src/app/page.tsx`, `src/components/map/`)
  - Mapbox GL JS map, full-screen
  - Scene pins rendered from Supabase data
  - Pin click → popup with scene title
  - Popup click → navigate to `/scene/[id]`
3. **Scene view** (`src/app/scene/[id]/page.tsx`, `src/components/scene-player/`)
  - Full-screen looping video (served from R2)
  - Synced ambient audio via Web Audio API
  - Back button → return to map
4. **Audio mixer** (`src/lib/audio-engine.ts`, `src/components/audio-mixer/`, `src/data/soundscapes.ts`)
  - Layer controls for rain, fire, wind, white noise, ambient chatter
  - `GainNode` per layer; master gain for scene audio
  - Session token → `localStorage` persists gain values per scene
5. **Search overlay** (`src/components/scene-search/`)
  - Magnifying glass icon on map
  - Modal with `backdrop-blur`, scene grid, search bar filtering by title
  - Grid item click → navigate to scene

### Deliverable

End-to-end flow: map → pin → scene player with mixer → search overlay. Mix levels persist across sessions.

---

## Phase 3 — Admin, Polish & Mobile (Week 3)

### Admin

- **Protected route** — Supabase Auth middleware on `/admin`
- **Admin page** (`src/app/admin/page.tsx`, `src/components/admin/`)
  - Form: title, lat/lng, description
  - File upload: video + audio → `POST /api/admin/upload` → R2 via presigned URL
  - On success: insert scene row into Supabase

### Polish

- **Responsive design** — Test every screen at 375px, 768px, 1440px
- **Mobile audio** — `AudioContext` started on user gesture (tap), not on load; document iOS/Android limitations in code comments
- **Loading states** — Skeleton loaders for map pins, scene player
- **Error states** — Graceful fallback if R2 URL fails or map token is invalid
- **Accessibility** — ARIA labels on controls, keyboard navigation for mixer sliders

### Performance

- Lazy load Mapbox (`dynamic(() => import(...), { ssr: false })`)
- `next/image` for any static images
- Video: confirm H.264 MP4, sensible bitrate (aim <10MB for a 2-min clip)
- Lighthouse audit — target 90+ performance on desktop

### Deliverable

Admin can add a scene end-to-end. App is responsive, accessible, and passes Lighthouse audit.

---

## Phase 4 — Testing, Hardening & Launch (Week 4)

### Testing Strategy

**Unit tests** — `vitest` (fast, works natively with Vite/Next.js)

- `src/lib/audio-engine.ts` — test gain calculations, session restore logic
- `src/lib/session.ts` — test token generation, localStorage read/write

**Integration tests** — `@testing-library/react` + `vitest`

- `AudioMixer` component — knob interaction updates gain
- `SceneSearch` component — typing filters scene grid correctly
- Map pin click — opens correct popup

**E2E tests** — `Playwright`

- Map loads and pins appear
- Pin click → popup → navigate to scene
- Scene player starts, audio layers toggle
- Search overlay opens, filters, navigates
- Admin: login → upload → scene appears on map

**API tests** — Playwright API testing or `vitest` with `msw`

- `GET /api/scenes` returns correct shape
- Admin upload route rejects unauthenticated requests

### Launch Checklist

- All env vars set in Vercel dashboard
- R2 CORS and public access verified in production
- Supabase RLS policies: public read on `scenes`, admin-only write
- Custom domain (if applicable)
- `robots.txt`, `sitemap.xml`, basic SEO meta tags
- Error monitoring — add Sentry (free tier) for runtime error capture

### Deliverable

Test suite passing in CI. App deployed to Vercel production URL.

---

## Timeline Summary


| Week | Phase            | Key Deliverable                                          |
| ---- | ---------------- | -------------------------------------------------------- |
| 1    | Design + Infra   | Design screens approved, services provisioned, app boots |
| 2    | Core Features    | Full map → scene → mixer flow working                    |
| 3    | Admin + Polish   | Admin upload works, responsive + accessible              |
| 4    | Testing + Launch | E2E tests passing, deployed to production                |


---

## AI Tools Reference


| Tool                                    | Use Case                                           |
| --------------------------------------- | -------------------------------------------------- |
| [v0.dev](https://v0.dev)                | Generate React/Tailwind UI components from prompts |
| [Galileo AI](https://www.usegalileo.ai) | High-fidelity UI screen generation (Figma-style)   |
| [Cursor](https://cursor.sh)             | AI-assisted coding throughout                      |
| [Sentry](https://sentry.io)             | Error monitoring post-launch                       |


