import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { LANGUAGES } from '../src/i18n/registry';

const folder = 'src/i18n/messages/';
const source: Record<string, string> = JSON.parse(readFileSync(folder + 'pt-BR.json', 'utf8'));
const base = LANGUAGES['pt-BR'].translations;
for (const [locale, { translations }] of Object.entries(LANGUAGES)) {
  if (locale === 'pt-BR') continue;
  const path = folder + locale + '.json';
  const messages: Record<string, string> = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
  const known = new Map<string, string>();
  for (const [section, values] of Object.entries(base)) {
    for (const [key, value] of Object.entries(values)) {
      known.set(value, (translations[section as keyof typeof translations] as Record<string, string>)[key]);
    }
  }
  for (const [id, text] of Object.entries(source)) {
    if (messages[id]) continue;
    const seeded = known.get(text);
    if (seeded) messages[id] = seeded;
    else if (locale === 'pt-PT') messages[id] = text;
  }
  writeFileSync(path, JSON.stringify(messages, null, 2) + '\n');
}
