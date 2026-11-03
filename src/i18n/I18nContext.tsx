import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { LocaleType, TranslationSchema } from './types';
import { ptBR } from './locales/pt-BR';
import { LANGUAGES, isSupportedLocale } from './registry';
import { getWebViewLocaleCountry, getSavedCountryPreference } from '../utils/countryUtils';

export const LOCALE_STORAGE_KEY = 'app_i18n_locale';

/**
 * Mapeia código de país ISO Alpha-2 para o locale de tradução correspondente.
 */
export function getLanguageForCountry(countryCode: string | null | undefined): LocaleType {
  const code = countryCode?.toUpperCase();
  if (code === 'AO') return 'pt-AO';
  if (['BR', 'PT', 'MZ', 'CV', 'GW', 'ST', 'TL'].includes(code || '')) return 'pt-BR';
  if (['AR', 'ES', 'CL', 'UY', 'PY', 'CO', 'MX', 'PE', 'BO', 'EC', 'VE', 'CR', 'CU', 'DO', 'GT', 'HN', 'NI', 'PA', 'SV', 'GQ'].includes(code || '')) return 'es';
  return code ? 'en' : 'pt-BR';
}

export function detectInitialLocale(): { locale: LocaleType; country: string } {
  const deviceCountry = getWebViewLocaleCountry();
  const country = getSavedCountryPreference() || deviceCountry || 'all';
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isSupportedLocale(saved)) return { locale: saved, country };
  } catch {
    // Device detection remains available when storage is blocked.
  }
  const deviceLanguages = typeof navigator !== 'undefined'
    ? [navigator.language, ...(navigator.languages || [])]
    : [];
  for (const language of deviceLanguages) {
    const normalized = language?.replace(/_/g, '-');
    if (!normalized) continue;
    const exact = Object.keys(LANGUAGES).find(code => code.toLowerCase() === normalized.toLowerCase());
    if (isSupportedLocale(exact)) return { locale: exact, country };
    const base = normalized.split('-')[0].toLowerCase();
    if (base === 'pt') return { locale: normalized.toUpperCase().endsWith('-AO') ? 'pt-AO' : 'pt-BR', country };
    if (isSupportedLocale(base)) return { locale: base, country };
  }
  return { locale: getLanguageForCountry(deviceCountry), country };
}

interface I18nContextValue {
  locale: LocaleType;
  country: string;
  setLocale: (locale: LocaleType) => void;
  setCountry: (countryCode: string) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  schema: TranslationSchema;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initial] = useState(detectInitialLocale);
  const [localeState, setLocaleState] = useState<LocaleType>(initial.locale);
  const [countryState, setCountryState] = useState(initial.country);

  const setLocale = useCallback((newLocale: LocaleType) => {
    if (!isSupportedLocale(newLocale)) return;
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // ignore
    }
  }, []);

  // Region filters and the chosen interface language are independent.
  const setCountry = useCallback((countryCode: string) => {
    setCountryState(countryCode);
  }, []);

  useEffect(() => {
    document.documentElement.lang = localeState;
  }, [localeState]);

  // Função de tradução com suporte a dot notation e interpolação {param}
  const t = useCallback((path: string, params?: Record<string, string | number>): string => {
    const currentDict = LANGUAGES[localeState].translations;
    const fallbackDict = ptBR;

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
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
      }
    }

    return text;
  }, [localeState]);

  const value = useMemo<I18nContextValue>(() => ({
    locale: localeState,
    country: countryState,
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
