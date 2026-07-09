import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { cookies } from 'next/headers';

import { createClient } from '@/src/lib/supabase/server';
import { r2 } from '@/src/lib/r2';

// Allow large video files (up to 200 MB)
export const maxDuration = 60;

const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const MAX_AUDIO_BYTES = 100 * 1024 * 1024;

const ALLOWED: Record<string, string[]> = {
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/ogg'],
  thumbnail: ['image/jpeg', 'image/webp', 'image/png'],
};

const AUDIO_EXT_BY_MIME: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/flac': 'flac',
  'audio/x-flac': 'flac',
  'audio/ogg': 'ogg',
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
    if (ext === 'm4a') return 'audio/mp4';
    if (ext === 'wav') return 'audio/wav';
    if (ext === 'flac') return 'audio/flac';
    if (ext === 'ogg') return 'audio/ogg';
  }
  if (fileType === 'thumbnail') {
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'png') return 'image/png';
  }
  return null;
}

function resolveObjectKey(sceneId: string, fileType: string, mimeType: string, fileName: string): string | null {
  if (fileType === 'video') return `scenes/${sceneId}/video.mp4`;
  if (fileType === 'thumbnail') return `scenes/${sceneId}/thumbnail.jpg`;

  if (fileType === 'audio') {
    const extFromMime = AUDIO_EXT_BY_MIME[mimeType];
    const extFromName = fileName.split('.').pop()?.toLowerCase();
    const ext = extFromMime ?? extFromName;
    if (!ext || !['mp3', 'm4a', 'wav', 'flac', 'ogg'].includes(ext)) return null;
    return `scenes/${sceneId}/audio.${ext}`;
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

  if (fileType === 'video' && file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json(
      { error: `Video must be ${MAX_VIDEO_BYTES / (1024 * 1024)} MB or smaller` },
      { status: 400 },
    );
  }

  if (fileType === 'audio' && file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: `Audio must be ${MAX_AUDIO_BYTES / (1024 * 1024)} MB or smaller` },
      { status: 400 },
    );
  }

  const bucket = process.env.R2_BUCKET_SCENES;
  if (!bucket) {
    return NextResponse.json({ error: 'R2_BUCKET_SCENES env var is not set' }, { status: 500 });
  }

  const key = resolveObjectKey(sceneId, fileType, mimeType, (file as File).name);
  if (!key) {
    return NextResponse.json({ error: 'Could not determine storage key for file' }, { status: 400 });
  }

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
    return NextResponse.json({ publicUrl, key });
  } catch (err) {
    console.error('[admin/upload] R2 upload error:', err);
    return NextResponse.json({ error: 'Failed to upload file to R2' }, { status: 500 });
  }
}
