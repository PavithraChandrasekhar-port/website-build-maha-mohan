/**
 * Build exhibit list from folder structure in src/assets/media/Exhibits.
 * Each folder = one exhibit (title = folder name); all images in folder are used.
 * One placeholder item is added at the start and one at the end.
 */
import type { Exhibit } from '@/types/cms';

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP)$/;

// Tentative venue, location, and year for each exhibit (keyed by folder name / title)
const exhibitMeta: Record<string, { venue: string; location: string; year: string }> = {
  'Ceramic Biennale, Sol Koffler Gallery': {
    venue: 'Sol Koffler Gallery',
    location: 'Providence, RI',
    year: '2024',
  },
  'MFA Grad Show 2025': {
    venue: 'Rhode Island Convention Center',
    location: 'Providence, RI',
    year: '2025',
  },
  'Symbio, Split': {
    venue: 'Gelman Gallery, RISD Museum',
    location: 'Providence, RI',
    year: '2024',
  },
  'The Big Fat South Asian Show': {
    venue: 'RISD Museum',
    location: 'Providence, RI',
    year: '2024',
  },
};

// Eager-load all images under Exhibits/*/* (path relative to this file: src/utils -> ../assets/media/Exhibits)
const exhibitImageModules = import.meta.glob<string>(
  '../assets/media/Exhibits/*/*',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

function buildExhibitsFromFolders(): Exhibit[] {
  const byFolder = new Map<string, string[]>();

  for (const [path, url] of Object.entries(exhibitImageModules)) {
    const resolvedUrl = typeof url === 'string' ? url : (url as { default?: string })?.default;
    if (typeof resolvedUrl !== 'string' || !IMAGE_EXT.test(path)) continue;
    const parts = path.replace(/\\/g, '/').split('/');
    const folderName = parts[parts.length - 2];
    if (!folderName || folderName === '..') continue;
    if (!byFolder.has(folderName)) byFolder.set(folderName, []);
    byFolder.get(folderName)!.push(resolvedUrl);
  }

  const folderNames = Array.from(byFolder.keys()).sort();
  const exhibits: Exhibit[] = [];

  // Placeholder at start
  exhibits.push({
    id: 'placeholder-start',
    title: 'Coming soon',
    venue: 'TBD',
    location: 'TBD',
    year: 'TBD',
    image: '',
    images: [],
    status: 'upcoming',
  });

  let index = 1;
  for (const folderName of folderNames) {
    const images = byFolder.get(folderName) || [];
    const id = String(index).padStart(3, '0');
    const meta = exhibitMeta[folderName];
    exhibits.push({
      id,
      title: folderName,
      venue: meta?.venue ?? 'TBD',
      location: meta?.location ?? 'TBD',
      year: meta?.year ?? 'TBD',
      image: images[0] || '',
      images,
      status: 'ongoing',
    });
    index += 1;
  }

  // Placeholder at end
  exhibits.push({
    id: 'placeholder-end',
    title: 'Coming soon',
    venue: 'TBD',
    location: 'TBD',
    year: 'TBD',
    image: '',
    images: [],
    status: 'upcoming',
  });

  return exhibits;
}

export const exhibitsFromFolders: Exhibit[] = buildExhibitsFromFolders();
