# Deployment Guide

## Common Issues and Solutions

### Blank White Page After Deployment

If you see a blank white page after deploying, it's usually due to one of these issues:

1. **SPA Routing Not Configured** ✅ (Fixed)
   - The server needs to serve `index.html` for all routes
   - Configuration files have been created for:
     - Vercel (`vercel.json`)
     - Netlify (`netlify.toml` and `public/_redirects`)
     - GitHub Pages (`public/_redirects`)

2. **Check Browser Console**
   - Open browser DevTools (F12)
   - Check Console tab for JavaScript errors
   - Check Network tab to see if assets are loading

3. **Build Output**
   - Make sure you're deploying the `dist` folder (not `src`)
   - Run `npm run build` before deploying
   - Verify `dist/index.html` exists

## Platform-Specific Instructions

### Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Vercel will auto-detect `vercel.json` and configure routing
4. Deploy!

### Netlify
1. Push code to GitHub
2. Import project in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Netlify will use `netlify.toml` and `public/_redirects`

### GitHub Pages
1. Build: `npm run build`
2. The `public/_redirects` file will be copied to `dist/`
3. Deploy the `dist` folder contents to GitHub Pages
4. Note: GitHub Pages may need additional configuration for SPA routing

### Other Static Hosting
- Copy the `public/_redirects` file to your web root
- Configure your server to redirect all routes to `index.html`
- For Apache, you may need `.htaccess`:
  ```apache
  <IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
  </IfModule>
  ```

## Testing Locally

Before deploying, test the production build locally:

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` and test all routes to ensure they work.

## Troubleshooting

1. **Still seeing blank page?**
   - Check browser console for errors
   - Verify `dist/index.html` exists
   - Check that all assets are loading (Network tab)
   - Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

2. **Routes not working?**
   - Verify `_redirects` or `vercel.json`/`netlify.toml` is in the deployed folder
   - Check server logs for 404 errors
   - Ensure server is configured for SPA routing

3. **Assets not loading?**
   - Check asset paths in browser Network tab
   - Verify `base` path in `vite.config.ts` if deploying to subdirectory
   - Check CORS settings if assets are on different domain
