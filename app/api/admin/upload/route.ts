import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { cookies } from 'next/headers';

import { createClient } from '@/src/lib/supabase/server';
import { r2 } from '@/src/lib/r2';

// Allow large video files (up to 500 MB)
export const maxDuration = 60;

const ALLOWED: Record<string, string[]> = {
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg'],
  thumbnail: ['image/jpeg', 'image/webp', 'image/png'],
};

const KEY_SUFFIX: Record<string, string> = {
  video: 'video.mp4',
  audio: 'audio.mp3',
  thumbnail: 'thumbnail.jpg',
};

function normalizeMimeType(type: string): string {
  return type.split(';')[0]?.trim() ?? '';
}

function resolveMimeType(file: File, fileType: string): string | null {
  const normalized = normalizeMimeType(file.type);
  if (normalized) return normalized;

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (fileType === 'video') {
    if (ext === 'mp4') return 'video/mp4';
    if (ext === 'webm') return 'video/webm';
    if (ext === 'mov') return 'video/quicktime';
  }
  if (fileType === 'audio') {
    if (ext === 'mp3') return 'audio/mpeg';
    if (ext === 'wav') return 'audio/wav';
    if (ext === 'ogg') return 'audio/ogg';
  }
  if (fileType === 'thumbnail') {
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'png') return 'image/png';
  }
  return null;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    console.error('[admin/upload] formData parse error:', err);
    return NextResponse.json(
      {
        error:
          'Could not read upload. The file may exceed the server size limit — restart the dev server after config changes.',
      },
      { status: 400 },
    );
  }

  const sceneId = formData.get('sceneId');
  const fileType = formData.get('fileType');
  const file = formData.get('file');

  if (typeof sceneId !== 'string' || typeof fileType !== 'string' || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'sceneId, fileType, and file are required' }, { status: 400 });
  }

  const allowed = ALLOWED[fileType];
  if (!allowed) {
    return NextResponse.json({ error: `Unknown fileType "${fileType}"` }, { status: 400 });
  }

  const mimeType = resolveMimeType(file as File, fileType);
  if (!mimeType || !allowed.includes(mimeType)) {
    return NextResponse.json(
      { error: `Content type "${file.type || 'unknown'}" is not allowed for ${fileType}` },
      { status: 400 },
    );
  }

  const bucket = process.env.R2_BUCKET_SCENES;
  if (!bucket) {
    return NextResponse.json({ error: 'R2_BUCKET_SCENES env var is not set' }, { status: 500 });
  }

  const key = `scenes/${sceneId}/${KEY_SUFFIX[fileType]}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    const publicUrl = `${process.env.NEXT_PUBLIC_R2_SCENES_URL}/${key}`;
    return NextResponse.json({ publicUrl });
  } catch (err) {
    console.error('[admin/upload] R2 upload error:', err);
    return NextResponse.json({ error: 'Failed to upload file to R2' }, { status: 500 });
  }
}
