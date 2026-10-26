import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// ONNX Runtime fetches its loader modules with a runtime import(). Vite refuses
// to transform files in public/, so serve them as plain static modules first.
function ortStaticAssets(): Plugin {
  const ortDir = resolve(process.cwd(), 'public/ort');
  const types: Record<string, string> = {
    '.mjs': 'text/javascript; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.wasm': 'application/wasm',
    '.json': 'application/json; charset=utf-8',
  };

  return {
    name: 'standin-ort-static-assets',
    configureServer(server) {
      server.middlewares.use('/ort', (req, res, next) => {
        const pathname = decodeURIComponent((req.url ?? '').split('?')[0] ?? '');
        const rel = pathname.replace(/^\/+/, '');
        if (!rel || rel.includes('..') || rel.includes('\0')) {
          next();
          return;
        }

        const file = resolve(ortDir, rel);
        if (!file.startsWith(ortDir + sep) || !existsSync(file) || !statSync(file).isFile()) {
          next();
          return;
        }

        res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), ortStaticAssets()],
  optimizeDeps: {
    include: ['@huggingface/transformers'],
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
});
