import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { AppProviders } from "./store";
import LoadingWrapper from "./components/ui/LoadingWrapper";
import AppRoutes from "./routes/AppRoutes";

function App() {
  // Must match vite.config `base` (e.g. GitHub Pages subpath). Prefer Vite’s BASE_URL over a duplicate env.
  const base = import.meta.env.BASE_URL || "/";
  const basename = base === "/" ? undefined : base.replace(/\/$/, "");

  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
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
