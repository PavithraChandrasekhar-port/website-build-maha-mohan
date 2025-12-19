export interface MediaAsset {
  id: string;
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  caption?: string;
  alt?: string;
  writings?: string; // Optional writings text associated with this media item
}

export interface Project {
  id: string;
  name: string;
  shortDescription: string;
  date: string; // ISO 8601
  coverImage: MediaAsset;
  imageAltText: string;
  studio: string;
  media: MediaItem[];
}

export interface FileAsset {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size?: number;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface ArtistInfo {
  name: string;
  introduction: string;
  socials: SocialLink[];
  artistStatement: FileAsset;
  resume: FileAsset;
}

export interface Exhibit {
  id: string;
  title: string;
  venue: string;
  location: string;
  year: string;
  image: string;
  status: 'ongoing' | 'upcoming';
}
