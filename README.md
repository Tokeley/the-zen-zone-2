# The Zen Zone

The primary goal of The Zen Zone is to provide people with calming audio (paired with a calming video of where the audio was recorded) to help them relax or focus.

From Flinders University: *"Ambient noise enhances focus by masking distracting, unpredictable sounds, creating a consistent auditory environment that stabilizes attention and reduces stress. It promotes cognitive performance by stimulating the brain just enough to prevent daydreaming, particularly aiding people with ADHD or low arousal levels to reach optimal concentration."*

A major aspect of The Zen Zone that will be the foundation of its user interface design is that it is primarily geographically navigable. Each scene (a scene is calming audio paired with calming video) is placed on a map. Users navigate and discover new scenes by exploring the map.


## Core features

- **Map view** — Main view is a world map with "scenes" pinned at the location they were recorded
- **Search overlay** — Magnifying glass icon (top-left or top-right) opens a popup with a traditional grid search: search bar + scene grid. Map remains visible, blurred, in the background. Map view stays primary; search is secondary.
- **Scene view** — Clicking a pin opens pop-up with scene title, clicking the pop up opens up a scene: full-screen calm video (e.g. river, farmers market, rainy window) with synced ambient audio
- **Custom mix** — Add ambient layers (rain, fire crackle, wind, white noise, ambient chatter) and adjust levels to create a custom mix
- **No login** — Session tokens persist each user's mix settings when they return
- **Desktop & mobile** — Responsive design; audio continues in background when the app is minimized on mobile
- **Admin** — Protected page to add scenes (title, coordinates, audio file, video file)

## Non-core features (to be added later)

- **Pomodoro timer** — Focus/break timer integrated with the app
- **Onboarding quiz** — First-time visitors take a short quiz; AI uses responses to recommend a scene tailored to their preferences

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Map | Mapbox GL JS |
| Styling | Tailwind CSS |
| Database, auth, admin | Supabase (Postgres, Auth) |
| Scene media (audio/video) | Cloudflare R2 |
| Audio mixing | Web Audio API |


## Getting started

```bash
pnpm install
pnpm dev
```

See [AGENTS.md](./AGENTS.md) for detailed project context and conventions (used by AI coding assistants).