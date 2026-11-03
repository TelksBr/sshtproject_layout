import type { ConfigCategory } from '../types/config';
import { parseLocaleTag } from '../i18n/localeTag';
import { resolveLocaleTag } from '../i18n/localeMatching';
import { getCatalogMessage } from '../i18n/messages';

const displayNameCache = new Map<string, Intl.DisplayNames>();

export const FLAG_EMOJI_REGEX = /[\u{1F1E6}-\u{1F1FF}]{2}/u;

export const COUNTRY_STORAGE_KEY = 'server_selector_selected_country';

export interface ExtractedCountry {
  code: string; // Ex: 'BR', 'US'
  flag: string; // Ex: '🇧🇷', '🇺🇸'
  name: string; // Ex: 'Brasil', 'Estados Unidos'
}

export interface AvailableCountry {
  code: string;
  flag: string;
  name: string;
  categoryCount: number;
  configCount: number;
}

/**
 * Converte um emoji de bandeira Unicode de 2 caracteres indicadores regionais
 * no respectivo código ISO 3166-1 alpha-2 (ex: 🇧🇷 -> 'BR').
 */
export function getCountryCodeFromFlag(flag: string): string | null {
  if (!flag) return null;
  const codePoints = Array.from(flag).map((char) => char.codePointAt(0) || 0);
  if (
    codePoints.length === 2 &&
    codePoints[0] >= 0x1f1e6 &&
    codePoints[0] <= 0x1f1ff &&
    codePoints[1] >= 0x1f1e6 &&
    codePoints[1] <= 0x1f1ff
  ) {
    return (
      String.fromCharCode(65 + codePoints[0] - 0x1f1e6) +
      String.fromCharCode(65 + codePoints[1] - 0x1f1e6)
    );
  }
  return null;
}

/**
 * Obtém o nome amigável do país localizado através da API padrão Intl.DisplayNames,
 * com nomes locais para todos os países e territórios ISO 3166-1 em WebViews antigos.
 */
export function getCountryDisplayName(countryCode: string, preferredLocale?: string): string {
  const code = countryCode.toUpperCase() === 'UK' ? 'GB' : countryCode.toUpperCase();
  const loc = preferredLocale || (typeof navigator !== 'undefined' ? navigator.language : 'pt-BR');
  try {
    if (typeof Intl !== 'undefined' && 'DisplayNames' in Intl) {
      let displayNames = displayNameCache.get(loc);
      if (!displayNames) {
        displayNames = new Intl.DisplayNames([loc, 'en'], { type: 'region' });
        displayNameCache.set(loc, displayNames);
      }
      const name = displayNames.of(code);
      if (name && name !== code) return name;
    }
  } catch {
    // Fallback silencioso
  }
  const locale = resolveLocaleTag(loc) || 'en';
  return getCatalogMessage(locale, `country.${code}`) || code;
}

/**
 * Extrai o país a partir de uma string (ex: nome da categoria).
 */
export function extractCountryFromText(text: string | null | undefined, preferredLocale?: string): ExtractedCountry | null {
  if (!text) return null;
  const match = text.match(FLAG_EMOJI_REGEX);
  if (!match) return null;

  const flag = match[0];
  const code = getCountryCodeFromFlag(flag);
  if (!code) return null;

  const name = getCountryDisplayName(code, preferredLocale);
  return { code, flag, name };
}

/**
 * Detecta o código de país a partir do locale do WebView/dispositivo (ex: "pt-BR" -> "BR").
 */
export function getWebViewLocaleCountry(): string | null {
  try {
    const rawLocales = typeof navigator !== 'undefined'
      ? [navigator.language, ...(navigator.languages || [])].filter(Boolean)
      : [];
    if (rawLocales.length === 0 && typeof Intl !== 'undefined') {
      rawLocales.push(Intl.DateTimeFormat().resolvedOptions().locale);
    }
    for (const raw of rawLocales) {
      const region = parseLocaleTag(raw)?.region;
      if (region && /^[A-Z]{2}$/.test(region)) return region;
    }
  } catch {
    // Fallback
  }
  return null;
}

/**
 * Extrai a lista de todos os países disponíveis nas categorias de configuração.
 */
export function getAvailableCountries(categories: ConfigCategory[], preferredLocale?: string): {
  countries: AvailableCountry[];
  hasOtherWithoutFlag: boolean;
  totalCategories: number;
  totalConfigs: number;
} {
  const map = new Map<string, AvailableCountry>();
  let withoutFlagCatCount = 0;
  let withoutFlagCfgCount = 0;
  let totalCategories = 0;
  let totalConfigs = 0;

  if (!Array.isArray(categories)) {
    return {
      countries: [],
      hasOtherWithoutFlag: false,
      totalCategories: 0,
      totalConfigs: 0,
    };
  }

  for (const category of categories) {
    if (!category || !Array.isArray(category.items) || category.items.length === 0) continue;

    totalCategories++;
    const itemCount = category.items.length;
    totalConfigs += itemCount;

    const extracted = extractCountryFromText(category.name, preferredLocale);
    if (extracted) {
      const existing = map.get(extracted.code);
      if (existing) {
        existing.categoryCount += 1;
        existing.configCount += itemCount;
      } else {
        map.set(extracted.code, {
          code: extracted.code,
          flag: extracted.flag,
          name: extracted.name,
          categoryCount: 1,
          configCount: itemCount,
        });
      }
    } else {
      withoutFlagCatCount += 1;
      withoutFlagCfgCount += itemCount;
    }
  }

  // Ordena os países por contagem de configurações ou ordem alfabética
  const countries = Array.from(map.values()).sort((a, b) => {
    // Brasil primeiro se presente, caso contrário pelo nome
    if (a.code === 'BR') return -1;
    if (b.code === 'BR') return 1;
    return a.name.localeCompare(b.name, preferredLocale || 'pt-BR');
  });

  return {
    countries,
    hasOtherWithoutFlag: withoutFlagCatCount > 0,
    totalCategories,
    totalConfigs,
  };
}

/**
 * Obtém a preferência de país salva localmente.
 */
export function getSavedCountryPreference(): string | null {
  try {
    return localStorage.getItem(COUNTRY_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Salva a preferência de país selecionada pelo usuário.
 */
export function saveCountryPreference(countryCode: string): void {
  try {
    localStorage.setItem(COUNTRY_STORAGE_KEY, countryCode);
  } catch {
    // Ignora erros de localStorage
  }
}

/**
 * Determina o filtro inicial de país com base na preferência salva ou no locale do WebView.
 */
export function determineInitialCountry(
  availableCountries: AvailableCountry[],
  hasOtherWithoutFlag = false
): string {
  if (!Array.isArray(availableCountries) || availableCountries.length === 0) {
    return 'all';
  }

  // 1. Tenta recuperar escolha salva do usuário
  const saved = getSavedCountryPreference();
  if (saved) {
    if (saved === 'all') return 'all';
    if (saved === 'OTHER' && hasOtherWithoutFlag) return 'OTHER';
    if (availableCountries.some((c) => c?.code === saved)) {
      return saved;
    }
  }

  // 2. Pré-filtra com base no locale do WebView
  const webViewCountry = getWebViewLocaleCountry();
  if (webViewCountry) {
    const match = availableCountries.find((c) => c?.code === webViewCountry);
    if (match) {
      return match.code;
    }
  }

  // 3. Se não encontrar correspondência para o país do usuário, retorna 'all'
  return 'all';
}
