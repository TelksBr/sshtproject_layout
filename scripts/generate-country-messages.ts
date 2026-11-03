import { readFileSync, writeFileSync } from 'node:fs';
import { COUNTRY_CODES } from '../src/utils/countryNames';
import { LANGUAGES } from '../src/i18n/registry';

// Use the build runtime's ICU/CLDR data; never machine-translate country identities.
for (const locale of Object.keys(LANGUAGES)) {
  if (!Intl.DisplayNames.supportedLocalesOf([locale]).length) throw new Error(`ICU locale unavailable: ${locale}`);
  const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
  const path = `src/i18n/messages/${locale}.json`;
  const messages = JSON.parse(readFileSync(path, 'utf8'));
  for (const code of COUNTRY_CODES) {
    const name = displayNames.of(code);
    if (!name || name === code) throw new Error(`${locale}: missing country ${code}`);
    messages[`country.${code}`] = name;
  }
  writeFileSync(path, JSON.stringify(Object.fromEntries(Object.entries(messages).sort(([a], [b]) => a.localeCompare(b))), null, 2) + '\n');
}
