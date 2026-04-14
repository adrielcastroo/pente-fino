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
    target: "esnext", // Modern browsers only
    minify: "esbuild", // Fast minification
    cssCodeSplit: true,
    reportCompressedSize: false, // Performance improvement during build
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('radix-ui')) return 'vendor-ui';
            if (id.includes('date-fns')) return 'vendor-utils';
            return 'vendor-others';
          }
        },
      },
    },
    // Chunks over 500kb will trigger warnings, but with chunking it's okay
    chunkSizeWarningLimit: 600,
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