import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '@/src/lib/r2';

// Allow large video files (up to 500 MB)
export const maxDuration = 60;

// Allowed MIME types per file slot
const ALLOWED: Record<string, string[]> = {
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg'],
  thumbnail: ['image/jpeg', 'image/webp', 'image/png'],
};

// Fixed key suffixes
const KEY_SUFFIX: Record<string, string> = {
  video: 'video.mp4',
  audio: 'audio.mp3',
  thumbnail: 'thumbnail.jpg',
};

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
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
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: `Content type "${file.type}" is not allowed for ${fileType}` },
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
        ContentType: file.type,
      }),
    );

    const publicUrl = `${process.env.NEXT_PUBLIC_R2_SCENES_URL}/${key}`;
    return NextResponse.json({ publicUrl });
  } catch (err) {
    console.error('[admin/upload] R2 upload error:', err);
    return NextResponse.json({ error: 'Failed to upload file to R2' }, { status: 500 });
  }
}
