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

// PostHog — captura eventos de usuário (pageviews, clicks, custom events)
if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
  import('posthog-js').then((posthog) => {
    posthog.default.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.posthog.com',
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage',
      loaded: (ph) => {
        if (import.meta.env.DEV) console.log('[PostHog] Initialized', ph.config.api_host);
      },
    });
  }).catch(() => { /* posthog-js não instalado */ });
}

// Sentry — captura erros de runtime em produção
if (typeof window !== 'undefined' && import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: 1.0,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      enableLogs: true,
      debug: import.meta.env.DEV,
    });
    if (import.meta.env.DEV) console.log('[Sentry] Initialized');
  }).catch(() => { /* @sentry/react não instalado */ });
}

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