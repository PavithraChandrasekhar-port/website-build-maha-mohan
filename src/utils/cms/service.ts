import {
  fetchProjects,
  fetchProjectById,
  fetchArtistInfo,
  fetchExhibits,
  fetchPrintedMatter,
  invalidateCache,
} from './fetcher';
import type { Project, ArtistInfo, Exhibit } from '@/types/cms';
import type { PrintedMatterData } from '@/types/admin';

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
   * Exhibit list (same JSON file as CMS admin: `src/data/exhibits.json`)
   */
  async getExhibits(): Promise<Exhibit[]> {
    return fetchExhibits();
  }

  async getPrintedMatter(): Promise<PrintedMatterData> {
    return fetchPrintedMatter();
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
export const getExhibits = () => cmsService.getExhibits();
export const getPrintedMatter = () => cmsService.getPrintedMatter();

