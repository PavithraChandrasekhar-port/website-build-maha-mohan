import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatedPage } from '@/components/animations/AnimatedPage';
import LoadingPage from '@/components/ui/LoadingPage';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@/pages/HomePage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'));
const WorkDetailPage = lazy(() => import('@/pages/WorkDetailPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const Playground = lazy(() => import('@/playground'));

// Loading fallback component - use our custom LoadingPage during code splitting
function PageLoader() {
  console.log('[PageLoader] Suspense fallback rendering - THIS SHOULD SHOW');
  try {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: 99999,
        backgroundColor: '#561D3C'
      }}>
        <LoadingPage progress={50} />
      </div>
    );
  } catch (error) {
    console.error('[PageLoader] Error rendering LoadingPage:', error);
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: 99999,
        backgroundColor: '#561D3C',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p>Error loading LoadingPage component</p>
      </div>
    );
  }
}

function AppRoutes() {
  console.log('[AppRoutes] Rendering');
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/"
          element={
            <AnimatedPage
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <HomePage />
            </AnimatedPage>
          }
        />
        <Route
          path="/projects"
          element={
            <AnimatedPage>
              <ProjectsPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <AnimatedPage>
              <ProjectDetailPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/works/:id"
          element={
            <AnimatedPage>
              <WorkDetailPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/about"
          element={
            <AnimatedPage>
              <AboutPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/playground"
          element={
            <AnimatedPage>
              <Playground />
            </AnimatedPage>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;

