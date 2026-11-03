import React, { createContext, useContext, useState, useCallback, useMemo, useLayoutEffect } from 'react';
import type { LocaleType, TranslationKey, TranslationSchema } from './types';
import { en } from './locales/en';
import { LANGUAGES } from './registry';
import { setMessageLocale } from './messages';
import { getLanguageForCountry, resolveLocaleTag } from './localeMatching';
import { getWebViewLocaleCountry, getSavedCountryPreference } from '../utils/countryUtils';

export { getLanguageForCountry } from './localeMatching';

export const LOCALE_STORAGE_KEY = 'app_i18n_locale';

export function detectInitialLocale(): { locale: LocaleType; country: string } {
  const deviceCountry = getWebViewLocaleCountry();
  const country = getSavedCountryPreference() || deviceCountry || 'all';
  try {
    const saved = resolveLocaleTag(localStorage.getItem(LOCALE_STORAGE_KEY));
    if (saved) return { locale: saved, country };
  } catch {
    // Device detection remains available when storage is blocked.
  }
  const deviceLanguages = typeof navigator !== 'undefined'
    ? [navigator.language, ...(navigator.languages || [])]
    : [];
  for (const language of deviceLanguages) {
    const matched = resolveLocaleTag(language);
    if (matched) return { locale: matched, country };
  }
  return { locale: getLanguageForCountry(deviceCountry), country };
}

interface I18nContextValue {
  locale: LocaleType;
  country: string;
  direction: 'ltr' | 'rtl';
  setLocale: (locale: LocaleType) => void;
  setCountry: (countryCode: string) => void;
  t: (path: TranslationKey, params?: Record<string, string | number>) => string;
  schema: TranslationSchema;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initial] = useState(detectInitialLocale);
  const [localeState, setLocaleState] = useState<LocaleType>(initial.locale);
  const [countryState, setCountryState] = useState(initial.country);

  const setLocale = useCallback((newLocale: LocaleType) => {
    const matched = resolveLocaleTag(newLocale);
    if (!matched) return;
    setLocaleState(matched);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, matched);
    } catch {
      // ignore
    }
  }, []);

  // Region filters and the chosen interface language are independent.
  const setCountry = useCallback((countryCode: string) => {
    setCountryState(countryCode);
  }, []);

  useLayoutEffect(() => {
    setMessageLocale(localeState);
    document.documentElement.lang = localeState;
    document.documentElement.dir = LANGUAGES[localeState].direction;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, localeState);
    } catch {
      // The selected language still works when storage is blocked.
    }
  }, [localeState]);

  // Função de tradução com suporte a dot notation e interpolação {param}
  const t = useCallback((path: TranslationKey, params?: Record<string, string | number>): string => {
    const currentDict = LANGUAGES[localeState].translations;
    const fallbackDict = en;

    const parts = path.split('.');
    let val: any = currentDict;
    let fallbackVal: any = fallbackDict;

    for (const part of parts) {
      val = val ? val[part] : undefined;
      fallbackVal = fallbackVal ? fallbackVal[part] : undefined;
    }

    let text = typeof val === 'string' ? val : typeof fallbackVal === 'string' ? fallbackVal : path;

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        text = text.split(`{${key}}`).join(String(value));
      }
    }

    return text;
  }, [localeState]);

  const value = useMemo<I18nContextValue>(() => ({
    locale: localeState,
    country: countryState,
    direction: LANGUAGES[localeState].direction,
    setLocale,
    setCountry,
    t,
    schema: LANGUAGES[localeState].translations,
  }), [localeState, countryState, setLocale, setCountry, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
