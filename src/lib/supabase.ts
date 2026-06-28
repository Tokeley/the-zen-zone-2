import 'server-only';
import { createClient } from '@supabase/supabase-js';

import type { Scene, SceneTag } from '@/src/data/textures';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/src/lib/supabase/config';
import { createClient as createServerSupabaseClient } from '@/src/lib/supabase/server';

// ---------------------------------------------------------------------------
// Database type definitions
// ---------------------------------------------------------------------------

export type SceneRow = {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  video_url: string;
  audio_url: string;
  thumbnail_url: string | null;
  tags: SceneTag[];
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      scenes: {
        Row: SceneRow;
        Insert: Omit<SceneRow, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<SceneRow, 'id' | 'created_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabasePublishableKey();

/**
 * Basic anon client (no cookie session). Use only for unauthenticated data
 * queries (scenes list, etc.) in Server Components. For auth-aware server
 * code (checking session), use createAuthServerClient() instead.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * SSR-aware server client that reads/writes the auth session from cookies.
 * Use this in Server Components or Route Handlers that need to verify auth.
 * Must be called inside an async context where next/headers cookies() works.
 */
export async function createAuthServerClient() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return createServerSupabaseClient(cookieStore);
}

/**
 * Admin client. Uses the service-role key — RLS is bypassed.
 * Call this only inside server-side code (API routes, Server Actions).
 * Never expose the returned client to the browser.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Data helpers (server-only)
// ---------------------------------------------------------------------------

function rowToScene(row: SceneRow): Scene {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    lat: row.lat,
    lng: row.lng,
    videoUrl: row.video_url,
    audioUrl: row.audio_url,
    thumbnailUrl: row.thumbnail_url ?? '',
    tags: row.tags ?? [],
  };
}

/** Returns all scenes ordered by creation date (newest first). */
export async function getScenes(): Promise<Scene[]> {
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[supabase] getScenes error:', error.message);
    return [];
  }

  return (data ?? []).map(rowToScene);
}

/** Returns a single scene by ID, or null if not found. */
export async function getSceneById(id: string): Promise<Scene | null> {
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[supabase] getSceneById error:', error.message);
    }
    return null;
  }

  return rowToScene(data);
}

export type AdminSceneListItem = {
  id: string;
  title: string;
  thumbnailUrl: string;
  createdAt: string;
};

/** Scenes for the admin manage list (newest first). */
export async function getAdminSceneList(): Promise<AdminSceneListItem[]> {
  const { data, error } = await supabase
    .from('scenes')
    .select('id, title, thumbnail_url, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[supabase] getAdminSceneList error:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    thumbnailUrl: row.thumbnail_url ?? '',
    createdAt: row.created_at,
  }));
}
