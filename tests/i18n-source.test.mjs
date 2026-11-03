import assert from 'node:assert/strict';
import test from 'node:test';
import { findMessages } from '../scripts/i18n-source.mjs';

test('the audit finds UI text inside switch branches, event handlers and accessibility attributes', () => {
  const source = `function Checkout({ step, name, count }) {
    switch (step) {
      case 'payment':
        return <section title="Novo pagamento">
          <input placeholder="Nome completo" />
          <button aria-label="Copiar pagamento" className="px-4 bg-green-500" onClick={() => setError('Código indisponível')}>
            Pagar agora
          </button>
          <p>{\`\${name} copiado!\`}</p>
          <p>{\`\${count} dias\`}</p>
        </section>;
    }
  }`;
  const messages = findMessages('fixture.tsx', source).map(message => message.text);
  assert.deepEqual(messages.sort(), ['Novo pagamento', 'Nome completo', 'Copiar pagamento', 'Código indisponível', 'Pagar agora', '{p0} copiado!', '{p0} dias'].sort());
});

test('the audit excludes technical selectors, state flags, URLs, imports and SDK protocol identifiers', () => {
  const source = `import { something } from 'some-module';
  const status = 'CONNECTED';
  const mode = 'SSH';
  const x = document.querySelectorAll('button, input');
  function run() {
    setSaveStatus('saving');
    if (status === 'CONNECTED') openExternalUrl('https://sshtproject.com');
    console.error('Erro interno de diagnóstico');
    return <p className="bottom-full left-1/2">UUID</p>;
  }`;
  assert.deepEqual(findMessages('fixture.tsx', source), []);
});

test('templates retain expressions as named placeholders rather than extracting user data', () => {
  const source = 'const label = `Servidor ${server.name} com ${server.totalUsers} usuários online`;';
  const messages = findMessages('fixture.ts', source);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].text, 'Servidor {p0} com {p1} usuários online');
  assert.deepEqual(messages[0].expressions, ['server.name', 'server.totalUsers']);
});
