import 'server-only';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

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

/** R2 object key for a scene's video file. */
export function getSceneVideoKey(sceneId: string): string {
  return `scenes/${sceneId}/video.mp4`;
}

/** Deletes a scene's video.mp4 from R2. No-op if the object is already gone. */
export async function deleteSceneVideo(sceneId: string): Promise<void> {
  const bucket = process.env.R2_BUCKET_SCENES;
  if (!bucket) {
    throw new Error('R2_BUCKET_SCENES is not set');
  }

  await r2.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: getSceneVideoKey(sceneId),
    }),
  );
}

