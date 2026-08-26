// Precomputes a sentence embedding per protocol (título + palabras clave +
// primeros pasos, en ES y EN) using the exact same model + files the browser
// will use offline (public/models/Xenova/all-MiniLM-L6-v2). Runs once at
// build time so the client never has to embed the fixed protocol set itself
// — only the user's typed query gets embedded live, in the Web Worker.
//
// Forcing allowRemoteModels=false here means this script fails loudly if the
// local model files are missing or corrupt, instead of silently falling back
// to a network fetch — the same failure mode that would break airplane mode.
import { pipeline, env } from "@xenova/transformers";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = path.join(root, "public", "models") + path.sep;
env.cacheDir = path.join(root, "node_modules", ".cache", "transformers") + path.sep;

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

function buildText(protocol, lang) {
  const titulo = lang === "es" ? protocol.titulo : protocol.titleEn;
  const keywords = lang === "es" ? protocol.palabrasClave : protocol.palabrasClaveEn;
  const pasos = protocol.pasos.slice(0, 3).map((p) => (lang === "es" ? p.texto : p.textEn));
  return [titulo, ...(keywords ?? []), ...pasos].join(". ");
}

async function main() {
  const protocolsRaw = await readFile(path.join(root, "src/data/protocols.json"), "utf8");
  const protocols = JSON.parse(protocolsRaw);

  console.log(`[build-embeddings] loading ${MODEL_ID} (local, quantized)...`);
  const extractor = await pipeline("feature-extraction", MODEL_ID, { quantized: true });

  const embed = async (text) => {
    const output = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  };

  const result = [];
  for (const protocol of protocols) {
    const es = await embed(buildText(protocol, "es"));
    const en = await embed(buildText(protocol, "en"));
    result.push({ id: protocol.id, es, en });
    console.log(`[build-embeddings] embedded ${protocol.id} (dim=${es.length})`);
  }

  const outPath = path.join(root, "src/data/protocol-embeddings.json");
  await writeFile(outPath, JSON.stringify(result));
  console.log(`[build-embeddings] wrote ${result.length} protocol embeddings -> ${outPath}`);
}

main().catch((err) => {
  console.error("[build-embeddings] failed:", err);
  process.exit(1);
});
