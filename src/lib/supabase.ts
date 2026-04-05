import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { SceneTag } from '@/src/data/textures';

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-safe client. Uses the anon key and respects Row Level Security.
 * Safe to import in both Server Components and Client Components.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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
