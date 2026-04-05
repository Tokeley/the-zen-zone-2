import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSceneById, getScenes } from '@/src/lib/supabase';
import { ScenePlayer } from '@/src/components/scene-player/scene-player';

// Revalidate once per minute — same cadence as the home page
export const revalidate = 60;

// Pre-render known scene IDs at build time
export async function generateStaticParams() {
  const scenes = await getScenes();
  return scenes.map((s) => ({ id: s.id }));
}

// Per-scene <title> and Open Graph metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const scene = await getSceneById(id);
  if (!scene) return { title: 'Scene not found — The Zen Zone' };
  return {
    title: `${scene.title} — The Zen Zone`,
    description: scene.description,
  };
}

export default async function ScenePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scene = await getSceneById(id);

  if (!scene) notFound();

  return <ScenePlayer scene={scene} />;
}
