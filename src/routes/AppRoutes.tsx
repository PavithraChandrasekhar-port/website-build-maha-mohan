import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatedPage } from '@/components/animations/AnimatedPage';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@/pages/HomePage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'));
// Preload WorkDetailPage to avoid Suspense fallback interrupting transitions
import WorkDetailPage from '@/pages/WorkDetailPage';
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const Playground = lazy(() => import('@/playground'));

// Loading fallback component - null for WorkDetailPage route to avoid interrupting transitions
// Only show loader for other lazy-loaded pages
function PageLoader() {
  return null; // No loading indicator - let transitions handle the visual flow
}

function AppRoutes() {
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

