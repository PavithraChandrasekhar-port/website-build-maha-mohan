import type { ArtistInfo, Exhibit, Project } from '@/types/cms';
import type { CmsSection, PrintedMatterData, UploadResponse } from '@/types/admin';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function checkAdminSession(): Promise<{ authenticated: boolean }> {
  return requestJson('/api/admin/session');
}

export async function loginAdmin(password: string): Promise<{ ok: boolean }> {
  return requestJson('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function logoutAdmin(): Promise<{ ok: boolean }> {
  return requestJson('/api/admin/logout', { method: 'POST' });
}

export async function getCmsSection<T>(section: CmsSection): Promise<T> {
  return requestJson(`/api/cms/${section}`);
}

export async function saveCmsSection<T>(section: CmsSection, payload: T): Promise<{ ok: boolean }> {
  return requestJson(`/api/cms/${section}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function uploadToBlob(file: File, folder: string): Promise<UploadResponse> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const base64 = btoa(binary);

  return requestJson('/api/cms/upload', {
    method: 'POST',
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      base64,
      folder,
    }),
  });
}

export type AdminArtist = ArtistInfo;
export type AdminExhibits = { exhibits: Exhibit[] };
export type AdminProjects = Project[];
export type AdminPrintedMatter = PrintedMatterData;
