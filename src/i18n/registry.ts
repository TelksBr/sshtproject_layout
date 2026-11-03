import type { TranslationSchema } from './types';
import { ptBR } from './locales/pt-BR';
import { ptAO } from './locales/pt-AO';
import { es } from './locales/es';
import { en } from './locales/en';

// Register each translation here; the selector and locale type follow automatically.
export const LANGUAGES = {
  'pt-BR': { name: 'Português (Brasil)', shortName: 'PT-BR', translations: ptBR },
  'pt-AO': { name: 'Português (Angola)', shortName: 'PT-AO', translations: ptAO },
  es: { name: 'Español', shortName: 'ES', translations: es },
  en: { name: 'English', shortName: 'EN', translations: en },
} satisfies Record<string, { name: string; shortName: string; translations: TranslationSchema }>;

export function isSupportedLocale(value: unknown): value is keyof typeof LANGUAGES {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LANGUAGES, value);
}
