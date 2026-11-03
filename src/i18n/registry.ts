import type { TranslationSchema } from './types';
import { ptBR } from './locales/pt-BR';
import { ptPT } from './locales/pt-PT';
import { es } from './locales/es';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { it } from './locales/it';
import { ar } from './locales/ar';
import { ru } from './locales/ru';
import { hi } from './locales/hi';
import { id } from './locales/id';
import { sw } from './locales/sw';
import { zhHans } from './locales/zh-Hans';
import { zhHant } from './locales/zh-Hant';

interface LanguageDefinition {
  name: string;
  englishName: string;
  shortName: string;
  translations: TranslationSchema;
  direction: 'ltr' | 'rtl';
}

const language = (name: string, englishName: string, shortName: string, translations: TranslationSchema, direction: 'ltr' | 'rtl' = 'ltr'): LanguageDefinition => ({
  name, englishName, shortName, translations, direction,
});

// Register each translation here; the selector and locale type follow automatically.
export const LANGUAGES = {
  'pt-BR': language('Português (Brasil)', 'Portuguese (Brazil)', 'PT-BR', ptBR),
  'pt-PT': language('Português (Portugal / África)', 'Portuguese (Portugal / Africa / Angola)', 'PT', ptPT),
  es: language('Español', 'Spanish', 'ES', es),
  en: language('English', 'English', 'EN', en),
  fr: language('Français', 'French', 'FR', fr),
  de: language('Deutsch', 'German', 'DE', de),
  it: language('Italiano', 'Italian', 'IT', it),
  ar: language('العربية', 'Arabic', 'AR', ar, 'rtl'),
  ru: language('Русский', 'Russian', 'RU', ru),
  hi: language('हिन्दी', 'Hindi', 'HI', hi),
  id: language('Bahasa Indonesia', 'Indonesian', 'ID', id),
  sw: language('Kiswahili', 'Swahili', 'SW', sw),
  'zh-Hans': language('简体中文', 'Chinese (Simplified)', '简中', zhHans),
  'zh-Hant': language('繁體中文', 'Chinese (Traditional)', '繁中', zhHant),
};

export function isSupportedLocale(value: unknown): value is keyof typeof LANGUAGES {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LANGUAGES, value);
}
