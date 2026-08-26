// Lists the exact files + real byte sizes the optional offline AI search
// needs (the quantized model + its tokenizer files + the onnxruntime WASM
// runtime), read straight off disk so the number shown in a progress bar is
// never a guess. Consumed by src/lib/aiDownload.ts.
import { readdir, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function collect(dir, urlPrefix) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const url = `${urlPrefix}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...(await collect(fullPath, url)));
    } else {
      const { size } = await stat(fullPath);
      files.push({ url, bytes: size });
    }
  }
  return files;
}

async function main() {
  const modelFiles = await collect(
    path.join(root, "public/models/Xenova/all-MiniLM-L6-v2"),
    "/models/Xenova/all-MiniLM-L6-v2",
  );
  const ortFiles = await collect(path.join(root, "public/ort"), "/ort");

  const assets = [...modelFiles, ...ortFiles];
  const totalBytes = assets.reduce((sum, a) => sum + a.bytes, 0);

  const outPath = path.join(root, "src/data/ai-assets.json");
  await writeFile(outPath, JSON.stringify(assets, null, 2));
  console.log(`[build-ai-manifest] ${assets.length} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MB -> ${outPath}`);
}

main().catch((err) => {
  console.error("[build-ai-manifest] failed:", err);
  process.exit(1);
});
