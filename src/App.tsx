import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppProviders } from './store';
import LoadingWrapper from './components/ui/LoadingWrapper';
import AppRoutes from './routes/AppRoutes';

function App() {
  console.log('[App] Rendering');
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProviders>
          <LoadingWrapper>
            <AppRoutes />
          </LoadingWrapper>
        </AppProviders>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
