import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { renderToStaticMarkup } from 'react-dom/server';
import { LANGUAGES } from '../src/i18n/registry';
import { I18nProvider, LOCALE_STORAGE_KEY, useTranslation, type LocaleType } from '../src/i18n';
import { getMessageCatalog, getMessageLocale, localizeMessage, message, setMessageLocale, useMessages, type MessageKey } from '../src/i18n/messages';
import { MESSAGE_KEYS, PACKED_MESSAGES } from '../src/i18n/messages/data';
import { Terms } from '../src/components/modals/Terms';
import { Privacy } from '../src/components/modals/Privacy';
import { Faq } from '../src/components/modals/Faq';
import { Support } from '../src/components/modals/Support';
import { ServicesModal } from '../src/components/modals/ServicesModal';
import { Tutorials } from '../src/components/modals/Tutorials';
import { PlayUpdateModal } from '../src/components/modals/PlayUpdateModal';
import { ToastProvider } from '../src/hooks/useToast';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://layout.example' });
Object.assign(globalThis, {
  React, window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0),
  cancelAnimationFrame: clearTimeout,
});
Object.defineProperty(dom.window, 'matchMedia', { value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
const { createRoot } = await import('react-dom/client');
const source: Record<string, string> = JSON.parse(readFileSync(new URL('../src/i18n/messages/pt-BR.json', import.meta.url), 'utf8'));
const keyFor = (text: string): MessageKey => {
  const key = Object.keys(source).find(key => source[key] === text);
  assert.ok(key, `Source catalog is missing ${text}`);
  return key as MessageKey;
};
const placeholders = (text: string) => [...text.matchAll(/\{p\d+\}/g)].map(match => match[0]).sort();

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { language: 'en-GB', languages: ['en-GB'] } });
  setMessageLocale('en');
});

test('every catalog entry resolves offline in every registered locale, with the same placeholders', () => {
  assert.deepEqual([...MESSAGE_KEYS], Object.keys(source).sort());
  assert.deepEqual(Object.keys(PACKED_MESSAGES).sort(), Object.keys(LANGUAGES).sort());
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Runtime translation must never access the network'); };
  try {
    for (const locale of Object.keys(LANGUAGES) as LocaleType[]) {
      const expected: Record<string, string> = JSON.parse(readFileSync(new URL(`../src/i18n/messages/${locale}.json`, import.meta.url), 'utf8'));
      assert.deepEqual(Object.keys(expected).sort(), [...MESSAGE_KEYS]);
      const catalog = getMessageCatalog(locale);
      for (let index = 0; index < MESSAGE_KEYS.length; index++) {
        const key = MESSAGE_KEYS[index];
        assert.equal(catalog[index], expected[key], `${locale}/${key}: stale packed data`);
        assert.ok(catalog[index].trim(), `${locale}/${key}: empty translation`);
        assert.deepEqual(placeholders(catalog[index]), placeholders(source[key]), `${locale}/${key}`);
        assert.ok(!/__SSHTKEEP|@@SSHT/.test(catalog[index]));
      }
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('static-copy audit rejects JSX, accessibility text and templates while keeping protocol code intact', () => {
  const result = execFileSync(process.execPath, ['scripts/i18n-source.mjs', '--check'], { encoding: 'utf8' });
  assert.ok(result.startsWith('0 occurrences;'));
  const dns = readFileSync(new URL('../src/components/modals/DnsModal.tsx', import.meta.url), 'utf8');
  assert.ok(dns.includes("setSaveStatus('saving')"));
  assert.ok(dns.includes("setSaveStatus('saved')"));
  assert.ok(dns.includes("setSaveStatus('idle')"));
  const selector = readFileSync(new URL('../src/components/LanguageSelector.tsx', import.meta.url), 'utf8');
  assert.ok(selector.includes("querySelectorAll<HTMLElement>('button, input')"));
});

test('help, service, update and legal screens render translated messages across all locales', () => {
  const close = () => {};
  for (const locale of Object.keys(LANGUAGES) as LocaleType[]) {
    setMessageLocale(locale);
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    const html = renderToStaticMarkup(
      <I18nProvider><ToastProvider>
        <Terms onClose={close} /><Privacy onClose={close} /><Faq onClose={close} />
        <Support onClose={close} /><ServicesModal onClose={close} /><Tutorials onClose={close} />
        <PlayUpdateModal variant="ready" onConfirm={close} onDismiss={close} />
        <PlayUpdateModal variant="available" onConfirm={close} onDismiss={close} />
      </ToastProvider></I18nProvider>,
    );
    const body = new JSDOM(html).window.document.body;
    const text = body.textContent!;
    assert.ok(text.includes(message(keyFor('Termos de Uso'))), locale);
    assert.ok(text.includes(message(keyFor('Política de Privacidade'))), locale);
    assert.ok(text.includes('talkera@sshtproject.com'), 'Contact identity must be preserved');
    assert.equal(body.querySelectorAll('a[href="mailto:talkera@sshtproject.com"]').length, 3);
    assert.ok(!/m[0-9a-f]{10}|\{p\d+\}/.test(text), `${locale}: unresolved message`);
    if (locale === 'en') {
      assert.ok(text.includes('Terms of Use'));
      assert.ok(text.includes('Privacy Policy'));
      assert.ok(!text.includes('Bem-vindo ao SSH T Project.'));
      assert.ok(!text.includes('Precisa de ajuda?'));
    }
  }
});

test('open screens, module-level data and existing errors follow a language change', async () => {
  let context: ReturnType<typeof useTranslation>;
  const error = message(keyFor('Usuário não encontrado'));
  function Probe() {
    useMessages();
    context = useTranslation();
    return <><p id="error">{localizeMessage(error)}</p><ServicesModal onClose={() => {}} /></>;
  }
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => root.render(<I18nProvider><Probe /></I18nProvider>));
    const initial = document.querySelector('#error')!.textContent;
    assert.equal(getMessageLocale(), 'en');
    await act(async () => context!.setLocale('fr'));
    assert.equal(getMessageLocale(), 'fr');
    assert.notEqual(document.querySelector('#error')!.textContent, initial);
    assert.ok(document.body.textContent!.includes(message(keyFor('Nossos Serviços'))));
    assert.ok(!document.body.textContent!.includes('Nossos Serviços'));
    await act(async () => context!.setLocale('ar'));
    assert.equal(document.documentElement.dir, 'rtl');
    assert.ok(document.body.textContent!.includes(message(keyFor('Revenda VPN'))));
  } finally { await act(async () => root.unmount()); }
});

test('placeholder values are preserved literally and are never interpreted as replacement syntax', () => {
  const key = keyFor('Servidor {p0} com {p1} usuários online');
  const name = '$& <script>example</script> 🇿🇦';
  for (const locale of ['en', 'ar', 'zh-Hant'] as const) {
    setMessageLocale(locale);
    const result = message(key, { p0: name, p1: 23 });
    assert.ok(result.includes(name));
    assert.ok(result.includes('23'));
    assert.ok(!/\{p\d+\}/.test(result));
  }
});
