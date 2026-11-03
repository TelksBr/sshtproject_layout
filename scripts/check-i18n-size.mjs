import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

// Production build before this refactor, in the same worktree (gzip level 9).
const baseline = { raw: 744288, gzip: 207110 };
const limits = { raw: baseline.raw + 80 * 1024, gzip: baseline.gzip + 32 * 1024 };
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
if (exceedsBudget) throw new Error('The offline i18n size budget was exceeded (80 KiB raw / 32 KiB gzip growth).');
console.log('Offline bundle size budget passed.');
