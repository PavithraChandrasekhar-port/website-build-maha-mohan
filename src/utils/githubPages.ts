/**
 * GitHub Pages SPA routing helper
 * Handles the ?/path routing that GitHub Pages uses for SPAs
 */

export function initGitHubPagesRouting() {
  // Check if we're on GitHub Pages (has ?/ in URL)
  const pathSegmentsToKeep = 0;
  const l = window.location;
  
  // If URL contains ?/, we need to convert it back to a normal path
  if (l.search.match(/\?\/.*/)) {
    const path = l.search
      .replace(/\?\/?/, '')
      .replace(/~and~/g, '&')
      .split('&')[0];
    
    // Update the URL without reloading
    window.history.replaceState(
      {},
      '',
      l.pathname.slice(0, 1 + pathSegmentsToKeep).replace(/\/$/, '') +
      '/' + path +
      l.hash
    );
  }
}
