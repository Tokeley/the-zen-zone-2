// Layerable ambient textures for The Zen Zone
export interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  // In a real app, this would be an actual audio file URL
  audioUrl: string;
}

export const textures: AmbientSound[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: 'cloud-rain',
    audioUrl: '/audio/rain.mp3',
  },
  {
    id: 'fire',
    name: 'Fire Crackle',
    icon: 'flame',
    audioUrl: '/audio/fire.mp3',
  },
  {
    id: 'wind',
    name: 'Wind',
    icon: 'wind',
    audioUrl: '/audio/wind.mp3',
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    icon: 'waves',
    audioUrl: '/audio/white-noise.mp3',
  },
  {
    id: 'chatter',
    name: 'Ambient Chatter',
    icon: 'users',
    audioUrl: '/audio/chatter.mp3',
  },
  {
    id: 'birds',
    name: 'Birds',
    icon: 'bird',
    audioUrl: '/audio/birds.mp3',
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

export const scenes: Scene[] = [
  {
    id: 'tokyo-rain',
    title: 'Tokyo Rain',
    description: 'A rainy evening in the neon-lit streets of Shibuya',
    lat: 35.6595,
    lng: 139.7004,
    videoUrl: 'https://videos.pexels.com/video-files/3163534/3163534-uhd_2560_1440_30fps.mp4',
    audioUrl: '/audio/tokyo-rain.mp3',
    thumbnailUrl: 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Urban', 'Night', 'Rain', 'Focus'],
  },
  {
    id: 'paris-cafe',
    title: 'Paris Cafe',
    description: 'Morning light filtering through a quiet Montmartre cafe',
    lat: 48.8867,
    lng: 2.3431,
    videoUrl: 'https://videos.pexels.com/video-files/4099388/4099388-uhd_2560_1440_25fps.mp4',
    audioUrl: '/audio/paris-cafe.mp3',
    thumbnailUrl: 'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Urban', 'Indoor', 'Day', 'Calm', 'Social'],
  },
  {
    id: 'iceland-northern',
    title: 'Northern Lights',
    description: 'Aurora borealis dancing over the Icelandic wilderness',
    lat: 64.1466,
    lng: -21.9426,
    videoUrl: 'https://videos.pexels.com/video-files/857251/857251-hd_1920_1080_25fps.mp4',
    audioUrl: '/audio/iceland.mp3',
    thumbnailUrl: 'https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Rural', 'Night', 'Clear', 'Calm', 'Sleep'],
  },
  {
    id: 'bali-beach',
    title: 'Bali Sunset',
    description: 'Gentle waves at a secluded Balinese beach at dusk',
    lat: -8.4095,
    lng: 115.1889,
    videoUrl: 'https://videos.pexels.com/video-files/1093662/1093662-hd_1920_1080_30fps.mp4',
    audioUrl: '/audio/bali.mp3',
    thumbnailUrl: 'https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Coastal', 'Golden Hour', 'Calm', 'Sleep'],
  },
  {
    id: 'nyc-rooftop',
    title: 'NYC Rooftop',
    description: 'City sounds drifting up to a Manhattan rooftop at night',
    lat: 40.7484,
    lng: -73.9857,
    videoUrl: 'https://videos.pexels.com/video-files/2795173/2795173-uhd_2560_1440_25fps.mp4',
    audioUrl: '/audio/nyc.mp3',
    thumbnailUrl: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Urban', 'Night', 'Clear', 'Social', 'Focus'],
  },
  {
    id: 'kyoto-garden',
    title: 'Kyoto Garden',
    description: 'Tranquil zen garden with bamboo water features',
    lat: 35.0116,
    lng: 135.7681,
    videoUrl: 'https://videos.pexels.com/video-files/5752729/5752729-hd_1920_1080_30fps.mp4',
    audioUrl: '/audio/kyoto.mp3',
    thumbnailUrl: 'https://images.pexels.com/photos/1440476/pexels-photo-1440476.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Rural', 'Indoor', 'Day', 'Calm', 'Focus'],
  },
];

export function getSceneById(id: string): Scene | undefined {
  return scenes.find((scene) => scene.id === id);
}
