import { getAdminPassword, isAuthDisabled, setSessionCookie } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (isAuthDisabled()) {
    res.status(200).json({ ok: true });
    return;
  }

  const expected = getAdminPassword();
  if (!expected) {
    res.status(500).json({ error: 'ADMIN_PASSWORD is not configured' });
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const password =
    typeof body.password === 'string' ? body.password.trim() : String(body.password ?? '').trim();

  if (!password || password !== expected) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  setSessionCookie(res, expected);
  res.status(200).json({ ok: true });
}
