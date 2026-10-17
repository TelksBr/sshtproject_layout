// Dev-only fixture. Not imported by the production entry point.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import VTunnelSDK from 'vtunnel-sdk';
import { installVTunnelSDKSimulator } from 'vtunnel-sdk/simulator';
import { registerSdkInstance } from '../src/utils/sdkInstance';
import { registerSdkForEvents } from '../src/utils/dtunnelEventBridge';
import { FreeAdsPanel } from '../src/components/FreeAdsPanel';
import { I18nProvider, useTranslation } from '../src/i18n';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { AutoConnectProvider } from '../src/context/AutoConnectContext';
import { ActiveConfigProvider } from '../src/context/ActiveConfigContext';
import ConnectionForm from '../src/components/ConnectionForm';
import '../src/index.css';
import '../src/free-ads.css';

if (!import.meta.env.DEV) throw new Error('Preview is only available in development');
const simulator = installVTunnelSDKSimulator({ state: {
  adsEnabled: true, remainingConnectionTime: 600, vpnState: 'CONNECTED',
  defaultConfig: { id: 0, name: '', mode: '' }, selectedConfigId: 0, configs: [],
  ads: { warningSeconds: 60, nativeUi: { timer: false, warningPrompt: false, expiredPrompt: false, rewardedPrompt: false, rewardedLoading: false, banner: false }, graceUsed: true },
} });
const sdk = new VTunnelSDK({ strict: false });
registerSdkInstance(sdk);
registerSdkForEvents(sdk);

function selectCredentialCase(embedded: boolean | null) {
  const config = { id: embedded === null ? 0 : 900, name: 'Servidor de teste', mode: 'SSH_DIRECT',
    description: '', icon: '', sorter: 0, requires_username: !embedded, requires_password: !embedded, requires_uuid: false };
  simulator.setState({ defaultConfig: config, selectedConfigId: config.id,
    configs: embedded === null ? [] : [{ id: 1, name: 'Teste', sorter: 0, color: '', items: [config] }] });
  simulator.emit('newDefaultConfig', config);
}

function Preview() {
  const { setMode } = useTheme();
  const { setLocale } = useTranslation();
  const [blocked, setBlocked] = useState(false);
  return <div style={{ height: '100%', overflow: 'auto', background: 'var(--bg)', color: 'var(--text)', padding: 20 }}>
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 18 }}>SSHTProject Free · simulador de Ads</h1>
      <ConnectionForm vpnState="DISCONNECTED" />
      <div style={{ marginTop: 12 }} />
      <FreeAdsPanel blocked={blocked} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {([
          ['Vídeo aberto', () => simulator.simulateRewardedResult('shown')],
          ['Recompensar', () => simulator.simulateRewardedResult('rewarded')],
          ['Fechar vídeo', () => simulator.simulateRewardedResult('closed')],
          ['Falhar vídeo', () => simulator.simulateRewardedResult('failed')],
          ['Aviso de tempo', () => { simulator.setState({ remainingConnectionTime: 61, vpnState: 'CONNECTED' }); simulator.tickAds(2); }],
          ['Esgotar tempo', () => { simulator.setState({ remainingConnectionTime: 1, vpnState: 'CONNECTED', ads: { graceUsed: true } }); simulator.tickAds(2); }],
          ['Tema claro', () => setMode('light')], ['Tema escuro', () => setMode('dark')],
          ['Español', () => setLocale('es')], ['Português', () => setLocale('pt-BR')],
          ['Bloquear avisos', () => setBlocked(value => !value)],
          ['Credenciais embutidas', () => selectCredentialCase(true)],
          ['Exigir credenciais', () => selectCredentialCase(false)],
          ['Remover seleção', () => selectCredentialCase(null)],
          ['Ads desativados', () => { simulator.setState({ adsEnabled: false }); simulator.emit('adsTimerUpdated', 0); }],
        ] as const).map(([label, action]) => <button className="free-ads-secondary" key={label} onClick={action}>{label}</button>)}
      </div>
      <p className="free-ads-help">Teste local sem anúncios reais. Os botões simulam callbacks do Android. Esta página não faz parte do build de produção.</p>
    </div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><I18nProvider><ThemeProvider><ActiveConfigProvider><AutoConnectProvider><Preview /></AutoConnectProvider></ActiveConfigProvider></ThemeProvider></I18nProvider></React.StrictMode>);
