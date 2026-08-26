// Controls the ONE optional, heavy download in the app: the offline
// semantic-search model (~32 MB of .onnx + tokenizer + WASM runtime files).
//
// This is intentionally separate from the Workbox precache (which only
// covers the app shell — HTML/JS/CSS/font/icons, all under ~2 MB) so a
// failed or slow model download can never block the shell from installing.
// Files land in their own Cache Storage bucket; the service worker's
// runtimeCaching rule for /models/ and /ort/ (see scripts/generate-sw.mjs)
// reads from that same bucket, so once downloaded, they're served offline
// with no extra wiring.
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import aiAssets from "@/data/ai-assets.json";

export const AI_CACHE_NAME = "signal-cero-ai-v1";
const STATUS_EVENT = "sc:ai-status-changed";

export const AI_TOTAL_BYTES = (aiAssets as { url: string; bytes: number }[]).reduce((sum, a) => sum + a.bytes, 0);
export const AI_TOTAL_MB = Math.round(AI_TOTAL_BYTES / 1024 / 1024);

export type DownloadProgress = { loaded: number; total: number };

function notifyStatusChanged() {
  window.dispatchEvent(new Event(STATUS_EVENT));
}

export async function isModelCached(): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  try {
    const cache = await caches.open(AI_CACHE_NAME);
    for (const asset of aiAssets as { url: string; bytes: number }[]) {
      if (!(await cache.match(asset.url))) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function clearModelCache(): Promise<void> {
  if (typeof caches === "undefined") return;
  await caches.delete(AI_CACHE_NAME);
  notifyStatusChanged();
}

// Downloads every asset (skipping ones already cached), streaming each
// response so `onProgress` reflects real bytes transferred rather than a
// per-file "0 or 100%" jump. Aborts cleanly and leaves partially-downloaded
// files uncached on failure (offline mid-download, server error, etc.) so a
// retry doesn't think a truncated file is complete.
export async function downloadModel(onProgress?: (p: DownloadProgress) => void): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  const assets = aiAssets as { url: string; bytes: number }[];
  let loaded = 0;
  onProgress?.({ loaded, total: AI_TOTAL_BYTES });

  try {
    const cache = await caches.open(AI_CACHE_NAME);
    for (const asset of assets) {
      const existing = await cache.match(asset.url);
      if (existing) {
        loaded += asset.bytes;
        onProgress?.({ loaded, total: AI_TOTAL_BYTES });
        continue;
      }

      const response = await fetch(asset.url);
      if (!response.ok || !response.body) throw new Error(`failed to fetch ${asset.url}: ${response.status}`);

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        onProgress?.({ loaded, total: AI_TOTAL_BYTES });
      }

      const headers = new Headers(response.headers);
      await cache.put(asset.url, new Response(new Blob(chunks as BlobPart[]), { status: 200, headers }));
    }
    notifyStatusChanged();
    return true;
  } catch {
    return false;
  }
}

export function useAiModelStatus() {
  const [cached, setCached] = useState<boolean | null>(null); // null = still checking

  const refresh = useCallback(() => {
    isModelCached().then(setCached);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(STATUS_EVENT, refresh);
    return () => window.removeEventListener(STATUS_EVENT, refresh);
  }, [refresh]);

  return { cached, refresh };
}

// Download progress lives in module-level state, not component state: the
// welcome screen, the inline prompt in the search box, and Ajustes can all
// trigger or observe the SAME download. Without this, dismissing whichever
// component started it would make the progress bar vanish everywhere else
// even though the download (a plain async function, not tied to any
// component's lifecycle) keeps running in the background regardless.
type DownloadState = { downloading: boolean; progress: DownloadProgress | null; failed: boolean };
let downloadState: DownloadState = { downloading: false, progress: null, failed: false };
const downloadListeners = new Set<() => void>();

function setDownloadState(patch: Partial<DownloadState>) {
  downloadState = { ...downloadState, ...patch };
  downloadListeners.forEach((listener) => listener());
}

function subscribeDownload(listener: () => void) {
  downloadListeners.add(listener);
  return () => downloadListeners.delete(listener);
}

let inFlight: Promise<boolean> | null = null;

// Safe to call from anywhere, any number of times — if a download is
// already running, callers just attach to the same in-flight promise
// instead of starting a second, competing one.
export function startModelDownload(): Promise<boolean> {
  if (inFlight) return inFlight;
  setDownloadState({ downloading: true, failed: false, progress: { loaded: 0, total: AI_TOTAL_BYTES } });
  inFlight = downloadModel((p) => setDownloadState({ progress: p })).then((ok) => {
    setDownloadState({ downloading: false, failed: !ok });
    inFlight = null;
    return ok;
  });
  return inFlight;
}

export function useAiDownload() {
  const { cached, refresh } = useAiModelStatus();
  const dl = useSyncExternalStore(subscribeDownload, () => downloadState, () => downloadState);

  // Re-check Cache Storage once a download (started anywhere) finishes.
  useEffect(() => {
    if (!dl.downloading) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dl.downloading]);

  const percent =
    dl.progress && dl.progress.total > 0 ? Math.min(100, Math.round((dl.progress.loaded / dl.progress.total) * 100)) : 0;

  const remove = useCallback(async () => {
    await clearModelCache();
    refresh();
  }, [refresh]);

  return {
    cached,
    downloading: dl.downloading,
    progress: dl.progress,
    percent,
    failed: dl.failed,
    start: startModelDownload,
    remove,
  };
}
