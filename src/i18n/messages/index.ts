import { useSyncExternalStore } from 'react';
import { inflateSync, strFromU8 } from 'fflate';
import type { LocaleType } from '../types';
import { MESSAGE_KEYS, PACKED_MESSAGES } from './data';

export type MessageKey = typeof MESSAGE_KEYS[number];
export type MessageParams = Record<string, unknown>;
const positions = new Map<string, number>(MESSAGE_KEYS.map((key, index) => [key, index]));
const cache = new Map<LocaleType, readonly string[]>();
const listeners = new Set<() => void>();
let activeLocale: LocaleType = 'pt-BR';

export function getMessageCatalog(locale: LocaleType): readonly string[] {
  const cached = cache.get(locale);
  if (cached) return cached;
  const binary = atob(PACKED_MESSAGES[locale]);
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  const decoded: unknown = JSON.parse(strFromU8(inflateSync(bytes)));
  const values = locale === 'pt-PT'
    ? getMessageCatalog('pt-BR').map((base, index) => (decoded as Record<number, string>)[index] ?? base)
    : decoded;
  if (!Array.isArray(values) || values.length !== MESSAGE_KEYS.length || values.some(value => typeof value !== 'string' || !value.trim())) {
    throw new Error(`Invalid bundled translation catalog: ${locale}`);
  }
  // Retain the base and at most two selected catalogs, rather than all languages.
  if (cache.size >= 3) {
    const oldest = [...cache.keys()].find(key => key !== 'pt-BR');
    if (oldest) cache.delete(oldest);
  }
  cache.set(locale, values);
  return values;
}

export const getMessageLocale = () => activeLocale;
export function getCatalogMessage(locale: LocaleType, key: string): string | null {
  const index = positions.get(key);
  return index === undefined ? null : getMessageCatalog(locale)[index];
}
export function subscribeMessages(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function setMessageLocale(locale: LocaleType): void {
  getMessageCatalog(locale); // Decode before publishing so subscribers see a complete dictionary.
  if (activeLocale === locale) return;
  activeLocale = locale;
  for (const listener of listeners) listener();
}

// Components subscribe without relying on provider placement; utility callbacks read
// the same locale when they run. This also supports toasts outside the main provider.
export function useMessages(): LocaleType {
  return useSyncExternalStore(subscribeMessages, getMessageLocale, getMessageLocale);
}

const recentMessages = new Map<string, { key: MessageKey; params?: MessageParams }>();
export function message(key: MessageKey, params?: MessageParams): string {
  const index = positions.get(key);
  if (index === undefined) return key;
  let text = getMessageCatalog(activeLocale)[index];
  for (const [name, value] of Object.entries(params || {})) text = text.split(`{${name}}`).join(String(value));
  // Re-localize app-generated errors already stored in state after a language change.
  // Keep the cache bounded and omit long log/report contents.
  if (text.length <= 300) {
    if (recentMessages.size >= 256) recentMessages.delete(recentMessages.keys().next().value!);
    recentMessages.set(text, { key, params });
  }
  return text;
}

export function localizeMessage(text: string): string {
  const previous = recentMessages.get(text);
  return previous ? message(previous.key, previous.params) : text;
}
