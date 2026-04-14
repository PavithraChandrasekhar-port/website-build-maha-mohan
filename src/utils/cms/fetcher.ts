import type { Project, ArtistInfo, Exhibit } from '@/types/cms';
import projectsData from '@/data/projects.json';
import artistData from '@/data/artist.json';
import exhibitsData from '@/data/exhibits.json';
import printedMatterData from '@/data/printed-matter.json';
import { mergeProjectsWithDefaults } from '@/utils/cms/projectsMerge';
import { mergeExhibitsWithLocalFolders } from '@/utils/exhibitsLocalAssets';
import type { PrintedMatterData } from '@/types/admin';

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

const CMS_UPDATES_CHANNEL = 'cms-updates-v1';

function canUseBroadcastChannel(): boolean {
  return typeof window !== 'undefined' && typeof (window as unknown as { BroadcastChannel?: unknown }).BroadcastChannel !== 'undefined';
}

export function broadcastCmsUpdate(keys?: string | string[]): void {
  if (!canUseBroadcastChannel()) return;
  const list = Array.isArray(keys) ? keys : keys ? [keys] : [];
  try {
    const bc = new BroadcastChannel(CMS_UPDATES_CHANNEL);
    bc.postMessage({ type: 'invalidate', keys: list, at: Date.now() });
    bc.close();
  } catch {
    // ignore
  }
}

let updatesListenerAttached = false;
export function subscribeToCmsUpdates(): void {
  if (updatesListenerAttached) return;
  if (!canUseBroadcastChannel()) return;
  updatesListenerAttached = true;
  try {
    const bc = new BroadcastChannel(CMS_UPDATES_CHANNEL);
    bc.addEventListener('message', (evt) => {
      const data = evt.data as { type?: string; keys?: unknown };
      if (data?.type !== 'invalidate') return;
      const keys = Array.isArray(data.keys) ? (data.keys as unknown[]) : [];
      if (keys.length === 0) {
        invalidateCache();
        return;
      }
      for (const k of keys) {
        if (typeof k === 'string' && k) invalidateCache(k);
      }
    });
  } catch {
    // ignore
  }
}

async function fetchCmsSection<T>(section: string): Promise<T> {
  const res = await fetch(`/api/cms/${section}`, { cache: 'no-store' });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `CMS request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

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
    // Prefer live CMS data (Vercel Blob-backed), fall back to bundled JSON for offline/dev.
    let raw: unknown;
    try {
      raw = await fetchCmsSection<Project[]>('projects');
    } catch {
      raw = projectsData as Project[];
    }
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
    let data: ArtistInfo;
    try {
      data = await fetchCmsSection<ArtistInfo>('artist');
    } catch {
      data = artistData as ArtistInfo;
    }
    
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
    let raw: { exhibits?: unknown };
    try {
      raw = await fetchCmsSection<{ exhibits?: unknown }>('exhibits');
    } catch {
      raw = exhibitsData as { exhibits?: unknown };
    }
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

export async function fetchPrintedMatter(): Promise<PrintedMatterData> {
  const cacheKey = 'printed-matter';
  const cached = getCached<PrintedMatterData>(cacheKey);
  if (cached) return cached;

  try {
    let data: PrintedMatterData;
    try {
      data = await fetchCmsSection<PrintedMatterData>('printed-matter');
    } catch {
      data = printedMatterData as PrintedMatterData;
    }
    setCached(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching printed matter:', error);
    throw new Error('Failed to fetch printed matter');
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

