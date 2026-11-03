import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { COUNTRY_CODES } from '../src/utils/countryNames';
import { COUNTRY_STORAGE_KEY, determineInitialCountry, extractCountryFromText, getAvailableCountries, getCountryDisplayName } from '../src/utils/countryUtils';
import { detectInitialLocale, I18nProvider, LOCALE_STORAGE_KEY, useTranslation } from '../src/i18n/I18nContext';
import { LANGUAGES, isSupportedLocale } from '../src/i18n/registry';
import { LanguageSelector } from '../src/components/LanguageSelector';
import type { ConfigCategory } from '../src/types/config';
import { getLanguageForCountry, resolveLocaleTag } from '../src/i18n/localeMatching';
import { parseLocaleTag } from '../src/i18n/localeTag';
import { extendLocale } from '../src/i18n/extendLocale';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://layout.example' });
Object.assign(globalThis, {
  React,
  window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0),
  cancelAnimationFrame: clearTimeout,
});
Object.defineProperty(dom.window, 'matchMedia', { value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
const { createRoot } = await import('react-dom/client');

function device(language: string) {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { language, languages: [language] } });
}

beforeEach(() => { localStorage.clear(); device('pt-BR'); });

const category = (name: string, id: number, count = 1): ConfigCategory => ({
  name, id, sorter: id, color: '',
  items: Array.from({ length: count }, (_, index) => ({ id: id * 100 + index, name: 'Config', description: null, mode: 'SSH', sorter: index, icon: null })),
});

test('all 249 country flags are recognized and named without Intl.DisplayNames', () => {
  const original = Intl.DisplayNames;
  Object.defineProperty(Intl, 'DisplayNames', { configurable: true, value: undefined });
  try {
    assert.equal(COUNTRY_CODES.length, 249);
    for (const code of COUNTRY_CODES) {
      const flag = Array.from(code, letter => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65)).join('');
      assert.equal(extractCountryFromText(`${flag} Mobile`)?.code, code);
    }
    for (const locale of Object.keys(LANGUAGES)) {
      for (const code of COUNTRY_CODES) {
        assert.notEqual(getCountryDisplayName(code, locale), code);
      }
    }
    assert.equal(getCountryDisplayName('ZA', 'pt-BR'), 'África do Sul');
    assert.equal(getCountryDisplayName('ZA', 'en'), 'South Africa');
    assert.equal(getCountryDisplayName('ZA', 'fr'), 'Afrique du Sud');
    assert.equal(getCountryDisplayName('ZA', 'ar'), 'جنوب أفريقيا');
  } finally {
    Object.defineProperty(Intl, 'DisplayNames', { configurable: true, value: original });
  }
});

test('new flagged categories appear automatically, aggregate counts and honor the device region', () => {
  device('en-ZA');
  const result = getAvailableCountries([
    category('🇿🇦 Mobile', 1, 2), category('🇿🇦 WiFi', 2), category('🇳🇵 Mobile', 3),
    category('🇧🇷 Mobile', 4), category('General', 5), category('🇯🇵 Empty', 6, 0),
  ], 'en');
  assert.deepEqual(result.countries.map(country => country.code), ['BR', 'NP', 'ZA']);
  assert.deepEqual(result.countries.find(country => country.code === 'ZA'), {
    code: 'ZA', flag: '🇿🇦', name: 'South Africa', categoryCount: 2, configCount: 3,
  });
  assert.equal(result.totalConfigs, 6);
  assert.equal(result.hasOtherWithoutFlag, true);
  assert.equal(determineInitialCountry(result.countries), 'ZA');
  localStorage.setItem(COUNTRY_STORAGE_KEY, 'NP');
  assert.equal(determineInitialCountry(result.countries), 'NP');
  localStorage.setItem(COUNTRY_STORAGE_KEY, 'all');
  assert.equal(determineInitialCountry(result.countries), 'all');
});

test('language detection preserves the actual region and a saved independent language', () => {
  device('en-ZA');
  assert.deepEqual(detectInitialLocale(), { locale: 'en', country: 'ZA' });
  device('en-ZA-u-hc-h12');
  assert.deepEqual(detectInitialLocale(), { locale: 'en', country: 'ZA' });
  localStorage.setItem(LOCALE_STORAGE_KEY, 'es');
  assert.deepEqual(detectInitialLocale(), { locale: 'es', country: 'ZA' });
  localStorage.setItem(COUNTRY_STORAGE_KEY, 'NP');
  assert.deepEqual(detectInitialLocale(), { locale: 'es', country: 'NP' });
  localStorage.setItem(LOCALE_STORAGE_KEY, 'toString');
  assert.equal(detectInitialLocale().locale, 'en');
  assert.equal(isSupportedLocale('toString'), false);
  localStorage.clear();
  device('pt-AO');
  assert.deepEqual(detectInitialLocale(), { locale: 'pt-PT', country: 'AO' });
  device('es-EC');
  assert.deepEqual(detectInitialLocale(), { locale: 'es', country: 'EC' });
});

test('countries sharing a language reuse one locale, while meaningful scripts and variants are preserved', () => {
  const cases = {
    'en-GB': 'en', 'en-ZA': 'en', 'en-NG': 'en', 'es-AR': 'es', 'es-MX': 'es', 'es-419': 'es',
    'fr-CA': 'fr', 'fr-SN': 'fr', 'fr-CD': 'fr', 'ar-EG': 'ar', 'ar-MA': 'ar', 'ar-SA': 'ar',
    'de-AT': 'de', 'de-CH': 'de', 'it-CH': 'it', 'ru-RU': 'ru', 'hi-IN': 'hi', 'id-ID': 'id', 'sw-KE': 'sw',
    'pt-BR': 'pt-BR', 'pt-PT': 'pt-PT', 'pt-AO': 'pt-PT', 'pt-MZ': 'pt-PT', 'pt-CV': 'pt-PT',
    'zh-CN': 'zh-Hans', 'zh-SG': 'zh-Hans', 'zh-TW': 'zh-Hant', 'zh-HK': 'zh-Hant',
    'zh-Hans-TW': 'zh-Hans', 'zh-Hant-CN': 'zh-Hant', 'ZH_hant_hk_u_nu_latn': 'zh-Hant',
  };
  for (const [input, expected] of Object.entries(cases)) assert.equal(resolveLocaleTag(input), expected, input);
  assert.equal(resolveLocaleTag('toString'), null);
  assert.equal(resolveLocaleTag('xx-invalid'), null);
  assert.equal(resolveLocaleTag('pt-'), null);
  assert.equal(parseLocaleTag('fr-Latn-CA-u-ca-gregory')?.region, 'CA');
  for (const code of COUNTRY_CODES) assert.ok(isSupportedLocale(getLanguageForCountry(code)), code);
});

test('preferred device languages win over a multilingual country, without inferring a country from a bare language', () => {
  device('fr-CA');
  assert.deepEqual(detectInitialLocale(), { locale: 'fr', country: 'CA' });
  device('it-CH');
  assert.deepEqual(detectInitialLocale(), { locale: 'it', country: 'CH' });
  device('fr');
  assert.deepEqual(detectInitialLocale(), { locale: 'fr', country: 'all' });
  device('af-ZA');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { language: 'af-ZA', languages: ['af-ZA', 'sw-TZ', 'en-ZA'] } });
  assert.deepEqual(detectInitialLocale(), { locale: 'sw', country: 'ZA' });
  device('und-MA');
  assert.deepEqual(detectInitialLocale(), { locale: 'ar', country: 'MA' });
});

test('regional dictionaries inherit unchanged messages without modifying their base', () => {
  const base = LANGUAGES['pt-BR'].translations;
  const regional = extendLocale(base, { common: { save: 'Guardar' } });
  assert.equal(regional.common.save, 'Guardar');
  assert.equal(regional.common.close, base.common.close);
  assert.equal(base.common.save, 'Salvar');
});

test('detection still works when persistent storage is unavailable', () => {
  device('fr-CA');
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')!;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Storage disabled'); } });
  try {
    assert.deepEqual(detectInitialLocale(), { locale: 'fr', country: 'CA' });
  } finally {
    Object.defineProperty(globalThis, 'localStorage', original);
  }
});

test('all translations retain the same keys and interpolation parameters', () => {
  function entries(value: object, prefix = ''): [string, string][] {
    return Object.entries(value).flatMap(([key, text]) => typeof text === 'string'
      ? [[`${prefix}${key}`, text] as [string, string]] : entries(text, `${prefix}${key}.`));
  }
  const reference = entries(LANGUAGES['pt-BR'].translations);
  for (const { translations } of Object.values(LANGUAGES)) {
    const translated = new Map(entries(translations));
    assert.deepEqual([...translated.keys()].sort(), reference.map(([key]) => key).sort());
    for (const [key, value] of reference) {
      assert.ok(translated.get(key)?.trim(), `Empty translation: ${key}`);
      assert.deepEqual(translated.get(key)!.match(/\{\w+\}/g), value.match(/\{\w+\}/g), key);
    }
  }
});

test('the dedicated selector searches, switches and saves language without changing the country', async () => {
  device('en-ZA');
  let context: ReturnType<typeof useTranslation>;
  function Probe() { context = useTranslation(); return <LanguageSelector />; }
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => root.render(<I18nProvider><Probe /></I18nProvider>));
    const trigger = document.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!;
    await act(async () => trigger.click());
    const search = document.querySelector<HTMLInputElement>('input[type="search"]')!;
    assert.equal(document.activeElement, search);
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(search, 'portugues');
      search.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('[role="group"] button')];
    assert.equal(buttons.length, 2);
    assert.ok(buttons.every(button => button.textContent?.includes('Português')));
    await act(async () => buttons[0].click());
    assert.equal(context!.locale, 'pt-BR');
    assert.equal(context!.country, 'ZA');
    assert.equal(localStorage.getItem(LOCALE_STORAGE_KEY), 'pt-BR');
    assert.equal(document.documentElement.lang, 'pt-BR');
    assert.equal(document.activeElement, trigger);
    await act(async () => context!.setCountry('NP'));
    assert.equal(context!.locale, 'pt-BR');
    await act(async () => trigger.click());
    assert.equal(document.querySelector('input')!.value, '');
    const reopenedSearch = document.querySelector('input')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(reopenedSearch, 'unavailable-language');
      reopenedSearch.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    assert.equal(document.querySelector('[role="status"]')?.textContent, 'Nenhum idioma encontrado');
    await act(async () => document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    assert.equal(document.querySelector('[role="dialog"]'), null);
    await act(async () => trigger.click());
    await act(async () => document.querySelector<HTMLButtonElement>('button[lang="ar"]')!.click());
    assert.equal(document.documentElement.dir, 'rtl');
    assert.equal(context!.country, 'NP');
    assert.equal(context!.t('serverSelector.noResultsDesc', { query: '$&' }), 'لم يتم العثور على فئات أو إعدادات لـ «$&».');
    await act(async () => trigger.click());
    assert.equal(document.querySelector<HTMLButtonElement>('button[lang="ar"]')!.dir, 'rtl');
    assert.ok(document.querySelector('button[aria-label="إغلاق"]'));
    await act(async () => document.querySelector<HTMLButtonElement>('button[lang="en"]')!.click());
    assert.equal(document.documentElement.dir, 'ltr');
  } finally {
    await act(async () => root.unmount());
  }
});

test('legacy Angola preferences are migrated without changing the saved server country', async () => {
  localStorage.setItem(LOCALE_STORAGE_KEY, 'pt-AO');
  localStorage.setItem(COUNTRY_STORAGE_KEY, 'ZA');
  let context: ReturnType<typeof useTranslation>;
  function Probe() { context = useTranslation(); return null; }
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => root.render(<I18nProvider><Probe /></I18nProvider>));
    assert.equal(context!.locale, 'pt-PT');
    assert.equal(context!.country, 'ZA');
    assert.equal(localStorage.getItem(LOCALE_STORAGE_KEY), 'pt-PT');
    assert.equal(localStorage.getItem(COUNTRY_STORAGE_KEY), 'ZA');
  } finally {
    await act(async () => root.unmount());
  }
});
