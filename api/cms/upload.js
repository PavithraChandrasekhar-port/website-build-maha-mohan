import { put } from '@vercel/blob';
import { requireAuth } from '../_lib/auth.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '35mb',
    },
  },
};

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-');
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN is not configured' });
    return;
  }

  const { filename, contentType, base64, folder } = req.body || {};
  if (!filename || !base64) {
    res.status(400).json({ error: 'filename and base64 are required' });
    return;
  }

  try {
    const cleanName = sanitizeFileName(filename);
    const pathname = `${folder || 'uploads'}/${Date.now()}-${cleanName}`;
    const buffer = Buffer.from(base64, 'base64');
    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: contentType || 'application/octet-stream',
      token,
      addRandomSuffix: false,
    });
    res.status(200).json({ url: blob.url });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Upload failed' });
  }
}
