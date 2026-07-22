import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
// Self-hosted fonts — removes render-blocking Google Fonts request and
// external DNS/TLS handshake on first paint.
import "@fontsource-variable/ibm-plex-sans/index.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import App from "./App";
import "./index.css";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";
import { registerAppServiceWorker } from "./pwa/registerSW";

// Check performance early to set a global class if needed
const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
const isLowPerformance = cores < 4;

if (typeof document !== 'undefined' && isLowPerformance) {
  document.documentElement.classList.add('low-perf');
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <HelmetProvider>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </HelmetProvider>
  );
  registerAppServiceWorker();
}