import { notFound } from 'next/navigation';
import { getSceneById } from '@/src/lib/supabase';
import { ScenePlayer } from '@/src/components/scene-player/scene-player';

export const revalidate = 60;

interface ScenePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ScenePageProps) {
  const { id } = await params;
  const scene = await getSceneById(id);

  if (!scene) {
    return { title: 'Scene Not Found' };
  }

  return {
    title: `${scene.title} — The Zen Zone`,
    description: scene.description,
  };
}

export default async function ScenePage({ params }: ScenePageProps) {
  const { id } = await params;
  const scene = await getSceneById(id);

  if (!scene) {
    notFound();
  }

  return <ScenePlayer scene={scene} />;
}
