import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { LocaleType, TranslationSchema } from './types';
import { ptBR } from './locales/pt-BR';
import { ptAO } from './locales/pt-AO';
import { es } from './locales/es';
import { getWebViewLocaleCountry } from '../utils/countryUtils';

const TRANSLATIONS: Record<LocaleType, TranslationSchema> = {
  'pt-BR': ptBR,
  'pt-AO': ptAO,
  'es': es,
};

export const LOCALE_STORAGE_KEY = 'app_i18n_locale';

/**
 * Mapeia código de país ISO Alpha-2 para o locale de tradução correspondente.
 */
export function getLanguageForCountry(countryCode: string | null | undefined): LocaleType {
  if (!countryCode) return 'pt-BR';
  const code = countryCode.toUpperCase();
  if (code === 'AR' || code === 'ES' || code === 'CL' || code === 'UY' || code === 'PY' || code === 'CO' || code === 'MX' || code === 'PE') {
    return 'es';
  }
  if (code === 'AO') {
    return 'pt-AO';
  }
  return 'pt-BR';
}

/**
 * Detecta o locale inicial com base no WebView / dispositivo.
 */
export function detectInitialLocale(): { locale: LocaleType; country: string } {
  try {
    // 1. Verifica se há preferência salva
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as LocaleType | null;
    if (saved && TRANSLATIONS[saved]) {
      const countryMap: Record<LocaleType, string> = { 'pt-BR': 'BR', 'pt-AO': 'AO', 'es': 'AR' };
      return { locale: saved, country: countryMap[saved] || 'BR' };
    }

    // 2. Tenta pelo país do WebView
    const webViewCountry = getWebViewLocaleCountry();
    if (webViewCountry) {
      return {
        locale: getLanguageForCountry(webViewCountry),
        country: webViewCountry,
      };
    }

    // 3. Tenta pelo navigator.language (ex: "es-AR", "pt-AO")
    if (typeof navigator !== 'undefined' && navigator.language) {
      const lang = navigator.language.toLowerCase();
      if (lang.startsWith('es')) return { locale: 'es', country: 'AR' };
      if (lang.includes('ao')) return { locale: 'pt-AO', country: 'AO' };
    }
  } catch {
    // Fallback silencioso
  }
  return { locale: 'pt-BR', country: 'BR' };
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
  const [localeState, setLocaleState] = useState<LocaleType>(() => detectInitialLocale().locale);
  const [countryState, setCountryState] = useState<string>(() => detectInitialLocale().country);

  const setLocale = useCallback((newLocale: LocaleType) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // ignore
    }
  }, []);

  /**
   * Altera o país e sincroniza automaticamente o idioma correspondente.
   */
  const setCountry = useCallback((countryCode: string) => {
    setCountryState(countryCode);
    if (countryCode && countryCode !== 'all' && countryCode !== 'OTHER') {
      const targetLang = getLanguageForCountry(countryCode);
      setLocale(targetLang);
    }
  }, [setLocale]);

  // Função de tradução com suporte a dot notation e interpolação {param}
  const t = useCallback((path: string, params?: Record<string, string | number>): string => {
    const currentDict = TRANSLATIONS[localeState] || ptBR;
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
    schema: TRANSLATIONS[localeState] || ptBR,
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
