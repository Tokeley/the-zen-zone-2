import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase';
import type { Scene } from '@/src/data/textures';
import type { SceneRow } from '@/src/lib/supabase';

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

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    // PGRST116 = "The result contains 0 rows" (single() found nothing)
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json(rowToScene(data));
}
