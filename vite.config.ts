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
          if (/[\\/]react(-dom|-router-dom)?[\\/]/.test(id)) return 'vendor-react';
          if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('vaul')) return 'vendor-ui';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('exceljs') || id.includes('xlsx-chart') || id.includes('xml-xlsx-lite') || id.includes('/xlsx/')) return 'vendor-excel';
          if (id.includes('jspdf') || id.includes('jspdf-autotable')) return 'vendor-pdf';
          if (id.includes('html2canvas') || id.includes('html-to-image')) return 'vendor-canvas';
          if (id.includes('html5-qrcode') || id.includes('qrcode.react')) return 'vendor-qr';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('@tanstack')) return 'vendor-query';
          if (id.includes('date-fns') || id.includes('zod') || id.includes('zustand')) return 'vendor-utils';
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