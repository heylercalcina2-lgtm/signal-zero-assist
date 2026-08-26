// Runs after `vite build`. Two separate offline layers, on purpose:
//
// 1. Precache (below): the app shell — prerendered HTML, JS, CSS, the
//    self-hosted font, icons, manifest. This is what makes "open the app in
//    airplane mode" work, so it must be small and atomic: if any one file in
//    the precache manifest fails to fetch during install, Workbox discards
//    the WHOLE batch and the old service worker (or none) stays in control.
//    A single large flaky file (a 23 MB model on a bad connection) could
//    then take the entire offline shell down with it — so those files are
//    NOT listed here.
// 2. Runtime caching (below): the semantic-search model + WASM runtime,
//    served from the "signal-cero-ai-v1" Cache Storage bucket that
//    src/lib/aiDownload.ts fills with its own progress-tracked download,
//    triggered by the person from Ajustes — never automatically. CacheFirst
//    means once downloaded, these requests never hit the network again.
import { generateSW } from "workbox-build";

// Must match AI_CACHE_NAME in src/lib/aiDownload.ts exactly — that's the
// bucket its progress-tracked download writes into, and this is the bucket
// this runtimeCaching rule reads from.
const AI_CACHE_NAME = "signal-cero-ai-v1";

const { count, size, warnings } = await generateSW({
  swDest: "dist/client/sw.js",
  globDirectory: "dist/client",
  globPatterns: ["**/*.{html,js,css,json,webmanifest,woff2,png,ico,svg,txt}"],
  // sw.js itself, and the separately-downloaded AI model + WASM runtime —
  // those are handled by runtimeCaching below, not precached.
  globIgnores: ["sw.js", "models/**", "ort/**"],
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  navigateFallback: null,
  runtimeCaching: [
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/models/") || url.pathname.startsWith("/ort/"),
      handler: "CacheFirst",
      options: { cacheName: AI_CACHE_NAME },
    },
  ],
});

for (const warning of warnings) console.warn(warning);
console.log(`[generate-sw] shell precached: ${count} files, ${(size / 1024).toFixed(1)} KB`);
