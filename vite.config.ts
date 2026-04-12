import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { devApiPlugin } from "./vite-plugin-dev-api";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [
    devApiPlugin(),
    react({
      // Don't fail on TypeScript errors during dev - let HMR work
      typescript: {
        ignoreBuildErrors: false, // Still check in build
      },
    }),
  ],
  publicDir: "public",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "motion-vendor": ["framer-motion"],
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/mp4|webm|ogg|mp3|wav|flac|aac/i.test(ext)) {
            return `assets/media/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: "esbuild", // Using esbuild (default) - faster and no extra dependency
    sourcemap: false,
    cssCodeSplit: true,
  },
  assetsInclude: ["**/*.glsl"],
  server: {
    port: 5173, // Changed to 5173 (Vite default) to avoid conflicts
    // true = listen on all addresses; avoids some localhost IPv4/IPv6 mismatch issues
    host: true,
    open: true,
    cors: true,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString(),
    },
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
    },
    // Force full page reload on changes to ensure cache is cleared
    watch: {
      usePolling: false,
    },
  },
  preview: {
    port: 4173,
    open: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "framer-motion"],
  },
});
