import 'server-only';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';

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
// Actual scene URLs are stored in Supabase after upload — these are defaults.
// ---------------------------------------------------------------------------

const SCENES_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_SCENES_URL ?? '';
const TEXTURES_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_TEXTURES_URL ?? '';

/** Returns the public video URL for a given scene. */
export function getSceneVideoUrl(sceneId: string): string {
  return `${SCENES_PUBLIC_URL}/scenes/${sceneId}/video.mp4`;
}

/** Returns the public audio URL for a given scene (extension varies by upload). */
export function getSceneAudioUrl(sceneId: string, ext: 'wav' | 'mp3' | 'flac' | 'ogg' | 'm4a' = 'wav'): string {
  return `${SCENES_PUBLIC_URL}/scenes/${sceneId}/audio.${ext}`;
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

/** R2 object key prefix for all assets belonging to a scene. */
export function getSceneAssetPrefix(sceneId: string): string {
  return `scenes/${sceneId}/`;
}

/** R2 object key for a scene's video file. */
export function getSceneVideoKey(sceneId: string): string {
  return `scenes/${sceneId}/video.mp4`;
}

/** Deletes all R2 objects under scenes/{sceneId}/. No-op if none exist. */
export async function deleteSceneAssets(sceneId: string): Promise<void> {
  const bucket = process.env.R2_BUCKET_SCENES;
  if (!bucket) {
    throw new Error('R2_BUCKET_SCENES is not set');
  }

  const prefix = getSceneAssetPrefix(sceneId);
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const list = await r2.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const obj of list.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }

    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  if (keys.length === 0) return;

  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })) },
      }),
    );
  }
}

/** @deprecated Use deleteSceneAssets — kept for callers that only remove video. */
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
