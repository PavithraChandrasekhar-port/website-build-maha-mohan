import fs from 'node:fs/promises';
import path from 'node:path';

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

class KvDataSource {
  async read() {
    throw new Error('KV data source not implemented yet');
  }

  async write() {
    throw new Error('KV data source not implemented yet');
  }
}

export function getDataSource() {
  if (process.env.CMS_DATA_SOURCE === 'kv') return new KvDataSource();
  return new LocalJsonDataSource();
}
