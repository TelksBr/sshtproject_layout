import assert from 'node:assert/strict';
import test from 'node:test';
import VTunnelSDK from 'vtunnel-sdk';
import { formatVpnLogEntry, getVpnLogs } from '../src/utils/appFunctions';
import { registerSdkInstance } from '../src/utils/sdkInstance';

test('preserves the native bridge time for repeated messages hours apart', () => {
  const logs = [
    { '08:03:04': 'Conectando...' },
    { '08:03:09': 'Túnel VPN estabelecido' },
    { '14:45:01': 'Conectando...' },
    { '14:45:07': 'Túnel VPN estabelecido' },
  ];
  assert.deepEqual(logs.map(formatVpnLogEntry), [
    '08:03:04  Conectando...',
    '08:03:09  Túnel VPN estabelecido',
    '14:45:01  Conectando...',
    '14:45:07  Túnel VPN estabelecido',
  ]);
  // Refreshing/reopening the log view must not rewrite historical event times.
  assert.equal(formatVpnLogEntry(logs[0]), '08:03:04  Conectando...');
});

test('SDK log retrieval and view formatting preserve every line in the same second', () => {
  const logs = [{ '10:00:00': '<b>Primeira linha</b>' }, { '10:00:00': 'Segunda linha' }];
  const sdk = new VTunnelSDK({
    window: { VtGetLogs: { execute: () => JSON.stringify(logs) } } as never,
    strict: true,
    autoRegisterNativeEvents: false,
  });
  registerSdkInstance(sdk);
  try {
    assert.deepEqual(sdk.main.getLogs(), logs);
    assert.deepEqual(getVpnLogs().map(formatVpnLogEntry), [
      '10:00:00  <b>Primeira linha</b>', '10:00:00  Segunda linha',
    ]);
  } finally { registerSdkInstance(null); }
});

test('supports structured and legacy text timestamps without inventing event time', () => {
  assert.equal(formatVpnLogEntry({ time: '09:10:11', message: 'Conectado' }), '09:10:11  Conectado');
  assert.equal(formatVpnLogEntry('[12:34:56] - Reconectando'), '12:34:56  Reconectando');
  assert.equal(formatVpnLogEntry('Mensagem sem horário'), 'Mensagem sem horário');
  assert.equal(formatVpnLogEntry({ message: 'Mensagem sem horário' }), 'Mensagem sem horário');
});
