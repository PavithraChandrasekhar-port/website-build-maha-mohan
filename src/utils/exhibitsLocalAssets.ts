import type { Exhibit } from '@/types/cms';

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP)$/;

const exhibitImageModules = import.meta.glob<string>('../assets/media/Exhibits/*/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function buildFolderToUrls(): Map<string, string[]> {
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

  for (const urls of byFolder.values()) {
    urls.sort((a, b) => {
      const fa = a.split('/').pop() ?? a;
      const fb = b.split('/').pop() ?? b;
      return fa.localeCompare(fb, undefined, { numeric: true });
    });
  }

  return byFolder;
}

const folderToUrls = buildFolderToUrls();

/**
 * Fill empty image/images from src/assets/media/Exhibits/<folder>/ when JSON has no URLs.
 * Folder key = assetFolder if set, else title (must match directory name exactly).
 */
export function mergeExhibitsWithLocalFolders(exhibits: Exhibit[]): Exhibit[] {
  return exhibits.map((ex) => {
    const hasRemote =
      (ex.image && ex.image.trim().length > 0) ||
      (ex.images && ex.images.some((u) => u && u.trim().length > 0));
    if (hasRemote) return ex;

    const folderKey = (ex.assetFolder ?? ex.title).trim();
    const urls = folderToUrls.get(folderKey);
    if (!urls?.length) return ex;

    return {
      ...ex,
      image: urls[0] ?? '',
      images: urls.length > 1 ? urls : undefined,
    };
  });
}
