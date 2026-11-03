import { LANGUAGES, isSupportedLocale } from './registry';
import type { LocaleType } from './types';
import { parseLocaleTag } from './localeTag';

export function resolveLocaleTag(value: unknown): LocaleType | null {
  const tag = parseLocaleTag(value);
  if (!tag) return null;
  const { language, script, region } = tag;
  if (language === 'pt') {
    return region && region !== 'BR' ? 'pt-PT' : 'pt-BR';
  }
  if (language === 'zh') {
    if (script === 'Hant') return 'zh-Hant';
    if (script === 'Hans') return 'zh-Hans';
    return region && ['TW', 'HK', 'MO'].includes(region) ? 'zh-Hant' : 'zh-Hans';
  }
  return isSupportedLocale(language) ? language : null;
}

// A country is a fallback hint, never a substitute for a user's language list.
// Regional fallbacks use a supported shared language; device preferences always win.
const COUNTRY_GROUPS: Partial<Record<LocaleType, string>> = {
  'pt-BR': 'BR',
  'pt-PT': 'PT AO MZ CV GW ST TL',
  es: 'ES AR BO CL CO CR CU DO EC GQ GT HN MX NI PA PE PR PY SV UY VE',
  fr: 'FR BE BF BI BJ BL CD CF CG CI CM DJ GA GF GN GP HT LU MC MF MG ML MQ NC NE PF PM RE SN TD TG WF YT',
  de: 'DE AT CH LI',
  it: 'IT SM VA',
  ar: 'AE BH DZ EG EH IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE',
  ru: 'RU BY',
  'zh-Hans': 'CN SG',
  'zh-Hant': 'TW HK MO',
  hi: 'IN',
  id: 'ID',
  sw: 'TZ KE',
};

const countryDefaults = new Map<string, LocaleType>();
for (const [locale, countries] of Object.entries(COUNTRY_GROUPS)) {
  for (const country of countries!.split(' ')) countryDefaults.set(country, locale as LocaleType);
}

export function getLanguageForCountry(country: string | null | undefined): LocaleType {
  if (!country) return 'pt-BR';
  return countryDefaults.get(country.toUpperCase()) || 'en';
}

export function getLocaleDirection(locale: LocaleType): 'ltr' | 'rtl' {
  return LANGUAGES[locale].direction;
}
