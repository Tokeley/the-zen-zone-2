import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { createClient } from '@/src/lib/supabase/server';
import { createPresignedUploadUrl } from '@/src/lib/r2';

const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const MAX_THUMBNAIL_BYTES = 10 * 1024 * 1024;

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

function resolveMimeType(contentType: string, fileName: string, fileType: string): string | null {
  const normalized = normalizeMimeType(contentType);
  if (normalized) return normalized;

  const ext = fileName.split('.').pop()?.toLowerCase();
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (err) {
    console.error('[admin/upload] request parse error:', err);
    return NextResponse.json({ error: 'Invalid upload request' }, { status: 400 });
  }

  const { sceneId, fileType, fileName, contentType, fileSize } = body;

  if (
    typeof sceneId !== 'string' ||
    typeof fileType !== 'string' ||
    typeof fileName !== 'string' ||
    typeof contentType !== 'string' ||
    typeof fileSize !== 'number' ||
    !Number.isSafeInteger(fileSize) ||
    fileSize <= 0
  ) {
    return NextResponse.json(
      { error: 'sceneId, fileType, fileName, contentType, and fileSize are required' },
      { status: 400 },
    );
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sceneId)) {
    return NextResponse.json({ error: 'Invalid sceneId' }, { status: 400 });
  }

  const allowed = ALLOWED[fileType];
  if (!allowed) {
    return NextResponse.json({ error: `Unknown fileType "${fileType}"` }, { status: 400 });
  }

  const mimeType = resolveMimeType(contentType, fileName, fileType);
  if (!mimeType || !allowed.includes(mimeType)) {
    return NextResponse.json(
      { error: `Content type "${contentType || 'unknown'}" is not allowed for ${fileType}` },
      { status: 400 },
    );
  }

  if (fileType === 'video' && fileSize > MAX_VIDEO_BYTES) {
    return NextResponse.json(
      { error: `Video must be ${MAX_VIDEO_BYTES / (1024 * 1024)} MB or smaller` },
      { status: 400 },
    );
  }

  if (fileType === 'audio' && fileSize > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: `Audio must be ${MAX_AUDIO_BYTES / (1024 * 1024)} MB or smaller` },
      { status: 400 },
    );
  }

  if (fileType === 'thumbnail' && fileSize > MAX_THUMBNAIL_BYTES) {
    return NextResponse.json(
      { error: `Thumbnail must be ${MAX_THUMBNAIL_BYTES / (1024 * 1024)} MB or smaller` },
      { status: 400 },
    );
  }

  const bucket = process.env.R2_BUCKET_SCENES;
  if (!bucket) {
    return NextResponse.json({ error: 'R2_BUCKET_SCENES env var is not set' }, { status: 500 });
  }

  const publicBaseUrl = process.env.NEXT_PUBLIC_R2_SCENES_URL;
  if (!publicBaseUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_R2_SCENES_URL env var is not set' }, { status: 500 });
  }

  const key = resolveObjectKey(sceneId, fileType, mimeType, fileName);
  if (!key) {
    return NextResponse.json({ error: 'Could not determine storage key for file' }, { status: 400 });
  }

  try {
    const uploadUrl = await createPresignedUploadUrl(bucket, key, mimeType);
    const publicUrl = `${publicBaseUrl.replace(/\/$/, '')}/${key}`;
    return NextResponse.json({ uploadUrl, publicUrl, key, contentType: mimeType });
  } catch (err) {
    console.error('[admin/upload] presign error:', err);
    return NextResponse.json({ error: 'Failed to prepare upload' }, { status: 500 });
  }
}
