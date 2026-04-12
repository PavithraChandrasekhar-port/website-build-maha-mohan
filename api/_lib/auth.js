function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, raw) => {
    const [key, ...rest] = raw.trim().split('=');
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

/** When true, CMS login and API auth checks are skipped (dev / temporary). */
export function isAuthDisabled() {
  return (
    process.env.VITE_CMS_AUTH_DISABLED === 'true' ||
    process.env.CMS_AUTH_DISABLED === 'true'
  );
}

/** Normalized password from env (trimmed; .env files often include stray spaces). */
export function getAdminPassword() {
  return (process.env.ADMIN_PASSWORD || '').trim();
}

export function isAuthenticated(req) {
  if (isAuthDisabled()) return true;
  const cookies = parseCookies(req.headers.cookie || '');
  const expected = getAdminPassword();
  return Boolean(expected) && cookies.admin_session === expected;
}

export function requireAuth(req, res) {
  if (isAuthDisabled()) return true;
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export function setSessionCookie(res, password) {
  const cookie = `admin_session=${encodeURIComponent(password)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}
