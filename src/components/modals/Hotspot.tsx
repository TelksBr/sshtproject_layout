import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Wifi,
  WifiOff,
  Globe,
  ShieldCheck,
  Radio,
  ExternalLink,
  Copy,
  Check,
  Settings,
  AlertTriangle,
  QrCode,
  Smartphone,
  Monitor,
  Tv,
  Info,
  RefreshCw,
} from '../../utils/icons';
import { Modal } from './Modal';
import { useHotspotGlobal } from '../../hooks/useGlobalPolling';
import { getLocalIpsData } from '../../utils/hotspotUtils';
import { copyToClipboard, vibrate, showNativeToast, openUrl } from '../../utils/appFunctions';
import { generateQRCodeDataURL } from '../../utils/qrCodeGenerator';

interface HotspotProps {
  onClose: () => void;
}

type HotspotTab = 'methods' | 'qrcode' | 'tutorials' | 'settings';
type QrCodeType = 'pac' | 'http' | 'socks' | 'socks_udp' | 'telegram';
type TutorialDevice = 'android' | 'ios' | 'windows' | 'tv' | 'telegram';

const Hotspot = memo(function Hotspot({ onClose }: HotspotProps) {
  const {
    isEnabled,
    hotspotInfo,
    vpnState,
    loading,
    start,
    stop,
    checkStatus,
  } = useHotspotGlobal();

  const [activeTab, setActiveTab] = useState<HotspotTab>('methods');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Porta customizada (salva em localStorage)
  const [customPort, setCustomPort] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('vtunnel_hotspot_port');
      if (saved) {
        const p = parseInt(saved, 10);
        if (!isNaN(p) && p >= 1024 && p <= 65534) return p;
      }
    } catch {
      /* ignore */
    }
    return 8578;
  });

  // Tipo de dado do QR Code
  const [qrType, setQrType] = useState<QrCodeType>('pac');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);

  // Dispositivo ativo nos tutoriais
  const [tutorialDevice, setTutorialDevice] = useState<TutorialDevice>('android');

  // IPs detectados da rede
  const [localIps, setLocalIps] = useState(getLocalIpsData);

  useEffect(() => {
    setLocalIps(getLocalIpsData());
  }, [isEnabled]);

  // Salva preferência de porta
  const handlePortChange = (val: string) => {
    const p = parseInt(val, 10);
    if (!isNaN(p)) {
      setCustomPort(p);
      try {
        localStorage.setItem('vtunnel_hotspot_port', String(p));
      } catch {
        /* ignore */
      }
    }
  };

  const handleResetPort = () => {
    setCustomPort(8578);
    try {
      localStorage.setItem('vtunnel_hotspot_port', '8578');
    } catch {
      /* ignore */
    }
    try {
      vibrate(20);
    } catch {
      /* ignore */
    }
    showNativeToast('Porta restaurada para o padrão (8578)');
  };

  // Helper de cópia com feedback
  const handleCopy = useCallback((text: string, label: string, key: string) => {
    try {
      vibrate(25);
    } catch {
      /* ignore */
    }
    copyToClipboard(text);
    setCopiedKey(key);
    showNativeToast(`${label} copiado!`);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  }, []);

  // Telegram direct link
  const telegramProxyLink = useMemo(() => {
    return `tg://socks?server=${encodeURIComponent(hotspotInfo.ip)}&port=${hotspotInfo.socksPort}`;
  }, [hotspotInfo.ip, hotspotInfo.socksPort]);

  // Conteúdo ativo para QR Code
  const activeQrContent = useMemo(() => {
    switch (qrType) {
      case 'pac':
        return hotspotInfo.pacUrl;
      case 'http':
        return hotspotInfo.httpProxy;
      case 'socks':
        return hotspotInfo.socksProxy;
      case 'socks_udp':
        return hotspotInfo.socksUdpProxy || `${hotspotInfo.ip}:${hotspotInfo.socksUdpPort || 8580}`;
      case 'telegram':
        return telegramProxyLink;
      default:
        return hotspotInfo.pacUrl;
    }
  }, [qrType, hotspotInfo, telegramProxyLink]);

  // Gera o QR Code quando a aba ou conteúdo mudar
  useEffect(() => {
    let isCancelled = false;
    if (activeTab === 'qrcode') {
      setQrCodeLoading(true);
      generateQRCodeDataURL(activeQrContent, {
        size: 320,
        margin: 3,
        colorDark: '#0b0914',
        colorLight: '#ffffff',
      })
        .then((url) => {
          if (!isCancelled) {
            setQrCodeUrl(url);
            setQrCodeLoading(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setQrCodeUrl(null);
            setQrCodeLoading(false);
          }
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [activeTab, activeQrContent]);

  // Ação mestre de iniciar / parar
  const handleMasterToggle = async () => {
    try {
      vibrate(35);
    } catch {
      /* ignore */
    }
    if (isEnabled) {
      await stop();
    } else {
      await start(customPort);
    }
  };

  const isVpnActive = vpnState === 'CONNECTED';

  return (
    <Modal onClose={onClose} title="Hotspot & Compartilhamento" icon={Wifi}>
      <div className="flex-1 p-3 sm:p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Banner do Status Principal */}
        <div
          className="p-4 sm:p-5 rounded-2xl transition-all duration-300 relative overflow-hidden"
          style={{
            background: isEnabled
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)'
              : 'var(--bg-elevated)',
            border: `1px solid ${isEnabled ? 'rgba(16, 185, 129, 0.35)' : 'var(--border)'}`,
            boxShadow: isEnabled ? '0 8px 32px -8px rgba(16, 185, 129, 0.2)' : 'none',
          }}
        >
          {/* Efeito Glow de Fundo */}
          {isEnabled && (
            <div
              className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-40"
              style={{ background: 'var(--ok, #10b981)' }}
            />
          )}

          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Ícone com Pulse */}
              <div
                className={`w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 relative ${
                  isEnabled ? 'scale-105' : ''
                }`}
                style={{
                  background: isEnabled ? 'rgba(16, 185, 129, 0.18)' : 'var(--surface)',
                  border: `1.5px solid ${isEnabled ? 'rgba(16, 185, 129, 0.45)' : 'var(--border)'}`,
                }}
              >
                {isEnabled ? (
                  <>
                    <Wifi className="w-6 h-6 text-emerald-400 animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                  </>
                ) : (
                  <WifiOff className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                )}
              </div>

              {/* Informações de Status */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-base sm:text-lg" style={{ color: 'var(--text)' }}>
                    {loading
                      ? isEnabled
                        ? 'Parando Hotspot...'
                        : 'Iniciando Hotspot...'
                      : isEnabled
                      ? 'Hotspot Ativo'
                      : 'Hotspot Inativo'}
                  </h2>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                      isEnabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                    }`}
                  >
                    {isEnabled ? 'Servidor Online' : 'Desligado'}
                  </span>
                </div>

                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                  {isEnabled
                    ? `Proxy ativo em ${hotspotInfo.ip}:${hotspotInfo.httpPort}`
                    : 'Compartilhe sua conexão VPN via Proxy HTTP, SOCKS5 e PAC'}
                </p>
              </div>
            </div>

            {/* Botão Liga / Desliga */}
            <button
              onClick={handleMasterToggle}
              disabled={loading}
              className={`
                px-5 min-h-[46px] rounded-full font-bold text-sm transition-all duration-200 touch-manipulation
                active:scale-95 flex items-center justify-center gap-2 flex-shrink-0 shadow-lg cursor-pointer
                disabled:opacity-60 disabled:cursor-not-allowed
                ${
                  isEnabled
                    ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/40'
                    : 'text-white hover:brightness-110'
                }
              `}
              style={{
                background: isEnabled ? undefined : 'var(--accent)',
                boxShadow: isEnabled
                  ? '0 4px 16px -2px rgba(244, 63, 94, 0.25)'
                  : '0 4px 20px -2px rgba(139, 92, 246, 0.4)',
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>{isEnabled ? 'Parando...' : 'Iniciando...'}</span>
                </>
              ) : isEnabled ? (
                'Desativar'
              ) : (
                'Ativar Hotspot'
              )}
            </button>
          </div>

          {/* Aviso se a VPN estiver desconectada */}
          {!isVpnActive && (
            <div
              className="mt-3.5 p-2.5 sm:p-3 rounded-xl flex items-start gap-2.5 text-xs transition-all duration-200"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#fbbf24',
              }}
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Aviso: A VPN principal está desconectada</span>
                <span className="text-amber-200/80 leading-relaxed text-[11px] sm:text-xs">
                  Para que os outros dispositivos consigam acessar a internet protegida, conecte a VPN antes de iniciar o compartilhamento.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Abas Superiores (Segmented Control) */}
        <div
          className="flex p-1 rounded-xl gap-1 overflow-x-auto scrollbar-none"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setActiveTab('methods')}
            className={`flex-1 min-w-[95px] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
              activeTab === 'methods'
                ? 'bg-[var(--accent)] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Métodos IP</span>
          </button>

          <button
            onClick={() => setActiveTab('qrcode')}
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
              activeTab === 'qrcode'
                ? 'bg-[var(--accent)] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 flex-shrink-0" />
            <span>QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('tutorials')}
            className={`flex-1 min-w-[95px] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
              activeTab === 'tutorials'
                ? 'bg-[var(--accent)] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Como Usar</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[var(--accent)] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Settings className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Avançado</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* ABA 1: TODOS OS MÉTODOS DE IP & PROXY                          */}
        {/* ============================================================== */}
        {activeTab === 'methods' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* 1. Método HTTP / HTTPS Proxy */}
            <div
              className="p-4 rounded-xl space-y-3 transition-all duration-200"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                      Proxy HTTP / HTTPS
                    </h3>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Configuração padrão para celulares, PCs, Smart TVs e consoles
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  Universal
                </span>
              </div>

              {/* Grid com IP e Porta lado a lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Campo IP */}
                <div
                  className="p-2.5 rounded-lg flex items-center justify-between gap-2"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="min-w-0">
                    <span className="text-[10px] block font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Endereço IP (Host)
                    </span>
                    <span className="font-mono font-bold text-sm truncate block" style={{ color: 'var(--text)' }}>
                      {hotspotInfo.ip}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(hotspotInfo.ip, 'Endereço IP', 'http_ip')}
                    className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-hover)] cursor-pointer text-[var(--accent)] flex-shrink-0"
                    title="Copiar IP"
                  >
                    {copiedKey === 'http_ip' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Campo Porta */}
                <div
                  className="p-2.5 rounded-lg flex items-center justify-between gap-2"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="min-w-0">
                    <span className="text-[10px] block font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Porta HTTP
                    </span>
                    <span className="font-mono font-bold text-sm truncate block" style={{ color: 'var(--text)' }}>
                      {hotspotInfo.httpPort}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(String(hotspotInfo.httpPort), 'Porta HTTP', 'http_port')}
                    className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-hover)] cursor-pointer text-[var(--accent)] flex-shrink-0"
                    title="Copiar Porta"
                  >
                    {copiedKey === 'http_port' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botão Copiar Proxy Completo */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  String: <strong style={{ color: 'var(--text)' }}>{hotspotInfo.httpProxy}</strong>
                </span>
                <button
                  onClick={() => handleCopy(hotspotInfo.httpProxy, 'Proxy HTTP completo', 'http_full')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                  style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  {copiedKey === 'http_full' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Copiar IP:Porta</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Método SOCKS5 Proxy com Relay UDP */}
            <div
              className="p-4 rounded-xl space-y-3 transition-all duration-200"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                      Proxy SOCKS5 & Relay UDP
                    </h3>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Suporte a tráfego TCP e UDP completo (Telegram, jogos, DNS e chamadas)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {hotspotInfo.udpSupported ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      UDP Ativo
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-violet-500/15 text-violet-400 border border-violet-500/30">
                      SOCKS5
                    </span>
                  )}
                </div>
              </div>

              {/* Grid com IP, Porta SOCKS TCP e Porta SOCKS UDP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* Campo IP SOCKS */}
                <div
                  className="p-2.5 rounded-lg flex items-center justify-between gap-2"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="min-w-0">
                    <span className="text-[10px] block font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Endereço IP (Host)
                    </span>
                    <span className="font-mono font-bold text-sm truncate block" style={{ color: 'var(--text)' }}>
                      {hotspotInfo.ip}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(hotspotInfo.ip, 'Endereço IP', 'socks_ip')}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-hover)] cursor-pointer text-[var(--accent)] flex-shrink-0"
                    title="Copiar IP"
                  >
                    {copiedKey === 'socks_ip' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Campo Porta SOCKS (TCP) */}
                <div
                  className="p-2.5 rounded-lg flex items-center justify-between gap-2"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="min-w-0">
                    <span className="text-[10px] block font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Porta SOCKS5 (TCP)
                    </span>
                    <span className="font-mono font-bold text-sm truncate block" style={{ color: 'var(--text)' }}>
                      {hotspotInfo.socksPort}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(String(hotspotInfo.socksPort), 'Porta SOCKS5', 'socks_port')}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-hover)] cursor-pointer text-[var(--accent)] flex-shrink-0"
                    title="Copiar Porta TCP"
                  >
                    {copiedKey === 'socks_port' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Campo Porta Relay UDP */}
                <div
                  className="p-2.5 rounded-lg flex items-center justify-between gap-2"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="min-w-0">
                    <span className="text-[10px] block font-medium uppercase tracking-wider text-emerald-400">
                      Relay UDP
                    </span>
                    <span className="font-mono font-bold text-sm truncate block text-emerald-300">
                      {hotspotInfo.socksUdpPort || (hotspotInfo.httpPort === 8578 ? 8580 : hotspotInfo.httpPort + 2)}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        String(hotspotInfo.socksUdpPort || (hotspotInfo.httpPort === 8578 ? 8580 : hotspotInfo.httpPort + 2)),
                        'Porta UDP Relay',
                        'socks_udp_port'
                      )
                    }
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-hover)] cursor-pointer text-emerald-400 flex-shrink-0"
                    title="Copiar Porta UDP"
                  >
                    {copiedKey === 'socks_udp_port' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Linha com Proxies formatados e botões de ação */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    className="p-2 rounded-lg flex items-center justify-between gap-2"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="min-w-0 truncate">
                      <span className="text-[10px] text-[var(--text-muted)] block">Proxy SOCKS5 (TCP):</span>
                      <strong className="font-mono text-[11px]" style={{ color: 'var(--text)' }}>
                        {hotspotInfo.socksProxy}
                      </strong>
                    </div>
                    <button
                      onClick={() => handleCopy(hotspotInfo.socksProxy, 'Proxy SOCKS5 completo', 'socks_full')}
                      className="px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer bg-[var(--bg-elevated)] hover:bg-[var(--surface-hover)] flex-shrink-0"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      {copiedKey === 'socks_full' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[var(--accent)]" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div
                    className="p-2 rounded-lg flex items-center justify-between gap-2"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="min-w-0 truncate">
                      <span className="text-[10px] text-emerald-400 block">Endereço Relay UDP:</span>
                      <strong className="font-mono text-[11px] text-emerald-300">
                        {hotspotInfo.socksUdpProxy ||
                          `${hotspotInfo.ip}:${hotspotInfo.socksUdpPort || (hotspotInfo.httpPort === 8578 ? 8580 : hotspotInfo.httpPort + 2)}`}
                      </strong>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(
                          hotspotInfo.socksUdpProxy ||
                            `${hotspotInfo.ip}:${hotspotInfo.socksUdpPort || (hotspotInfo.httpPort === 8578 ? 8580 : hotspotInfo.httpPort + 2)}`,
                          'Proxy UDP Relay',
                          'socks_udp_full'
                        )
                      }
                      className="px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer bg-[var(--bg-elevated)] hover:bg-[var(--surface-hover)] flex-shrink-0"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      {copiedKey === 'socks_udp_full' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Atalho direto para configuração no Telegram:
                  </span>
                  <button
                    onClick={() => handleCopy(telegramProxyLink, 'Link Telegram SOCKS5', 'socks_tg')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30"
                  >
                    {copiedKey === 'socks_tg' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>Link Telegram</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Método Auto Proxy Script PAC */}
            <div
              className="p-4 rounded-xl space-y-3 transition-all duration-200"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                      Script Automático PAC
                    </h3>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Configuração automática via URL para iPhone (iOS), iPad, Mac e Windows
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Auto-Config
                </span>
              </div>

              {/* URL do PAC */}
              <div
                className="p-2.5 rounded-lg flex items-center justify-between gap-2"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] block font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    URL do Script de Configuração (PAC)
                  </span>
                  <span className="font-mono font-semibold text-xs truncate block text-amber-300 select-all">
                    {hotspotInfo.pacUrl}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(hotspotInfo.pacUrl, 'URL PAC', 'pac_url')}
                  className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-hover)] cursor-pointer text-[var(--accent)] flex-shrink-0"
                  title="Copiar URL PAC"
                >
                  {copiedKey === 'pac_url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Ações do PAC */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                  Basta colar essa URL na opção <em>"Automático / URL do Script"</em> no Wi-Fi do iPhone.
                </p>
                <button
                  onClick={() => {
                    setQrType('pac');
                    setActiveTab('qrcode');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer bg-[var(--surface)] hover:bg-[var(--surface-hover)] flex-shrink-0"
                  style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Ver QR Code</span>
                </button>
              </div>
            </div>

            {/* 4. Página de Teste Web (Help URL) */}
            <div
              className="p-3.5 rounded-xl flex items-center justify-between gap-3 transition-all duration-200"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs" style={{ color: 'var(--text)' }}>
                    Página de Teste Web
                  </h4>
                  <p className="text-[11px] truncate font-mono" style={{ color: 'var(--text-muted)' }}>
                    {hotspotInfo.helpUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleCopy(hotspotInfo.helpUrl, 'URL de Teste', 'help_url')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                  style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  {copiedKey === 'help_url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[var(--accent)]" />}
                  <span>Copiar</span>
                </button>
                <button
                  onClick={() => openUrl(hotspotInfo.helpUrl)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                  style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <ExternalLink className="w-3 h-3 text-[var(--accent)]" />
                  <span>Testar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 2: QR CODE FÁCIL                                           */}
        {/* ============================================================== */}
        {activeTab === 'qrcode' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Seletor de Tipo de QR Code */}
            <div
              className="p-1.5 rounded-xl flex gap-1 overflow-x-auto scrollbar-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <button
                onClick={() => setQrType('pac')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                  qrType === 'pac'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                URL PAC (iOS)
              </button>
              <button
                onClick={() => setQrType('http')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                  qrType === 'http'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Proxy HTTP
              </button>
              <button
                onClick={() => setQrType('socks')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                  qrType === 'socks'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                SOCKS5 (TCP)
              </button>
              <button
                onClick={() => setQrType('socks_udp')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                  qrType === 'socks_udp'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Relay UDP
              </button>
              <button
                onClick={() => setQrType('telegram')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                  qrType === 'telegram'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Telegram Link
              </button>
            </div>

            {/* Container do QR Code */}
            <div
              className="p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-3"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="p-3 bg-white rounded-2xl shadow-xl border border-zinc-200 flex items-center justify-center min-w-[200px] min-h-[200px]">
                {qrCodeLoading ? (
                  <div className="flex flex-col items-center justify-center gap-2 p-8">
                    <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-zinc-500 font-medium">Gerando QR Code...</span>
                  </div>
                ) : qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code de Conexão Hotspot" className="w-52 h-52 object-contain" />
                ) : (
                  <div className="p-8 text-xs text-zinc-500">Falha ao gerar QR Code</div>
                )}
              </div>

              {/* Informação e Cópia do Conteúdo do QR */}
              <div className="w-full max-w-sm space-y-2">
                <div
                  className="p-2 rounded-lg font-mono text-xs break-all truncate"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  {activeQrContent}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleCopy(activeQrContent, 'Dado do QR Code', 'qr_data')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                    style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    {copiedKey === 'qr_data' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>Copiar Conteúdo</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] pt-1" style={{ color: 'var(--text-muted)' }}>
                  Aponte a câmera de outro celular para ler ou copiar o proxy diretamente sem digitar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 3: COMO USAR (TUTORIAIS)                                   */}
        {/* ============================================================== */}
        {activeTab === 'tutorials' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Seletor de Aparelho */}
            <div
              className="flex p-1 rounded-xl gap-1 overflow-x-auto scrollbar-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <button
                onClick={() => setTutorialDevice('android')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  tutorialDevice === 'android'
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                onClick={() => setTutorialDevice('ios')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  tutorialDevice === 'ios'
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iOS / iPhone</span>
              </button>
              <button
                onClick={() => setTutorialDevice('windows')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  tutorialDevice === 'windows'
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Windows PC</span>
              </button>
              <button
                onClick={() => setTutorialDevice('tv')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  tutorialDevice === 'tv'
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Smart TV</span>
              </button>
              <button
                onClick={() => setTutorialDevice('telegram')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  tutorialDevice === 'telegram'
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>
            </div>

            {/* Conteúdo do Tutorial Selecionado */}
            <div
              className="p-4 rounded-xl space-y-3.5 text-xs"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              {tutorialDevice === 'android' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-sky-400 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> Passo a Passo no Android
                  </h4>
                  <ol className="list-decimal list-inside space-y-2.5 text-[var(--text)] leading-relaxed">
                    <li>Conecte o outro aparelho no Ponto de Acesso Wi-Fi do seu celular.</li>
                    <li>Abra as <strong>Configurações de Wi-Fi</strong> do aparelho conectado.</li>
                    <li>Toque na engrenagem da rede ou segure nela e escolha <strong>Modificar rede</strong>.</li>
                    <li>Abra <strong>Opções Avançadas</strong> e em <strong>Proxy</strong> selecione <strong>Manual</strong>.</li>
                    <li className="flex items-center gap-2 flex-wrap">
                      <span>Nome do host / IP:</span>
                      <code className="bg-[var(--surface)] px-2 py-0.5 rounded font-mono font-bold text-emerald-400 border border-[var(--border)]">
                        {hotspotInfo.ip}
                      </code>
                      <button
                        onClick={() => handleCopy(hotspotInfo.ip, 'IP', 'tut_and_ip')}
                        className="text-[var(--accent)] underline font-medium cursor-pointer"
                      >
                        {copiedKey === 'tut_and_ip' ? 'Copiado!' : 'Copiar IP'}
                      </button>
                    </li>
                    <li className="flex items-center gap-2 flex-wrap">
                      <span>Porta do proxy:</span>
                      <code className="bg-[var(--surface)] px-2 py-0.5 rounded font-mono font-bold text-emerald-400 border border-[var(--border)]">
                        {hotspotInfo.httpPort}
                      </code>
                      <button
                        onClick={() => handleCopy(String(hotspotInfo.httpPort), 'Porta', 'tut_and_port')}
                        className="text-[var(--accent)] underline font-medium cursor-pointer"
                      >
                        {copiedKey === 'tut_and_port' ? 'Copiado!' : 'Copiar Porta'}
                      </button>
                    </li>
                    <li>Toque em <strong>Salvar</strong> e comece a navegar!</li>
                  </ol>
                </div>
              )}

              {tutorialDevice === 'ios' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> Passo a Passo no iPhone / iPad (iOS)
                  </h4>
                  <ol className="list-decimal list-inside space-y-2.5 text-[var(--text)] leading-relaxed">
                    <li>Conecte o iPhone no Wi-Fi do seu Hotspot.</li>
                    <li>Toque no ícone azul <strong>(i)</strong> ao lado do nome da rede Wi-Fi.</li>
                    <li>Role até o fim da página e toque em <strong>Configurar Proxy</strong>.</li>
                    <li>
                      <strong>Método Recomendado:</strong> Escolha <strong>Automático</strong> e cole a URL do PAC:
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <code className="bg-[var(--surface)] px-2 py-1 rounded font-mono text-[11px] text-amber-300 border border-[var(--border)] max-w-full truncate">
                          {hotspotInfo.pacUrl}
                        </code>
                        <button
                          onClick={() => handleCopy(hotspotInfo.pacUrl, 'URL PAC', 'tut_ios_pac')}
                          className="px-2 py-0.5 rounded bg-[var(--accent)] text-white text-[10px] font-bold cursor-pointer"
                        >
                          {copiedKey === 'tut_ios_pac' ? 'Copiado!' : 'Copiar Link'}
                        </button>
                      </div>
                    </li>
                    <li>
                      <em>Ou Método Manual:</em> Escolha <strong>Manual</strong> e informe Servidor: <code>{hotspotInfo.ip}</code> e Porta: <code>{hotspotInfo.httpPort}</code>.
                    </li>
                    <li>Toque em <strong>Salvar</strong> no canto superior direito.</li>
                  </ol>
                </div>
              )}

              {tutorialDevice === 'windows' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-purple-400 flex items-center gap-2">
                    <Monitor className="w-4 h-4" /> Passo a Passo no Windows (PC / Laptop)
                  </h4>
                  <ol className="list-decimal list-inside space-y-2.5 text-[var(--text)] leading-relaxed">
                    <li>Conecte o computador na rede Wi-Fi deste celular.</li>
                    <li>Pressione as teclas <strong>Win + I</strong> para abrir as <strong>Configurações</strong>.</li>
                    <li>Acesse <strong>Rede e Internet</strong> &rarr; <strong>Proxy</strong>.</li>
                    <li>Em <strong>Configuração manual de proxy</strong>, clique em <strong>Configurar</strong> e ative <strong>"Usar um servidor proxy"</strong>.</li>
                    <li className="flex items-center gap-2 flex-wrap">
                      <span>Endereço IP:</span>
                      <code className="bg-[var(--surface)] px-2 py-0.5 rounded font-mono font-bold text-purple-300 border border-[var(--border)]">
                        {hotspotInfo.ip}
                      </code>
                      <span>| Porta:</span>
                      <code className="bg-[var(--surface)] px-2 py-0.5 rounded font-mono font-bold text-purple-300 border border-[var(--border)]">
                        {hotspotInfo.httpPort}
                      </code>
                    </li>
                    <li>Clique em <strong>Salvar</strong>. Todo o tráfego do computador passará pela VPN!</li>
                  </ol>
                </div>
              )}

              {tutorialDevice === 'tv' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                    <Tv className="w-4 h-4" /> Passo a Passo em Smart TV e TV Box
                  </h4>
                  <ol className="list-decimal list-inside space-y-2.5 text-[var(--text)] leading-relaxed">
                    <li>Conecte a TV ou TV Box no sinal Wi-Fi do seu celular.</li>
                    <li>Acesse <strong>Configurações</strong> &rarr; <strong>Rede</strong> &rarr; <strong>Wi-Fi</strong>.</li>
                    <li>Selecione a sua rede conectada e clique em <strong>Opções Avançadas</strong> ou <strong>Modificar</strong>.</li>
                    <li>
                      Altere a opção <strong>Proxy</strong> para <strong>Manual</strong>.
                    </li>
                    <li className="flex items-center gap-2 flex-wrap">
                      <span>Servidor:</span>
                      <code className="bg-[var(--surface)] px-2 py-0.5 rounded font-mono font-bold text-emerald-400 border border-[var(--border)]">
                        {hotspotInfo.ip}
                      </code>
                      <span>Porta:</span>
                      <code className="bg-[var(--surface)] px-2 py-0.5 rounded font-mono font-bold text-emerald-400 border border-[var(--border)]">
                        {hotspotInfo.httpPort}
                      </code>
                    </li>
                    <li>Salve as configurações. Se sua TV não possuir suporte a proxy, utilize o aplicativo auxiliar <em>VPN Hotspot</em>.</li>
                  </ol>
                </div>
              )}

              {tutorialDevice === 'telegram' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-sky-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Configuração Rápida no Telegram
                  </h4>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    O Telegram possui suporte nativo a proxy SOCKS5, ideal para chamadas e mensagens ultrarrápidas através do Hotspot.
                  </p>
                  <ol className="list-decimal list-inside space-y-2.5 text-[var(--text)] leading-relaxed">
                    <li>No Telegram do outro aparelho, acesse <strong>Configurações &rarr; Dados e Armazenamento &rarr; Configurações de Proxy</strong>.</li>
                    <li>Ative <strong>"Usar Proxy"</strong> e selecione <strong>SOCKS5</strong>.</li>
                    <li className="flex items-center gap-2 flex-wrap">
                      <span>Servidor:</span>
                      <code className="bg-[var(--surface)] px-2 py-0.5 rounded font-mono font-bold text-sky-400 border border-[var(--border)]">
                        {hotspotInfo.ip}
                      </code>
                      <span>Porta:</span>
                      <code className="bg-[var(--surface)] px-2 py-0.5 rounded font-mono font-bold text-sky-400 border border-[var(--border)]">
                        {hotspotInfo.socksPort}
                      </code>
                    </li>
                    <li>
                      Ou simplesmente compartilhe o link direto com um toque:
                      <div className="mt-1">
                        <button
                          onClick={() => handleCopy(telegramProxyLink, 'Link Direto Telegram', 'tut_tg_link')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30 cursor-pointer"
                        >
                          {copiedKey === 'tut_tg_link' ? 'Link Copiado!' : 'Copiar Link Direto Telegram'}
                        </button>
                      </div>
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 4: CONFIGURAÇÕES AVANÇADAS & REDE                          */}
        {/* ============================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Ajuste de Porta */}
            <div
              className="p-4 rounded-xl space-y-3"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    Porta do Serviço Hotspot
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    A porta SOCKS5 é atribuída automaticamente como Porta HTTP + 1
                  </p>
                </div>
                <button
                  onClick={handleResetPort}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  Restaurar 8578
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="text-[11px] block font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Porta HTTP Inicial
                  </label>
                  <input
                    type="number"
                    min={1024}
                    max={65534}
                    value={customPort}
                    onChange={(e) => handlePortChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm font-mono font-bold transition-colors focus:outline-none"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                  />
                </div>

                <div>
                  <label className="text-[11px] block font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    SOCKS5 TCP (Porta + 1)
                  </label>
                  <div
                    className="w-full px-3 py-2 rounded-lg text-sm font-mono font-bold opacity-80"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {customPort === 8578 ? 8579 : customPort + 1}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] block font-medium mb-1 text-emerald-400">
                    SOCKS5 UDP Relay (Porta + 2)
                  </label>
                  <div
                    className="w-full px-3 py-2 rounded-lg text-sm font-mono font-bold text-emerald-300"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {customPort === 8578 ? 8580 : customPort + 2}
                  </div>
                </div>
              </div>

              {/* Botão de Aplicar Nova Porta se estiver Rodando */}
              {isEnabled && customPort !== hotspotInfo.httpPort && (
                <div className="pt-1">
                  <button
                    onClick={() => start(customPort)}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer bg-[var(--accent)] text-white shadow-md hover:brightness-110"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reiniciar Hotspot na Porta {customPort}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Diagnóstico de IPs Locais da Interface de Rede */}
            <div
              className="p-4 rounded-xl space-y-3"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    Interfaces de Rede do Host
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    IPs locais detectados nativamente no seu aparelho
                  </p>
                </div>
                <button
                  onClick={() => {
                    checkStatus();
                    setLocalIps(getLocalIpsData());
                    try {
                      vibrate(20);
                    } catch {
                      /* ignore */
                    }
                    showNativeToast('Informações de rede atualizadas');
                  }}
                  className="p-1.5 rounded-lg text-[var(--accent)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                  title="Atualizar status"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <div
                  className="p-2.5 rounded-lg flex items-center justify-between text-xs"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <span className="font-medium" style={{ color: 'var(--text-muted)' }}>
                    IPv4 Local:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold" style={{ color: 'var(--text)' }}>
                      {localIps.ipv4 || hotspotInfo.ip || 'Não detectado'}
                    </span>
                    {localIps.ipv4 && (
                      <button
                        onClick={() => handleCopy(localIps.ipv4!, 'IPv4 Local', 'diag_ipv4')}
                        className="text-[var(--accent)] cursor-pointer"
                      >
                        {copiedKey === 'diag_ipv4' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="p-2.5 rounded-lg flex items-center justify-between text-xs"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <span className="font-medium" style={{ color: 'var(--text-muted)' }}>
                    IPv6 Local:
                  </span>
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <span className="font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                      {localIps.ipv6 || 'Não disponível'}
                    </span>
                    {localIps.ipv6 && (
                      <button
                        onClick={() => handleCopy(localIps.ipv6!, 'IPv6 Local', 'diag_ipv6')}
                        className="text-[var(--accent)] cursor-pointer flex-shrink-0"
                      >
                        {copiedKey === 'diag_ipv6' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 text-[11px] text-[var(--text-muted)] leading-relaxed">
                <Info className="w-4 h-4 mt-0.5 text-[var(--accent)] flex-shrink-0" />
                <span>
                  O ponto de acesso Wi-Fi nativo do Android utiliza geralmente o range <strong>192.168.43.1</strong>. Caso utilize Tethering USB ou Wi-Fi Direct, o IP pode variar (ex: 192.168.49.1).
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
});

export { Hotspot };
export default Hotspot;