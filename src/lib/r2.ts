import 'server-only';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ---------------------------------------------------------------------------
// R2 S3-compatible client (server-only)
// ---------------------------------------------------------------------------

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// ---------------------------------------------------------------------------
// Public URL helpers
// These use NEXT_PUBLIC_ vars so they're safe to call from server or client.
// ---------------------------------------------------------------------------

const SCENES_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_SCENES_URL ?? '';
const TEXTURES_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_TEXTURES_URL ?? '';

/** Returns the public video URL for a given scene. */
export function getSceneVideoUrl(sceneId: string): string {
  return `${SCENES_PUBLIC_URL}/scenes/${sceneId}/video.mp4`;
}

/** Returns the public ambient audio URL for a given scene. */
export function getSceneAudioUrl(sceneId: string): string {
  return `${SCENES_PUBLIC_URL}/scenes/${sceneId}/audio.mp3`;
}

/** Returns the public thumbnail URL for a given scene. */
export function getSceneThumbnailUrl(sceneId: string): string {
  return `${SCENES_PUBLIC_URL}/scenes/${sceneId}/thumbnail.jpg`;
}

/**
 * Returns the public URL for a reusable texture file.
 * @param filename — e.g. "rain.mp3", "fire-crackle.mp3"
 */
export function getTextureUrl(filename: string): string {
  return `${TEXTURES_PUBLIC_URL}/${filename}`;
}

// ---------------------------------------------------------------------------
// Presigned upload URL (server-only — used by the admin upload route)
// ---------------------------------------------------------------------------

/**
 * Creates a short-lived presigned PUT URL for uploading a file to R2.
 * Only call this from server-side API routes.
 */
export async function createPresignedUploadUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2, command, { expiresIn });
}
