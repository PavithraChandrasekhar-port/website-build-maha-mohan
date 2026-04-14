import { getDataSource } from '../_lib/data-source.js';
import { requireAuth } from '../_lib/auth.js';

const ALLOWED = new Set(['artist', 'exhibits', 'projects', 'printed-matter']);

export default async function handler(req, res) {
  const section = req.query.section;
  if (!ALLOWED.has(section)) {
    res.status(400).json({ error: `Unknown section: ${section}` });
    return;
  }

  const ds = getDataSource();

  if (req.method === 'GET') {
    try {
      const data = await ds.read(section);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Read failed' });
    }
    return;
  }

  if (req.method === 'PUT') {
    if (!requireAuth(req, res)) return;
    try {
      await ds.write(section, req.body);
      res.status(200).json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Write failed' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
