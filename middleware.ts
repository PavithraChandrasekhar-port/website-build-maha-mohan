export const config = {
  matcher: ['/admin', '/admin/:path*'],
};

function getCookie(request: Request, key: string): string {
  const raw = request.headers.get('cookie') || '';
  const cookies = raw.split(';').map((part) => part.trim());
  for (const pair of cookies) {
    const [name, ...rest] = pair.split('=');
    if (name === key) return decodeURIComponent(rest.join('='));
  }
  return '';
}

export default function middleware(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/admin/login')) return fetch(request);

  const authDisabled =
    process.env.VITE_CMS_AUTH_DISABLED === 'true' ||
    process.env.CMS_AUTH_DISABLED === 'true';
  if (authDisabled) return fetch(request);

  const expected = (process.env.ADMIN_PASSWORD || '').trim();
  const session = getCookie(request, 'admin_session').trim();

  if (expected && session === expected) return fetch(request);

  return Response.redirect(new URL('/admin/login', request.url), 302);
}
