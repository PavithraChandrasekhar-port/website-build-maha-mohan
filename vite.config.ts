import fs from "node:fs";
import path from "path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { devApiPlugin } from "./vite-plugin-dev-api";

/** GitHub Pages project URLs are /repo/... — spa-github-pages 404 script needs pathSegmentsToKeep = 1 (not 0). */
function patchGithubPages404(baseUrl: string): Plugin {
  return {
    name: "patch-github-pages-404",
    apply: "build",
    closeBundle() {
      const out = path.resolve(__dirname, "dist/404.html");
      if (!fs.existsSync(out)) return;
      const segments = baseUrl.replace(/\/$/, "").split("/").filter(Boolean).length;
      let html = fs.readFileSync(out, "utf8");
      html = html.replace(/var pathSegmentsToKeep = \d+;/, `var pathSegmentsToKeep = ${segments};`);
      fs.writeFileSync(out, html);
    },
  };
}

function resolveBase(mode: string): string {
  const loaded = loadEnv(mode, process.cwd(), "");
  const raw = process.env.VITE_BASE_PATH || loaded.VITE_BASE_PATH || "/";
  if (raw === "/" || raw === "") return "/";
  let b = raw.trim();
  if (!b.startsWith("/")) b = `/${b}`;
  if (!b.endsWith("/")) b = `${b}/`;
  return b;
}

export default defineConfig(({ mode }) => {
  const base = resolveBase(mode);
  return {
  base,
  plugins: [
    devApiPlugin(),
    patchGithubPages404(base),
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
};
});
