import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { formatVpnLogEntry, sanitizeLogHtml, stripLogHtml } from '../src/utils/appFunctions';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
Object.assign(globalThis, { window: dom.window, document: dom.window.document });

test('SSH banner keeps purple colors, font sizes, centering and explicit breaks through bridge formatting', () => {
  const source = '<b>SSH · Banner</b><br><center><font color="#A855F7" size="6"><b>T PROJECT</b></font><br><br><font color="#D8B4FE">Jogos online &amp; navegação</font></center>';
  const line = formatVpnLogEntry({ '09:29:53': source });
  const element = dom.window.document.createElement('div');
  element.innerHTML = sanitizeLogHtml(line);
  assert.ok(element.textContent!.startsWith('09:29:53  SSH · Banner'));
  assert.equal(element.querySelector('center b')?.textContent, 'T PROJECT');
  const brand = element.querySelector('font') as HTMLElement;
  assert.equal(brand.getAttribute('color'), '#A855F7');
  assert.equal(brand.style.color, 'rgb(168, 85, 247)');
  assert.equal(brand.style.fontSize, '1.75em');
  assert.equal(element.querySelectorAll('br').length, 3);
  assert.ok(element.textContent!.includes('Jogos online & navegação'));
  assert.ok(stripLogHtml(element.innerHTML).includes('T PROJECT'));
});

test('sanitizes active content and attributes while preserving the banner text', () => {
  const element = dom.window.document.createElement('div');
  element.innerHTML = sanitizeLogHtml('<script>attack()</script><style>body{display:none}</style><iframe src="https://attacker.example"></iframe><svg onload="attack()"><text>attack()</text></svg><img src=x onerror="attack()"><a href="javascript:attack()">Suporte</a><font color="#C084FC" size="999" onclick="attack()" style="background:url(https://attacker.example)">T PROJECT</font>');
  assert.equal(element.querySelector('font')?.textContent, 'T PROJECT');
  assert.equal(element.querySelectorAll('script,style,iframe,svg,img,[src],[href],[onclick],[onerror],[onload]').length, 0);
  assert.ok(!element.innerHTML.includes('attacker.example'));
  assert.ok(!element.innerHTML.includes('attack()'));
  assert.equal((element.querySelector('font') as HTMLElement).style.fontSize, '');
});

test('invalid color payloads and arbitrary attributes cannot become CSS or executable markup', () => {
  const element = dom.window.document.createElement('div');
  element.innerHTML = sanitizeLogHtml('<font color="url(https://attacker.example)" size="7;position:fixed">Seguro</font><span color="red" size="7" class="fixed" data-x="unsafe">Texto</span>');
  assert.equal(element.querySelector('font')?.attributes.length, 0);
  assert.equal(element.querySelector('span')?.attributes.length, 0);
  assert.equal(element.textContent, 'SeguroTexto');
});

test('encoded tags remain inert text and unclosed HTML is repaired', () => {
  const element = dom.window.document.createElement('div');
  element.innerHTML = sanitizeLogHtml('&lt;img src=x onerror=attack()&gt;<font color="purple"><b>Olá');
  assert.equal(element.querySelectorAll('img').length, 0);
  assert.equal(element.querySelector('font b')?.textContent, 'Olá');
  assert.ok(element.textContent!.includes('<img src=x onerror=attack()>'));
});
