import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase';
import type { Scene } from '@/src/data/textures';
import type { SceneRow } from '@/src/lib/supabase';

// Revalidate at most once per minute so the map pins stay fresh
// without hammering Supabase on every request.
export const revalidate = 60;

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

export async function GET() {
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const scenes: Scene[] = (data ?? []).map(rowToScene);
  return NextResponse.json(scenes);
}
