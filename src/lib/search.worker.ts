/// <reference lib="webworker" />
// Runs the sentence-embedding model off the main thread so typing in the
// search box never janks the UI. Imports the package's pre-bundled browser
// build (dist/transformers.min.js) instead of its default entry: the default
// entry unconditionally imports `onnxruntime-node` (a native Node addon,
// picked at runtime only if `process.release.name === 'node'`), which Vite
// can't bundle for a worker. The dist build already has that import stubbed
// out for the browser.
// @ts-expect-error — the pre-bundled dist file has no matching .d.ts export map
import { pipeline, env } from "@xenova/transformers/dist/transformers.min.js";

// The model + tokenizer (public/models) and the onnxruntime WASM runtime
// (public/ort) are NOT part of the Workbox precache — they're a separate,
// user-initiated download (see src/lib/aiDownload.ts) written into the
// "signal-cero-ai-v1" Cache Storage bucket with a real progress bar. The
// service worker's runtimeCaching rule for /models/ and /ort/ (see
// scripts/generate-sw.mjs) reads from that same bucket, so once downloaded
// these fetches resolve from cache with no network — but they resolve to a
// normal 404/network-error if someone never downloaded it, which is exactly
// why this worker never touches the model until told to.
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = "/models/";
env.useBrowserCache = true;
env.backends.onnx.wasm.wasmPaths = "/ort/";
// Only the non-threaded SIMD .wasm binary is shipped (threaded needs
// COOP/COEP response headers we can't guarantee on every static host), so
// force onnxruntime-web to request exactly that file.
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.simd = true;

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

type WorkerRequest = { kind: "init" } | { kind: "embed"; id: number; text: string };
type WorkerReady = { type: "ready" };
type WorkerLoadError = { type: "load-error"; error: string };
type WorkerEmbedding = { type: "embedding"; id: number; embedding: number[] };
type WorkerEmbedError = { type: "error"; id: number; error: string };
export type WorkerMessage = WorkerReady | WorkerLoadError | WorkerEmbedding | WorkerEmbedError;

const ctx = self as unknown as {
  postMessage: (msg: WorkerMessage) => void;
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractorPromise: Promise<any> | null = null;

// Only called once the caller has confirmed the model files are already in
// Cache Storage (or is willing to trigger a real network download) — never
// automatically on worker startup.
function getExtractor() {
  const promise = extractorPromise ?? pipeline("feature-extraction", MODEL_ID, { quantized: true });
  if (!extractorPromise) {
    extractorPromise = promise;
    promise
      .then(() => ctx.postMessage({ type: "ready" }))
      .catch((err: unknown) => {
        extractorPromise = null; // allow a retry after e.g. a transient network error
        ctx.postMessage({ type: "load-error", error: err instanceof Error ? err.message : String(err) });
      });
  }
  return promise;
}

ctx.onmessage = async (event) => {
  const data = event.data;

  if (data.kind === "init") {
    getExtractor();
    return;
  }

  const { id, text } = data;
  try {
    const extractor = await getExtractor();
    const output = await extractor(text, { pooling: "mean", normalize: true });
    ctx.postMessage({ type: "embedding", id, embedding: Array.from(output.data as Float32Array) });
  } catch (err) {
    ctx.postMessage({ type: "error", id, error: err instanceof Error ? err.message : String(err) });
  }
};
