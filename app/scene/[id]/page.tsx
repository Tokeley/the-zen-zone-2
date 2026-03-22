import { notFound } from 'next/navigation';
import { getSceneById, scenes } from '@/src/data/soundscapes';
import { ScenePlayer } from '@/src/components/scene-player/scene-player';

interface ScenePageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return scenes.map((scene) => ({
    id: scene.id,
  }));
}

export async function generateMetadata({ params }: ScenePageProps) {
  const { id } = await params;
  const scene = getSceneById(id);
  
  if (!scene) {
    return {
      title: 'Scene Not Found',
    };
  }

  return {
    title: `${scene.title} — The Zen Zone`,
    description: scene.description,
  };
}

export default async function ScenePage({ params }: ScenePageProps) {
  const { id } = await params;
  const scene = getSceneById(id);

  if (!scene) {
    notFound();
  }

  return <ScenePlayer scene={scene} />;
}
