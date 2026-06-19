import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  build: {
    target: "es2020", // Improved compatibility over esnext
    minify: "esbuild", // Fast minification
    cssCodeSplit: true,
    reportCompressedSize: false, // Performance improvement during build
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return;
          // Keep React runtime + interdependent libs in a single chunk to avoid
          // out-of-order init causing a blank screen in production.
          if (
            /[\\/](react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store|@radix-ui|cmdk|vaul|@tanstack)[\\/]/.test(id)
          ) {
            return 'vendor-react';
          }
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('exceljs') || id.includes('xlsx-chart') || id.includes('xml-xlsx-lite') || id.includes('/xlsx/')) return 'vendor-excel';
          if (id.includes('jspdf')) return 'vendor-pdf';
          if (id.includes('html2canvas') || id.includes('html-to-image')) return 'vendor-canvas';
          if (id.includes('html5-qrcode') || id.includes('qrcode.react')) return 'vendor-qr';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('lucide-react')) return 'vendor-icons';
        },

      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));