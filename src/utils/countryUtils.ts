import type { ConfigCategory } from '../types/config';

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

const FALLBACK_COUNTRY_NAMES: Record<string, string> = {
  BR: 'Brasil',
  AO: 'Angola',
  US: 'Estados Unidos',
  AR: 'Argentina',
  CL: 'Chile',
  PY: 'Paraguai',
  UY: 'Uruguai',
  CO: 'Colômbia',
  PE: 'Peru',
  MX: 'México',
  ES: 'Espanha',
  PT: 'Portugal',
  CA: 'Canadá',
  DE: 'Alemanha',
  FR: 'França',
  IT: 'Itália',
  GB: 'Reino Unido',
  UK: 'Reino Unido',
  JP: 'Japão',
  RU: 'Rússia',
  NL: 'Holanda',
  SG: 'Singapura',
};

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
 * com fallback para mapa de países conhecidos.
 */
export function getCountryDisplayName(countryCode: string, preferredLocale?: string): string {
  const code = countryCode.toUpperCase();
  try {
    if (typeof Intl !== 'undefined' && 'DisplayNames' in Intl) {
      const loc = preferredLocale || (typeof navigator !== 'undefined' ? navigator.language : 'pt-BR');
      const displayNames = new Intl.DisplayNames([loc, 'pt-BR', 'en'], { type: 'region' });
      const name = displayNames.of(code);
      if (name && name !== code) return name;
    }
  } catch {
    // Fallback silencioso
  }
  return FALLBACK_COUNTRY_NAMES[code] || code;
}

/**
 * Extrai o país a partir de uma string (ex: nome da categoria).
 */
export function extractCountryFromText(text: string | null | undefined): ExtractedCountry | null {
  if (!text) return null;
  const match = text.match(FLAG_EMOJI_REGEX);
  if (!match) return null;

  const flag = match[0];
  const code = getCountryCodeFromFlag(flag);
  if (!code) return null;

  const name = getCountryDisplayName(code);
  return { code, flag, name };
}

/**
 * Detecta o código de país a partir do locale do WebView/dispositivo (ex: "pt-BR" -> "BR").
 */
export function getWebViewLocaleCountry(): string | null {
  try {
    const rawLocales: (string | undefined)[] = [
      typeof navigator !== 'undefined' ? navigator.language : undefined,
      ...(typeof navigator !== 'undefined' && Array.isArray(navigator.languages) ? navigator.languages : []),
      typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().locale : undefined,
    ];

    for (const raw of rawLocales) {
      if (!raw || typeof raw !== 'string') continue;
      const normalized = raw.replace('_', '-').trim();
      const parts = normalized.split('-');

      // Caso 1: locale completo com região, ex: "pt-BR", "es-AR", "en-US"
      if (parts.length >= 2) {
        const region = parts[parts.length - 1].toUpperCase();
        if (region.length === 2 && /^[A-Z]{2}$/.test(region)) {
          return region;
        }
      }

      // Caso 2: idioma sem região
      const lang = parts[0].toLowerCase();
      if (lang === 'pt') return 'BR';
    }
  } catch {
    // Fallback
  }
  return null;
}

/**
 * Extrai a lista de todos os países disponíveis nas categorias de configuração.
 */
export function getAvailableCountries(categories: ConfigCategory[]): {
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

    const extracted = extractCountryFromText(category.name);
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
    return a.name.localeCompare(b.name, 'pt-BR');
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
