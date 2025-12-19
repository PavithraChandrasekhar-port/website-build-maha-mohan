import { fetchProjects, fetchProjectById, fetchArtistInfo, invalidateCache } from './fetcher';
import type { Project, ArtistInfo } from '@/types/cms';

/**
 * CMS Service Layer
 * 
 * This service abstracts data fetching so we can easily switch
 * from JSON files to a CMS API (Contentful, Strapi, Sanity, etc.)
 * 
 * Usage:
 * - Current: Reads from JSON files in src/data/
 * - Future: Replace fetcher functions to call CMS API
 */
export class CMSService {
  /**
   * Get all projects
   */
  async getProjects(): Promise<Project[]> {
    return fetchProjects();
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<Project | null> {
    return fetchProjectById(id);
  }

  /**
   * Get artist information
   */
  async getArtistInfo(): Promise<ArtistInfo> {
    return fetchArtistInfo();
  }

  /**
   * Invalidate cache (useful after updates)
   */
  invalidateCache(key?: string): void {
    invalidateCache(key);
  }
}

// Export singleton instance
export const cmsService = new CMSService();

// Export convenience functions
export const getProjects = () => cmsService.getProjects();
export const getProject = (id: string) => cmsService.getProject(id);
export const getArtistInfo = () => cmsService.getArtistInfo();

