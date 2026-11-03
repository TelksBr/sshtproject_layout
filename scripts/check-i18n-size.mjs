import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

// Production build before this refactor, in the same worktree (gzip level 9).
const baseline = { raw: 744288, gzip: 207110 };
// Full application copy in 14 offline locales has a larger budget than the former
// core-only migration. Keep a hard ceiling rather than silently growing per locale.
const limits = { raw: 1050 * 1024, gzip: 400 * 1024 };
const assets = new URL('../dist/assets/', import.meta.url);
const files = readdirSync(assets).filter(file => file.endsWith('.js'));
if (files.length !== 1) throw new Error('Expected a single JavaScript bundle for the offline WebView. Run npm run build first.');
const bytes = readFileSync(new URL(files[0], assets));
const size = { raw: bytes.byteLength, gzip: gzipSync(bytes, { level: 9 }).byteLength };
let exceedsBudget = false;
for (const kind of ['raw', 'gzip']) {
  const delta = size[kind] - baseline[kind];
  console.log(`${kind}: ${(size[kind] / 1024).toFixed(2)} KiB (${delta >= 0 ? '+' : ''}${(delta / 1024).toFixed(2)} KiB, ${(100 * delta / baseline[kind]).toFixed(2)}% vs baseline)`);
  if (size[kind] > limits[kind]) exceedsBudget = true;
}
if (exceedsBudget) throw new Error('The full offline layout size budget was exceeded (1050 KiB JavaScript / 400 KiB gzip).');
console.log('Offline bundle size budget passed.');
