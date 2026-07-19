import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "fs";

// Read the latest version straight from src/lib/changelog.ts at build time
// so the footer always reflects the deployed bundle without manual sync.
function readLatestVersion(): string {
  try {
    const src = readFileSync(path.resolve(__dirname, "src/lib/changelog.ts"), "utf-8");
    const match = src.match(/version:\s*['"]([^'"]+)['"]/);
    return match?.[1] ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(readLatestVersion()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  build: {
    target: "es2022",
    minify: "esbuild",
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Utilidades compartilhadas por praticamente todos os chunks (clsx,
          // tailwind-merge, class-variance-authority). Se não isolarmos, o
          // Rollup joga essas libs dentro de um chunk maior (ex.: charts-vendor)
          // e o entry acaba puxando 100+KB de recharts só para pegar clsx.
          if (
            id.includes("/clsx/") ||
            id.includes("/tailwind-merge/") ||
            id.includes("/class-variance-authority/")
          ) {
            return "utils-vendor";
          }
          // Charts (recharts + d3) só são usados em dashboards — chunk separado
          // para não pesar no bundle inicial (login/rotas leves).
          if (id.includes("recharts") || id.includes("/d3-") || id.includes("victory-vloxon")) {
            return "charts-vendor";
          }
          // framer-motion só é usado em algumas rotas (login, dialogs) — isolar
          // permite que rotas frias não paguem seus ~40KB.
          if (id.includes("framer-motion")) return "motion-vendor";
          // React runtime + Radix (que depende de react em tempo de módulo).
          if (
            id.includes("react-dom") ||
            id.includes("react/") ||
            id.includes("scheduler") ||
            id.includes("@radix-ui") ||
            id.includes("cmdk") ||
            id.includes("vaul") ||
            id.includes("sonner")
          ) {
            return "react-vendor";
          }
          if (id.includes("@supabase")) return "supabase-vendor";
          if (id.includes("xlsx") || id.includes("exceljs")) return "xlsx-vendor";
          if (id.includes("date-fns")) return "date-vendor";
          if (id.includes("@tanstack")) return "query-vendor";
          // NÃO agrupar react-hook-form, @hookform/resolvers e zod em um
          // manual chunk. Rollup + minificação criam TDZ (Cannot access 'X'
          // before initialization) por causa da ordem de inicialização entre
          // eles. Deixamos o Rollup decidir automaticamente onde colocá-los.
          if (id.includes("lucide-react")) return "icons-vendor";
        },
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      filename: "sw.js",
      manifest: false, // we ship public/manifest.webmanifest manually
      devOptions: { enabled: false },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-nav",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: ({ url, request, sameOrigin }) =>
              sameOrigin &&
              ["style", "script", "worker", "image", "font"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "assets",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
