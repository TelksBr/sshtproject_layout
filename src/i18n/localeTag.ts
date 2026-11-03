// BCP 47 parsing without a polyfill, including older Android WebViews.
export function parseLocaleTag(value: unknown): { language: string; script?: string; region?: string } | null {
  if (typeof value !== 'string') return null;
  const parts = value.trim().replace(/_/g, '-').split('-');
  if (!/^[a-z]{2,3}$/i.test(parts[0])) return null;
  let script: string | undefined;
  let region: string | undefined;
  for (const part of parts.slice(1)) {
    if (part.length === 1) break; // Unicode/private extensions do not identify a country.
    if (/^[a-z]{4}$/i.test(part)) script = part[0].toUpperCase() + part.slice(1).toLowerCase();
    else if (/^[a-z]{2}$/i.test(part) || /^\d{3}$/.test(part)) region = part.toUpperCase();
    else if (!/^[a-z0-9]{4,8}$/i.test(part)) return null;
  }
  return { language: parts[0].toLowerCase(), script, region };
}
