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
    target: "es2020", // Better compatibility for older tablets like TCL Tab 10L
    minify: "esbuild", // Fast minification
    cssCodeSplit: true,
    reportCompressedSize: false, // Performance improvement during build
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@tanstack/react-query', 'lucide-react', 'sonner'],
          'vendor-charts': ['recharts'],
          'vendor-xlsx': ['xlsx'],
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