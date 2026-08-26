// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // No backend, no server functions, no data fetching: the whole app is static
  // client-side content, so we skip Nitro entirely and ship a pure static build
  // (SPA mode) instead of a per-request SSR worker. This is required for real
  // offline support — a Cloudflare Worker can't run on-device in airplane mode,
  // but a Workbox-precached static build can.
  nitro: false,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // Only used by `vite dev`; the production build below no longer runs it.
    server: { entry: "server" },
    prerender: {
      enabled: true,
      // Belt-and-suspenders: crawl <Link>s from the pages below too, but we
      // also list the 3 dynamic protocol ids explicitly (crawlLinks alone
      // can miss dynamic routes depending on discovery order).
      crawlLinks: true,
      // Flat "route.html" files (not "route/index.html") so the offline
      // service worker can match a bare navigation request like "/rcp" by
      // appending ".html" (workbox-precaching's default cleanURLs
      // behavior), instead of needing a directory-index lookup that only
      // triggers for URLs already ending in "/".
      autoSubfolderIndex: false,
    },
    // NOTE: tanstackStart's `spa.enabled` mode is intentionally NOT used here.
    // Its default maskPath ("/") collides with our real home route: the
    // masked shell silently wins over the real "/" prerender, so the actual
    // home page (and everything crawled from it) never gets built. Since
    // every route in this app is a fixed, known path (no real dynamic data),
    // we just prerender all of them for real instead of relying on an SPA
    // fallback shell.
    pages: [
      { path: "/" },
      { path: "/rcp" },
      { path: "/informe" },
      { path: "/triaje" },
      { path: "/protocolo/hemorragia" },
      { path: "/protocolo/atragantamiento" },
      { path: "/protocolo/rcp" },
      { path: "/protocolo/atrapada" },
      { path: "/protocolo/quemadura" },
      { path: "/protocolo/convulsion" },
      { path: "/ajustes" },
    ],
  },
});
