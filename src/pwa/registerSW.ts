// Guarded service worker registration (Onda D1 — app-shell offline)
// Refuses to register in dev, Lovable preview, iframes, or when ?sw=off is set.
// Cleans up any prior registration in those contexts.

const APP_SW_URL = "/sw.js";
// Bump this string to force ALL clients to unregister any previously
// installed service worker and drop all Cache Storage entries on next load.
// Use when a stale/broken SW is causing runtime issues (e.g. "Failed to fetch"
// on the login screen because an old cached bundle points to bad URLs).
const SW_RESET_VERSION = "2026-07-28-auth-fix";
const SW_RESET_KEY = "__sw_reset_version";

function shouldSkipRegistration(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;

  try {
    if (window.self !== window.top) return true;
  } catch {
    return true; // cross-origin iframe
  }

  const host = window.location.hostname;
  if (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  ) {
    return true;
  }

  if (new URLSearchParams(window.location.search).has("sw")) {
    if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  }

  return false;
}

async function unregisterAppSW(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(APP_SW_URL);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    /* noop */
  }
}

async function nukeAllServiceWorkersAndCaches(): Promise<void> {
  // Unregister EVERY SW on this origin — not just ours — in case a legacy
  // build registered under a different filename.
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(regs.map((r) => r.unregister()));
    }
  } catch { /* noop */ }
  // Drop every Cache Storage bucket so the next navigation refetches fresh
  // HTML/JS/CSS from the network.
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.allSettled(keys.map((k) => caches.delete(k)));
    }
  } catch { /* noop */ }
}

async function maybeResetForNewVersion(): Promise<boolean> {
  try {
    const seen = localStorage.getItem(SW_RESET_KEY);
    if (seen === SW_RESET_VERSION) return false;
    await nukeAllServiceWorkersAndCaches();
    localStorage.setItem(SW_RESET_KEY, SW_RESET_VERSION);
    // Reload once so the app boots without the old SW claiming clients.
    // Guard against reload loops via a sessionStorage marker.
    const reloadedKey = "__sw_reset_reloaded";
    if (!sessionStorage.getItem(reloadedKey)) {
      sessionStorage.setItem(reloadedKey, "1");
      window.location.reload();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function registerAppServiceWorker(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  // Always run the reset check first — even in contexts where we would skip
  // registration — so previews and dev sessions also purge stale SWs.
  void maybeResetForNewVersion().then((reloading) => {
    if (reloading) return;

    if (shouldSkipRegistration()) {
      void unregisterAppSW();
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker.register(APP_SW_URL, { scope: "/" }).catch(() => {
        /* swallow — offline is best-effort */
      });
    });
  });
}
