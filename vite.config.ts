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
        // Let Rollup decide chunking automatically to avoid React being
        // initialized after libraries that depend on it (e.g. recharts/react-smooth
        // calling React.forwardRef before vendor-react loads).
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