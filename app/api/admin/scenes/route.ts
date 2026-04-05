import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/src/lib/supabase';
import type { SceneTag } from '@/src/data/textures';

export async function POST(req: NextRequest) {
  let body: {
    id?: string;
    title?: string;
    description?: string;
    lat?: number;
    lng?: number;
    videoUrl?: string;
    audioUrl?: string;
    thumbnailUrl?: string;
    tags?: SceneTag[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, title, description, lat, lng, videoUrl, audioUrl, thumbnailUrl, tags } = body;

  if (!id || !title || !description || lat == null || lng == null || !videoUrl || !audioUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Cast needed because the supabase-js generic inference for .insert()
  // doesn't resolve correctly when the admin client is created at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('scenes') as any)
    .insert({
      id,
      title,
      description,
      lat,
      lng,
      video_url: videoUrl,
      audio_url: audioUrl,
      thumbnail_url: thumbnailUrl ?? null,
      tags: (tags ?? []) as SceneTag[],
    })
    .select()
    .single();

  if (error) {
    console.error('[admin/scenes] insert error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
