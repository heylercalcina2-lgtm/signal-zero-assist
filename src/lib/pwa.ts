// Service worker registration + install-prompt handling.
//
// The service worker itself (dist/client/sw.js) is generated at build time
// by scripts/generate-sw.mjs via workbox-build — see that file for what gets
// precached. This module only wires up the runtime side: registering it,
// and reloading once a new version takes over (the "autoUpdate" behavior:
// the generated SW calls skipWaiting + clientsClaim on its own).
import { useEffect, useState } from "react";

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  // In dev there is no built sw.js (and no precache to serve); registering
  // here would just fight with Vite's own module reloading.
  if (!import.meta.env.PROD) return;

  // A controllerchange fires both when a genuinely NEWER service worker
  // takes over from an older one (the case we want to reload for) AND the
  // very first time any service worker ever claims this page (skipWaiting +
  // clientsClaim means that happens within ~1s of every first-ever visit,
  // since the page loaded uncontrolled). Reloading on that first claim was
  // wiping out anything running on the page a second after load — including
  // an in-progress AI model download, whose fetch() gets aborted mid-stream
  // by the navigation. Only wire up the reload if a controller already
  // existed before this registration, i.e. this really is an update.
  const hadController = Boolean(navigator.serviceWorker.controller);

  // This runs from a React effect, which fires well after hydration — the
  // page's own "load" event has almost always already happened by then, so
  // waiting for it here (the classic top-of-script pattern) would mean this
  // callback never runs. Register immediately instead.
  navigator.serviceWorker.register("/sw.js").then((registration) => {
    // Covers tabs left open for a long time: force a check for a newer
    // precache version every hour.
    setInterval(() => registration.update(), 60 * 60 * 1000);
  });

  if (hadController) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return { canInstall: !!deferredPrompt && !installed, promptInstall };
}
