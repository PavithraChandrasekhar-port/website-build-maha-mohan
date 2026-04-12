import type { Project, ArtistInfo, Exhibit } from '@/types/cms';
import projectsData from '@/data/projects.json';
import artistData from '@/data/artist.json';
import exhibitsData from '@/data/exhibits.json';
import { mergeProjectsWithDefaults } from '@/utils/cms/projectsMerge';
import { mergeExhibitsWithLocalFolders } from '@/utils/exhibitsLocalAssets';

const EXHIBIT_STATUSES: readonly Exhibit['status'][] = ['ongoing', 'upcoming', 'past'];

function normalizeExhibit(raw: Partial<Exhibit> & Record<string, unknown>, index: number): Exhibit {
  const id = typeof raw.id === 'string' && raw.id ? raw.id : `exhibit-${index}`;
  const status =
    typeof raw.status === 'string' && (EXHIBIT_STATUSES as readonly string[]).includes(raw.status)
      ? (raw.status as Exhibit['status'])
      : 'upcoming';
  const images = Array.isArray(raw.images)
    ? raw.images.filter((u): u is string => typeof u === 'string' && u.length > 0)
    : undefined;
  const image = typeof raw.image === 'string' ? raw.image : '';
  const assetFolder =
    typeof raw.assetFolder === 'string' && raw.assetFolder.trim() ? raw.assetFolder.trim() : undefined;

  return {
    id,
    title: typeof raw.title === 'string' ? raw.title : '',
    venue: typeof raw.venue === 'string' ? raw.venue : '',
    location: typeof raw.location === 'string' ? raw.location : '',
    year: typeof raw.year === 'string' ? raw.year : '',
    image,
    images: images && images.length > 0 ? images : undefined,
    status,
    assetFolder,
  };
}

// In-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCached<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

// Current implementation: Read from JSON files
// Future: Replace with CMS API calls

export async function fetchProjects(): Promise<Project[]> {
  const cacheKey = 'projects';
  const cached = getCached<Project[]>(cacheKey);
  if (cached) return cached;

  try {
    // Current: Return mock data
    // Future: const response = await fetch(`${CMS_API_URL}/projects`);
    // Future: const data = await response.json();
    const raw = projectsData as Project[];
    const data = mergeProjectsWithDefaults(Array.isArray(raw) ? raw : []);

    setCached(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects');
  }
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  const projects = await fetchProjects();
  return projects.find((p) => p.id === id) || null;
}

export async function fetchArtistInfo(): Promise<ArtistInfo> {
  const cacheKey = 'artist';
  const cached = getCached<ArtistInfo>(cacheKey);
  if (cached) return cached;

  try {
    // Current: Return mock data
    // Future: const response = await fetch(`${CMS_API_URL}/artist`);
    // Future: const data = await response.json();
    const data = artistData as ArtistInfo;
    
    setCached(cacheKey, data, DEFAULT_TTL * 2); // Cache artist info longer
    return data;
  } catch (error) {
    console.error('Error fetching artist info:', error);
    throw new Error('Failed to fetch artist info');
  }
}

/** Same source as admin CMS: `src/data/exhibits.json` (bundled at build time). */
export async function fetchExhibits(): Promise<Exhibit[]> {
  const cacheKey = 'exhibits';
  const cached = getCached<Exhibit[]>(cacheKey);
  if (cached) return cached;

  try {
    const raw = exhibitsData as { exhibits?: unknown };
    const list = Array.isArray(raw.exhibits) ? raw.exhibits : [];
    const normalized = list.map((item, i) =>
      normalizeExhibit(item as Partial<Exhibit> & Record<string, unknown>, i)
    );
    const data = mergeExhibitsWithLocalFolders(normalized);
    setCached(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching exhibits:', error);
    throw new Error('Failed to fetch exhibits');
  }
}

// Utility to invalidate cache (useful for future CMS integration)
export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// Retry logic for future API calls (unused for now, ready for CMS integration)
// async function fetchWithRetry<T>(
//   fetcher: () => Promise<T>,
//   maxRetries: number = 3,
//   delay: number = 1000
// ): Promise<T> {
//   let lastError: Error | null = null;
//   
//   for (let i = 0; i < maxRetries; i++) {
//     try {
//       return await fetcher();
//     } catch (error) {
//       lastError = error as Error;
//       if (i < maxRetries - 1) {
//         await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
//       }
//     }
//   }
//   
//   throw lastError || new Error('Failed after retries');
// }

