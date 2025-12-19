import type { Project, ArtistInfo } from '@/types/cms';
import projectsData from '@/data/projects.json';
import artistData from '@/data/artist.json';

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
    const data = projectsData as Project[];
    
    setCached(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects');
  }
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  const projects = await fetchProjects();
  return projects.find(p => p.id === id) || null;
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

