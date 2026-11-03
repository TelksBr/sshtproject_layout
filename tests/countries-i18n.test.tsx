import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { COUNTRY_NAMES } from '../src/utils/countryNames';
import { COUNTRY_STORAGE_KEY, determineInitialCountry, extractCountryFromText, getAvailableCountries, getCountryDisplayName } from '../src/utils/countryUtils';
import { detectInitialLocale, I18nProvider, LOCALE_STORAGE_KEY, useTranslation } from '../src/i18n/I18nContext';
import { LANGUAGES, isSupportedLocale } from '../src/i18n/registry';
import { LanguageSelector } from '../src/components/LanguageSelector';
import type { ConfigCategory } from '../src/types/config';

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
    assert.equal(Object.keys(COUNTRY_NAMES.en).length, 249);
    for (const code of Object.keys(COUNTRY_NAMES.en)) {
      const flag = Array.from(code, letter => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65)).join('');
      assert.equal(extractCountryFromText(`${flag} Mobile`)?.code, code);
      for (const locale of ['pt-BR', 'pt-AO', 'en', 'es']) {
        assert.notEqual(getCountryDisplayName(code, locale), code);
      }
    }
    assert.equal(getCountryDisplayName('ZA', 'pt-BR'), 'África do Sul');
    assert.equal(getCountryDisplayName('ZA', 'en'), 'South Africa');
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
  assert.deepEqual(detectInitialLocale(), { locale: 'pt-AO', country: 'AO' });
  device('es-EC');
  assert.deepEqual(detectInitialLocale(), { locale: 'es', country: 'EC' });
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
  } finally {
    await act(async () => root.unmount());
  }
});
