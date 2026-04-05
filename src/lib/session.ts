// Mix levels persisted per-scene in localStorage.
// Key format: "zen-mix:{sceneId}"
// No login required — anonymous session token identifies the browser.

const STORAGE_PREFIX = 'zen-mix:';
const DEFAULT_MASTER = 75;
const DEFAULT_LAYER_VOLUME = 50;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LayerMix {
  enabled: boolean;
  volume: number; // 0–100
}

export interface MixState {
  master: number; // 0–100
  layers: Record<string, LayerMix>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function makeDefaultMixState(layerIds: string[]): MixState {
  return {
    master: DEFAULT_MASTER,
    layers: Object.fromEntries(
      layerIds.map((id) => [id, { enabled: false, volume: DEFAULT_LAYER_VOLUME }])
    ),
  };
}

/**
 * Reads the saved mix state for a scene from localStorage.
 * Falls back to sensible defaults if nothing is stored or parsing fails.
 */
export function loadMixState(sceneId: string, layerIds: string[]): MixState {
  if (typeof window === 'undefined') return makeDefaultMixState(layerIds);
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${sceneId}`);
    if (!raw) return makeDefaultMixState(layerIds);
    const parsed = JSON.parse(raw) as Partial<MixState>;
    return {
      master: typeof parsed.master === 'number' ? parsed.master : DEFAULT_MASTER,
      layers: Object.fromEntries(
        layerIds.map((id) => [
          id,
          {
            enabled: parsed.layers?.[id]?.enabled ?? false,
            volume: parsed.layers?.[id]?.volume ?? DEFAULT_LAYER_VOLUME,
          },
        ])
      ),
    };
  } catch {
    return makeDefaultMixState(layerIds);
  }
}

/**
 * Writes the current mix state to localStorage.
 * Silently ignores errors (quota exceeded, private browsing, etc.).
 */
export function saveMixState(sceneId: string, state: MixState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${sceneId}`, JSON.stringify(state));
  } catch {
    // Intentionally swallowed
  }
}
