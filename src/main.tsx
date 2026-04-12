import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initGitHubPagesRouting } from './utils/githubPages';
import './index.css';

// Initialize GitHub Pages routing if needed
initGitHubPagesRouting();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

