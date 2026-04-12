import type { Project } from '@/types/cms';
import { getAllWorks, type WorkDetail } from '@/utils/works/workData';

/** Gallery order — matches former WorksGallery mockWorks sequence. */
export const WORK_GALLERY_ORDER: readonly string[] = [
  'alchemy',
  'do-i-exist',
  'echoes-of-longing',
  'ethereal-bodies',
  'iraivi',
  'melancholy',
  'naked',
  'nightmare',
  'of-webs-and-whispers',
  'oru-kudam',
  'the-paradox-of-becoming',
  'thirai',
  'voiceless-despair',
  'whisper',
];

function toUrl(u: string | (string & object)): string {
  return typeof u === 'string' ? u : String(u);
}

export function workDetailToProject(detail: WorkDetail): Project {
  const cover = detail.media[0];
  const coverUrl = cover ? toUrl(cover.url) : '';
  return {
    id: detail.id,
    name: detail.name,
    shortDescription: `${detail.medium} · ${detail.dimensions} · ${detail.year}`,
    date: `${detail.year}-01-01T00:00:00.000Z`,
    coverImage: {
      id: `cover-${detail.id}`,
      url: coverUrl,
      width: 1920,
      height: 1080,
      alt: detail.name,
    },
    imageAltText: detail.name,
    studio: detail.medium,
    media: detail.media.map((m, i) => ({
      id: m.id || `${detail.id}-media-${i}`,
      type: m.type,
      url: toUrl(m.url),
      thumbnail: m.thumbnail ? toUrl(m.thumbnail) : undefined,
      caption: m.caption,
      alt: m.alt || m.caption || detail.name,
    })),
  };
}

export function buildDefaultProjectsFromWorks(): Project[] {
  const all = getAllWorks();
  const byId = new Map(all.map((w) => [w.id, w]));
  const ordered: Project[] = [];
  for (const id of WORK_GALLERY_ORDER) {
    const d = byId.get(id);
    if (d) ordered.push(workDetailToProject(d));
  }
  for (const w of all) {
    if (!WORK_GALLERY_ORDER.includes(w.id)) ordered.push(workDetailToProject(w));
  }
  return ordered;
}

function mergeProjectDeep(base: Project, over: Project): Project {
  const cover =
    over.coverImage?.url?.trim()
      ? { ...base.coverImage, ...over.coverImage, url: over.coverImage.url }
      : base.coverImage;
  const media =
    over.media && over.media.length > 0 ? over.media : base.media;
  return {
    ...base,
    ...over,
    name: over.name?.trim() ? over.name : base.name,
    shortDescription:
      over.shortDescription !== undefined && over.shortDescription !== ''
        ? over.shortDescription
        : base.shortDescription,
    date: over.date?.trim() ? over.date : base.date,
    studio: over.studio?.trim() ? over.studio : base.studio,
    imageAltText:
      over.imageAltText !== undefined && over.imageAltText !== ''
        ? over.imageAltText
        : base.imageAltText,
    coverImage: cover,
    media,
  };
}

/**
 * Merges CMS-stored projects (projects.json) onto work-based defaults.
 * Stored rows match by `id`; unknown ids are appended.
 */
export function mergeProjectsWithDefaults(stored: Project[]): Project[] {
  const defaults = buildDefaultProjectsFromWorks();
  if (!stored.length) return defaults;

  const map = new Map(stored.map((p) => [p.id, p]));
  const merged: Project[] = [];
  const seen = new Set<string>();

  for (const base of defaults) {
    const over = map.get(base.id);
    merged.push(over ? mergeProjectDeep(base, over) : base);
    seen.add(base.id);
  }

  for (const p of stored) {
    if (!seen.has(p.id)) merged.push(p);
  }

  return merged;
}
