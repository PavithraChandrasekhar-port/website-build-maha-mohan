export type CmsSection = 'artist' | 'exhibits' | 'projects' | 'printed-matter';

export interface PrintedMatterItem {
  id: string;
  image: string;
  title?: string;
}

export interface PrintedMatterData {
  items: PrintedMatterItem[];
}

export interface UploadResponse {
  url: string;
}
