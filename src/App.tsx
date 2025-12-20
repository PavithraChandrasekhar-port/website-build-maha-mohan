import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { AppProviders } from "./store";
import LoadingWrapper from "./components/ui/LoadingWrapper";
import AppRoutes from "./routes/AppRoutes";

function App() {
  // Get base path from environment (set during build for GitHub Pages)
  const basePath = import.meta.env.VITE_BASE_PATH || "/";

  return (
    <ErrorBoundary>
      <BrowserRouter basename={basePath}>
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
