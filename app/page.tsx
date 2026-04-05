import { getScenes } from '@/src/lib/supabase';
import { HomeClient } from '@/src/components/map/home-client';

export const revalidate = 60;

export default async function HomePage() {
  const scenes = await getScenes();

  return <HomeClient scenes={scenes} />;
}
