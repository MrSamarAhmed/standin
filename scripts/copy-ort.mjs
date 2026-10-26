// Copies the ONNX Runtime Web assets that Transformers.js needs into public/ort.
// Runs after npm install; failure here is reported but does not fail the install,
// because the app can still run in patterns-only mode until this is fixed.
import { cp, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'public', 'ort');
const candidates = [
  path.join(root, 'node_modules', '@huggingface', 'transformers', 'dist'),
  path.join(root, 'node_modules', 'onnxruntime-web', 'dist'),
];

async function main() {
  await mkdir(outDir, { recursive: true });
  let copied = 0;
  for (const dir of candidates) {
    if (!existsSync(dir)) continue;
    const files = await readdir(dir);
    for (const file of files) {
      if (/\.(wasm|mjs)$/i.test(file) && /ort|wasm/i.test(file)) {
        await cp(path.join(dir, file), path.join(outDir, file));
        copied += 1;
      }
    }
  }
  if (copied === 0) {
    console.warn('[copy-ort] No ONNX runtime assets found. Run npm install, then npm run postinstall.');
  } else {
    console.log(`[copy-ort] Copied ${copied} ONNX runtime asset(s) to public/ort.`);
  }
}

main().catch((error) => {
  console.warn('[copy-ort] Could not copy ONNX runtime assets:', error.message);
});
