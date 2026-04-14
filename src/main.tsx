import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initGitHubPagesRouting } from './utils/githubPages';
import { subscribeToCmsUpdates } from './utils/cms/fetcher';
import './index.css';

// Initialize GitHub Pages routing if needed
initGitHubPagesRouting();

// Keep public pages in sync with CMS saves across tabs/routes.
subscribeToCmsUpdates();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

