// Layerable ambient textures for The Zen Zone
export interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  audioUrl: string;
}

// Base URL for the public R2 textures bucket (set via NEXT_PUBLIC_R2_TEXTURES_URL)
const TEXTURES_URL =
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_R2_TEXTURES_URL ?? '')
    : '';

function textureUrl(filename: string) {
  return `${TEXTURES_URL}/${filename}`;
}

export const textures: AmbientSound[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: 'cloud-rain',
    audioUrl: textureUrl('rain.mp3'),
  },
  {
    id: 'fire',
    name: 'Fire Crackle',
    icon: 'flame',
    audioUrl: textureUrl('fire-crackle.mp3'),
  },
  {
    id: 'wind',
    name: 'Wind',
    icon: 'wind',
    audioUrl: textureUrl('wind.mp3'),
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    icon: 'waves',
    audioUrl: textureUrl('white-noise.mp3'),
  },
  {
    id: 'chatter',
    name: 'Ambient Chatter',
    icon: 'users',
    audioUrl: textureUrl('ambient-chatter.mp3'),
  },
  {
    id: 'birds',
    name: 'Birds',
    icon: 'bird',
    audioUrl: textureUrl('birds.mp3'),
  },
];

// Scene data with locations
export type SceneTag =
  | 'Urban' | 'Rural' | 'Coastal' | 'Forest' | 'Indoor'
  | 'Calm' | 'Focus' | 'Sleep' | 'Social'
  | 'Day' | 'Night' | 'Golden Hour'
  | 'Rain' | 'Snow' | 'Clear' | 'Fog';

export const filterGroups: { label: string; tags: SceneTag[] }[] = [
  { label: 'Environment', tags: ['Urban', 'Rural', 'Coastal', 'Forest', 'Indoor'] },
  { label: 'Mood',        tags: ['Calm', 'Focus', 'Sleep', 'Social'] },
  { label: 'Time',        tags: ['Day', 'Night', 'Golden Hour'] },
  { label: 'Climate',     tags: ['Rain', 'Snow', 'Clear', 'Fog'] },
];

export interface Scene {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  videoUrl: string;
  audioUrl: string;
  thumbnailUrl: string;
  tags: SceneTag[];
}

