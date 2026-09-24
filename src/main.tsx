import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
// Self-hosted fonts — Geist for a more confident, engineered feel with
// tabular numerals across the whole app.
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
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

// Observabilidade client-side init (executado após mount)
function initObservability() {
  // PostHog — captura eventos de usuário
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (posthogKey) {
    // Verifica se o CDN do PostHog está acessível antes de injetar o script.
    // Se o DNS falhar (net::ERR_NAME_NOT_RESOLVED), não injeta o <script>
    // para evitar o erro de console "Failed to load resource".
    fetch('https://cdn.posthog.com/version.json', { method: 'HEAD', mode: 'no-cors' })
      .then(res => {
        if (!res.ok) throw new Error('CDN não acessível');
        const script = document.createElement('script');
        script.src = 'https://cdn.posthog.com/posthog-js/stable/posthog.min.js';
        script.async = true;
        script.onload = () => {
          // @ts-ignore - posthog pode não estar tipado corretamente
          if (typeof window !== 'undefined' && (window as any).posthog) {
            // @ts-ignore
            (window as any).posthog.init(posthogKey, {
              api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.posthog.com',
              autocapture: true,
              capture_pageview: true,
              persistence: 'localStorage',
              loaded: (ph: any) => {
                if (import.meta.env.DEV) console.log('[PostHog] Initialized');
              },
            });
          }
        };
        script.onerror = () => {
          if (import.meta.env.DEV) console.warn('[PostHog] CDN inacessível. Client-side analytics desativado.');
        };
        document.head.appendChild(script);
      })
      .catch(() => {
        // CDN inacessível (DNS, CORS, firewall) — PostHog client-side desativado.
        // A edge function posthog-analytics (proxy) ainda funciona para consultas.
        if (import.meta.env.DEV) console.warn('[PostHog] CDN inacessível (DNS). Client-side analytics desativado.');
      });
  }

  // Sentry — captura erros de runtime
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (sentryDsn) {
    // Carregar Sentry dinamicamente
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: sentryDsn,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        tracesSampleRate: 0.1, // Reduz overhead em produção
        replaysOnErrorSampleRate: 0.5,
        replaysSessionSampleRate: 0.1,
        enableLogs: import.meta.env.DEV,
        debug: import.meta.env.DEV,
      });
      if (import.meta.env.DEV) console.log('[Sentry] Initialized');
    }).catch((e) => {
      if (import.meta.env.DEV) console.warn('[Sentry] Failed to initialize:', e);
    });
  }
}

if (rootElement) {
  createRoot(rootElement).render(
    <HelmetProvider>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </HelmetProvider>
  );
  registerAppServiceWorker();
  // Inicializar observabilidade após mount da app
  setTimeout(initObservability, 100);
}