/**
 * Mapping utility to convert work IDs (from WorksGallery) to project IDs (from CMS)
 * 
 * This allows the work detail page to fetch project data using getProject(id)
 * from the CMS service.
 */

// Map work IDs (used in routes and WorksGallery) to project IDs (used in CMS)
export const workIdToProjectId: Record<string, string> = {
  'alchemy': 'alchemy',
  'do-i-exist': 'do-i-exist',
  'echoes-of-longing': 'echoes-of-longing',
  'ethereal-bodies': 'ethereal-bodies',
  'iraivi': 'iraivi',
  'melancholy': 'melancholy',
  'naked': 'naked',
  'nightmare': 'nightmare',
  'of-webs-and-whispers': 'of-webs-and-whispers',
  'oru-kudam': 'oru-kudam',
  'the-paradox-of-becoming': 'the-paradox-of-becoming',
  'thirai': 'thirai',
  'voiceless-despair': 'voiceless-despair',
  'whisper': 'whisper',
};

/**
 * Convert work ID to project ID
 * Falls back to the work ID if no mapping exists
 */
export function getProjectIdFromWorkId(workId: string): string {
  return workIdToProjectId[workId] || workId;
}

