import "@testing-library/jest-dom";

// matchMedia mock that evaluates simple width/orientation queries against
// the current window.innerWidth / innerHeight so hooks under test behave realistically.
function evaluateQuery(query: string): boolean {
  const w = window.innerWidth ?? 1024;
  const h = window.innerHeight ?? 768;
  const parts = query.split(",").map((p) => p.trim());
  return parts.some((part) => {
    const conds = part.split(" and ").map((c) => c.trim().replace(/^\(|\)$/g, ""));
    return conds.every((cond) => {
      const minW = cond.match(/^min-width:\s*(\d+)px$/);
      if (minW) return w >= Number(minW[1]);
      const maxW = cond.match(/^max-width:\s*(\d+)px$/);
      if (maxW) return w <= Number(maxW[1]);
      const minH = cond.match(/^min-height:\s*(\d+)px$/);
      if (minH) return h >= Number(minH[1]);
      const maxH = cond.match(/^max-height:\s*(\d+)px$/);
      if (maxH) return h <= Number(maxH[1]);
      if (cond === "orientation: landscape") return w > h;
      if (cond === "orientation: portrait") return h >= w;
      if (cond === "hover: hover") return false;
      if (cond === "hover: none") return true;
      if (cond === "pointer: fine") return false;
      if (cond === "pointer: coarse") return true;
      return false;
    });
  });
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: (query: string) => {
    const listeners = new Set<(e: { matches: boolean; media: string }) => void>();
    const mql = {
      get matches() {
        return evaluateQuery(query);
      },
      media: query,
      onchange: null,
      addListener: (cb: (e: { matches: boolean; media: string }) => void) => listeners.add(cb),
      removeListener: (cb: (e: { matches: boolean; media: string }) => void) => listeners.delete(cb),
      addEventListener: (_: string, cb: (e: { matches: boolean; media: string }) => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: (e: { matches: boolean; media: string }) => void) => listeners.delete(cb),
      dispatchEvent: () => true,
    };
    return mql;
  },
});

// When window resizes during tests, notify all matchMedia listeners.
window.addEventListener("resize", () => {
  // Force a microtask so React's useEffect listeners react to the resize event.
});
