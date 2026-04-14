import fs from 'node:fs/promises';
import path from 'node:path';
import { head, put } from '@vercel/blob';

const SECTION_TO_FILE = {
  artist: 'artist.json',
  exhibits: 'exhibits.json',
  projects: 'projects.json',
  'printed-matter': 'printed-matter.json',
};

class LocalJsonDataSource {
  async read(section) {
    const filename = SECTION_TO_FILE[section];
    if (!filename) throw new Error(`Unknown section: ${section}`);
    const filePath = path.join(process.cwd(), 'src', 'data', filename);
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  }

  async write(section, payload) {
    const filename = SECTION_TO_FILE[section];
    if (!filename) throw new Error(`Unknown section: ${section}`);
    const filePath = path.join(process.cwd(), 'src', 'data', filename);
    await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  }
}

class BlobJsonDataSource {
  constructor() {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
    }
    this.token = token;
    this.prefix = (process.env.CMS_BLOB_PREFIX || 'cms').replace(/^\/+|\/+$/g, '');
    this.fallback = new LocalJsonDataSource();
  }

  _pathname(section) {
    const filename = SECTION_TO_FILE[section];
    if (!filename) throw new Error(`Unknown section: ${section}`);
    return `${this.prefix}/${filename}`;
  }

  async read(section) {
    const pathname = this._pathname(section);
    try {
      const meta = await head(pathname, { token: this.token });
      const res = await fetch(meta.url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Blob read failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      // If blob doesn't exist yet (or head fails), seed from local JSON once.
      const local = await this.fallback.read(section);
      await this.write(section, local);
      return local;
    }
  }

  async write(section, payload) {
    const pathname = this._pathname(section);
    const body = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
    await put(pathname, body, {
      access: 'public',
      contentType: 'application/json; charset=utf-8',
      token: this.token,
      addRandomSuffix: false,
    });
  }
}

class KvDataSource {
  async read() {
    throw new Error('KV data source not implemented yet');
  }

  async write() {
    throw new Error('KV data source not implemented yet');
  }
}

export function getDataSource() {
  const ds = (process.env.CMS_DATA_SOURCE || '').toLowerCase().trim();
  if (ds === 'kv') return new KvDataSource();
  if (ds === 'blob') return new BlobJsonDataSource();

  // On Vercel, the filesystem is read-only; default to Blob.
  if (process.env.VERCEL) return new BlobJsonDataSource();
  return new LocalJsonDataSource();
}
