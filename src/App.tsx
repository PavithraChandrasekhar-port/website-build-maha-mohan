import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppProviders } from './store';
import LoadingWrapper from './components/ui/LoadingWrapper';
import AppRoutes from './routes/AppRoutes';

function App() {
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
