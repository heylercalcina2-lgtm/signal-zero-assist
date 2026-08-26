// Offline semantic search: embeds the user's free-text query in a Web
// Worker (src/lib/search.worker.ts) and ranks it against the protocols'
// precomputed embeddings (src/data/protocol-embeddings.json, generated at
// build time by scripts/build-embeddings.mjs) using cosine similarity.
//
// This is an enhancement layered on top of the 6 protocol cards, never a
// requirement: the worker is only created and told to load the model once
// the model files are confirmed present in Cache Storage (see
// src/lib/aiDownload.ts) — someone who never opens Ajustes and downloads it
// just doesn't get search suggestions, nothing else in the app depends on it.
import { useCallback, useEffect, useRef, useState } from "react";
import protocolEmbeddings from "@/data/protocol-embeddings.json";
import { useAiModelStatus } from "@/lib/aiDownload";
import type { WorkerMessage } from "@/lib/search.worker";

export type SearchMatch = { protocolId: string; score: number };
export type SearchOutcome = { top: SearchMatch[]; confident: boolean };

// Calibrated empirically, not the round number you'd guess: all-MiniLM-L6-v2
// is an English-trained model, and short Spanish sentences that have nothing
// to do with any protocol still land around 0.39-0.46 cosine similarity
// against protocol text (the model's Spanish "noise floor" is much higher
// than its English one, where unrelated text scores ~0.08-0.26). A straight
// 0.35 cutoff — the naive choice — let clearly irrelevant Spanish queries
// ("se me perdieron las llaves del carro" -> 0.455) through as confident
// matches. Every genuine test match across both languages scored >= 0.52.
// 0.48 sits in the gap and rejects every off-topic query tried while still
// clearing every real one — see scripts/build-embeddings.mjs test notes.
const CONFIDENCE_THRESHOLD = 0.48;

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i]! * b[i]!;
  return sum;
}

function rankProtocols(queryEmbedding: number[]): SearchOutcome {
  const scored = (protocolEmbeddings as { id: string; es: number[]; en: number[] }[]).map((p) => ({
    protocolId: p.id,
    // Embeddings are unit-normalized (pooling: mean, normalize: true), so
    // the dot product IS the cosine similarity — no need to divide by norms.
    score: Math.max(dot(queryEmbedding, p.es), dot(queryEmbedding, p.en)),
  }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);
  return { top, confident: (top[0]?.score ?? 0) >= CONFIDENCE_THRESHOLD };
}

export function useSemanticSearch() {
  const { cached } = useAiModelStatus();
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, (embedding: number[] | null) => void>());
  const nextId = useRef(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Only spin up the worker (and tell it to load the model) once the model
  // files are confirmed to already be in Cache Storage — this is what keeps
  // the whole feature from ever attempting a surprise multi-MB download.
  useEffect(() => {
    if (!cached) return;
    if (typeof Worker === "undefined") {
      setFailed(true);
      return;
    }

    let disposed = false;
    const worker = new Worker(new URL("./search.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type === "ready") {
        if (!disposed) setReady(true);
        return;
      }
      if (msg.type === "load-error") {
        if (!disposed) setFailed(true);
        return;
      }
      const resolve = pending.current.get(msg.id);
      if (!resolve) return;
      pending.current.delete(msg.id);
      resolve(msg.type === "embedding" ? msg.embedding : null);
    };
    worker.onerror = () => {
      if (!disposed) setFailed(true);
    };
    worker.postMessage({ kind: "init" });

    return () => {
      disposed = true;
      worker.terminate();
      workerRef.current = null;
      pending.current.clear();
    };
  }, [cached]);

  // The model may still be loading (or failed to load, or was never
  // downloaded) when the person starts typing — this must never block the
  // app. Callers just get `null` back and fall back to the plain list.
  const embed = useCallback((text: string): Promise<number[] | null> => {
    return new Promise((resolve) => {
      const worker = workerRef.current;
      if (!worker) {
        resolve(null);
        return;
      }
      const id = ++nextId.current;
      pending.current.set(id, resolve);
      worker.postMessage({ kind: "embed", id, text });
    });
  }, []);

  const buscarProtocolo = useCallback(
    async (consulta: string): Promise<SearchOutcome | null> => {
      const trimmed = consulta.trim();
      if (!trimmed) return null;
      const embedding = await embed(trimmed);
      if (!embedding) return null;
      return rankProtocols(embedding);
    },
    [embed],
  );

  return { available: cached === true, ready, failed, buscarProtocolo };
}
