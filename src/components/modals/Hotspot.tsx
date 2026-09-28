import { useState, useEffect, useCallback, memo, type ReactNode } from 'react';
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
  Smartphone,
  Monitor,
  Tv,
  Info,
  RefreshCw,
  MessageCircle,
  Send,
  Power,
  Share2,
  Zap,
  Download,
  Sparkles,
  Star,
  Activity,
  ArrowRight,
  type LucideIcon,
} from '../../utils/icons';
import { Modal } from './Modal';
import { useHotspotGlobal } from '../../hooks/useGlobalPolling';
import { getLocalIpsData, WHATSAPP_CHAT_PORT, WHATSAPP_MEDIA_PORT } from '../../utils/hotspotUtils';
import { copyToClipboard, vibrate, showNativeToast, openUrl } from '../../utils/appFunctions';

interface HotspotProps {
  onClose: () => void;
}

type HotspotTab = 'connect' | 'guides' | 'advanced';
type GuideId = 'vtshare' | 'whatsapp' | 'android' | 'windows' | 'ios' | 'tv' | 'telegram';

const VT_SHARE_RELEASES_URL = 'https://github.com/TelksBr/vtunnel-share-releases/releases/latest';
const VT_SHARE_APK_UNIVERSAL_URL = 'https://github.com/TelksBr/vtunnel-share-releases/releases/download/v0.1.0-pre/VTunnelShare-v0.1.0-universal.apk';
const VT_SHARE_APK_ARM64_URL = 'https://github.com/TelksBr/vtunnel-share-releases/releases/download/v0.1.0-pre/VTunnelShare-v0.1.0-arm64-v8a.apk';
const VT_SHARE_EXE_X64_URL = 'https://github.com/TelksBr/vtunnel-share-releases/releases/download/v0.1.0-pre/VTunnelShare-v0.1.0-windows-amd64.exe';
const VT_SHARE_EXE_ARM64_URL = 'https://github.com/TelksBr/vtunnel-share-releases/releases/download/v0.1.0-pre/VTunnelShare-v0.1.0-windows-arm64.exe';
type Tone = 'green' | 'sky' | 'violet' | 'amber' | 'emerald';

const DEFAULT_PORT = 8578;
const PORT_STORAGE_KEY = 'vtunnel_hotspot_port';
const RESERVED_PORTS = [WHATSAPP_CHAT_PORT, WHATSAPP_MEDIA_PORT];

const TONES: Record<Tone, { icon: string; badge: string; text: string; button: string }> = {
  green: {
    icon: 'bg-green-500/15 text-[var(--tone-green)]',
    badge: 'bg-green-500/15 text-[var(--tone-green)] border-green-500/30',
    text: 'text-[var(--tone-green)]',
    button: 'bg-green-500/10 hover:bg-green-500/20 text-[var(--tone-green)] border border-green-500/30',
  },
  sky: {
    icon: 'bg-sky-500/15 text-[var(--tone-sky)]',
    badge: 'bg-sky-500/15 text-[var(--tone-sky)] border-sky-500/30',
    text: 'text-[var(--tone-sky)]',
    button: 'bg-sky-500/10 hover:bg-sky-500/20 text-[var(--tone-sky)] border border-sky-500/30',
  },
  violet: {
    icon: 'bg-violet-500/15 text-[var(--tone-violet)]',
    badge: 'bg-violet-500/15 text-[var(--tone-violet)] border-violet-500/30',
    text: 'text-[var(--tone-violet)]',
    button: 'bg-violet-500/10 hover:bg-violet-500/20 text-[var(--tone-violet)] border border-violet-500/30',
  },
  amber: {
    icon: 'bg-amber-500/15 text-[var(--tone-amber)]',
    badge: 'bg-amber-500/15 text-[var(--tone-amber)] border-amber-500/30',
    text: 'text-[var(--tone-amber)]',
    button: 'bg-amber-500/10 hover:bg-amber-500/20 text-[var(--tone-amber)] border border-amber-500/30',
  },
  emerald: {
    icon: 'bg-emerald-500/15 text-[var(--tone-emerald)]',
    badge: 'bg-emerald-500/15 text-[var(--tone-emerald)] border-emerald-500/30',
    text: 'text-[var(--tone-emerald)]',
    button: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-[var(--tone-emerald)] border border-emerald-500/30',
  },
};

const cardStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)' };
const fieldStyle = { background: 'var(--surface)', border: '1px solid var(--border)' };

function derivedPorts(httpPort: number) {
  return {
    socks: httpPort === DEFAULT_PORT ? 8579 : httpPort + 1,
    udp: httpPort === DEFAULT_PORT ? 8580 : httpPort + 2,
  };
}

function validatePort(raw: string): string | null {
  const port = Number(raw);
  if (!raw.trim() || !Number.isInteger(port)) return 'Informe um número.';
  if (port < 1024 || port > 65533) return 'Use uma porta entre 1024 e 65533.';
  const { socks } = derivedPorts(port);
  if (RESERVED_PORTS.includes(port) || RESERVED_PORTS.includes(socks)) {
    return `As portas ${WHATSAPP_CHAT_PORT} e ${WHATSAPP_MEDIA_PORT} são do proxy do WhatsApp.`;
  }
  return null;
}

function readSavedPort(): string {
  try {
    const saved = localStorage.getItem(PORT_STORAGE_KEY);
    if (saved && validatePort(saved) === null) return saved;
  } catch {
    /* ignore */
  }
  return String(DEFAULT_PORT);
}

function haptic(ms: number) {
  try {
    vibrate(ms);
  } catch {
    /* ignore */
  }
}

interface CopyApi {
  copiedKey: string | null;
  copy: (text: string, label: string, key: string) => void;
}

function CopyField({
  label,
  value,
  copyKey,
  api,
  valueClassName = '',
  className = '',
  small = false,
}: {
  label: string;
  value: string;
  copyKey: string;
  api: CopyApi;
  valueClassName?: string;
  className?: string;
  small?: boolean;
}) {
  const copied = api.copiedKey === copyKey;
  return (
    <button
      type="button"
      onClick={() => api.copy(value, label, copyKey)}
      className={`w-full min-h-[52px] p-2.5 rounded-lg flex items-center justify-between gap-2 text-left cursor-pointer touch-manipulation transition-all duration-150 active:scale-[0.98] hover:brightness-110 ${className}`}
      style={{ ...fieldStyle, borderColor: copied ? 'rgba(16, 185, 129, 0.5)' : 'var(--border)' }}
      aria-label={`Copiar ${label}`}
    >
      <span className="min-w-0 flex-1">
        <span
          className="text-[10px] block font-medium uppercase tracking-wider truncate"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        <span
          className={`font-mono font-bold block truncate ${small ? 'text-xs' : 'text-sm'} ${valueClassName}`}
          style={valueClassName ? undefined : { color: 'var(--text)' }}
        >
          {value}
        </span>
      </span>
      {copied ? (
        <Check className="w-4 h-4 flex-shrink-0 text-[var(--ok)]" />
      ) : (
        <Copy className="w-4 h-4 flex-shrink-0 text-[var(--accent)]" />
      )}
    </button>
  );
}

function CopyChip({ value, label, copyKey, api }: { value: string; label: string; copyKey: string; api: CopyApi }) {
  const copied = api.copiedKey === copyKey;
  return (
    <button
      type="button"
      onClick={() => api.copy(value, label, copyKey)}
      className="inline-flex items-center gap-1 max-w-full px-2 py-0.5 rounded-md font-mono font-bold text-[11px] align-middle cursor-pointer touch-manipulation active:scale-95 transition-transform"
      style={{ ...fieldStyle, color: copied ? 'var(--ok)' : 'var(--text)' }}
      aria-label={`Copiar ${label}`}
    >
      <span className="truncate">{value}</span>
      {copied ? <Check className="w-3 h-3 flex-shrink-0" /> : <Copy className="w-3 h-3 flex-shrink-0 text-[var(--accent)]" />}
    </button>
  );
}

function MethodCard({
  icon: Icon,
  tone,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const t = TONES[tone];
  return (
    <section className="p-3.5 sm:p-4 rounded-xl space-y-3" style={cardStyle}>
      <header className="flex items-start gap-2.5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${t.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              {title}
            </h3>
            {badge && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase border ${t.badge}`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        </div>
      </header>
      {children}
    </section>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-px text-white"
            style={{ background: 'var(--accent)' }}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">{item}</div>
        </li>
      ))}
    </ol>
  );
}

function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn'; children: ReactNode }) {
  const warn = tone === 'warn';
  return (
    <div
      className="p-2.5 rounded-lg flex items-start gap-2 text-[11px] leading-relaxed"
      style={{
        background: warn ? 'rgba(245, 158, 11, 0.1)' : 'var(--surface)',
        border: `1px solid ${warn ? 'rgba(245, 158, 11, 0.3)' : 'var(--border)'}`,
        color: warn ? 'var(--tone-amber)' : 'var(--text-muted)',
      }}
    >
      {warn ? (
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      ) : (
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--accent)]" />
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const TABS: { id: HotspotTab; label: string; icon: LucideIcon }[] = [
  { id: 'connect', label: 'Conexões', icon: Globe },
  { id: 'guides', label: 'Como usar', icon: Smartphone },
  { id: 'advanced', label: 'Avançado', icon: Settings },
];

const GUIDES: { id: GuideId; label: string; icon: LucideIcon }[] = [
  { id: 'vtshare', label: 'VT Share ⭐', icon: Share2 },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'android', label: 'Android (Proxy)', icon: Smartphone },
  { id: 'windows', label: 'Windows (Proxy)', icon: Monitor },
  { id: 'ios', label: 'iPhone', icon: Smartphone },
  { id: 'tv', label: 'Smart TV', icon: Tv },
  { id: 'telegram', label: 'Telegram', icon: Send },
];

const Hotspot = memo(function Hotspot({ onClose }: HotspotProps) {
  const { isEnabled, hotspotInfo, vpnState, loading, start, stop, checkStatus } = useHotspotGlobal();

  const [activeTab, setActiveTab] = useState<HotspotTab>('connect');
  const [guide, setGuide] = useState<GuideId>('vtshare');
  const [vtPlatform, setVtPlatform] = useState<'android' | 'windows'>('android');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [portInput, setPortInput] = useState<string>(readSavedPort);
  const [localIps, setLocalIps] = useState(getLocalIpsData);

  useEffect(() => {
    setLocalIps(getLocalIpsData());
  }, [isEnabled]);

  const copy = useCallback((text: string, label: string, key: string) => {
    haptic(25);
    copyToClipboard(text);
    setCopiedKey(key);
    showNativeToast(`${label} copiado!`);
    setTimeout(() => setCopiedKey((curr) => (curr === key ? null : curr)), 2000);
  }, []);
  const api: CopyApi = { copiedKey, copy };

  const portError = validatePort(portInput);
  const chosenPort = portError ? DEFAULT_PORT : Number(portInput);
  const chosenDerived = derivedPorts(chosenPort);

  const handlePortInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 5);
    setPortInput(digits);
    if (validatePort(digits) === null) {
      try {
        localStorage.setItem(PORT_STORAGE_KEY, digits);
      } catch {
        /* ignore */
      }
    }
  };

  const handleResetPort = () => {
    handlePortInput(String(DEFAULT_PORT));
    haptic(20);
    showNativeToast(`Porta restaurada para o padrão (${DEFAULT_PORT})`);
  };

  const handleMasterToggle = async () => {
    haptic(35);
    if (isEnabled) {
      await stop();
      return;
    }
    if (portError) {
      showNativeToast('Porta inválida. Ajuste em Avançado.');
      setActiveTab('advanced');
      return;
    }
    await start(chosenPort);
  };

  const handleRestartOnPort = async () => {
    haptic(30);
    await stop();
    await start(chosenPort);
  };

  const isVpnActive = vpnState === 'CONNECTED';
  const ip = hotspotInfo.ip;
  const udpPort = hotspotInfo.socksUdpPort || derivedPorts(hotspotInfo.httpPort).udp;
  const udpProxy = hotspotInfo.socksUdpProxy || `${ip}:${udpPort}`;
  const telegramLink = `tg://socks?server=${encodeURIComponent(ip)}&port=${hotspotInfo.socksPort}`;

  // Hotspot ligado: campo ausente = app sem proxy do WhatsApp; 0 = porta não abriu. Desligado, o app manda 0.
  const rawWaChat = hotspotInfo.whatsappChatPort;
  const rawWaMedia = hotspotInfo.whatsappMediaPort;
  const waSupported = !isEnabled || typeof rawWaChat === 'number';
  const waAvailable = !isEnabled || (!!rawWaChat && !!rawWaMedia);
  const waChatPort = rawWaChat || WHATSAPP_CHAT_PORT;
  const waMediaPort = rawWaMedia || WHATSAPP_MEDIA_PORT;

  const openGuide = (id: GuideId) => {
    setGuide(id);
    setActiveTab('guides');
  };

  return (
    <Modal onClose={onClose} title="Hotspot & Compartilhamento" icon={Wifi}>
      <div className="flex-1 p-3 sm:p-4 space-y-3.5 max-w-2xl mx-auto w-full">
        {/* Status + liga/desliga */}
        <section
          className="p-3.5 sm:p-5 rounded-2xl relative overflow-hidden transition-all duration-300"
          style={{
            background: isEnabled
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)'
              : 'var(--bg-elevated)',
            border: `1px solid ${isEnabled ? 'rgba(16, 185, 129, 0.35)' : 'var(--border)'}`,
          }}
        >
          {isEnabled && (
            <div
              className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-30"
              style={{ background: 'var(--ok, #10b981)' }}
            />
          )}

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
                style={{
                  background: isEnabled ? 'rgba(16, 185, 129, 0.18)' : 'var(--surface)',
                  border: `1.5px solid ${isEnabled ? 'rgba(16, 185, 129, 0.45)' : 'var(--border)'}`,
                }}
              >
                {isEnabled ? (
                  <>
                    <Wifi className="w-6 h-6 text-[var(--ok)]" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                  </>
                ) : (
                  <WifiOff className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="font-bold text-base sm:text-lg leading-tight" style={{ color: 'var(--text)' }}>
                  {loading
                    ? isEnabled
                      ? 'Parando hotspot...'
                      : 'Iniciando hotspot...'
                    : isEnabled
                    ? 'Hotspot ativo'
                    : 'Hotspot desligado'}
                </h2>
                {isEnabled ? (
                  <div className="flex items-center gap-1.5 mt-1 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
                    <span>IP do hotspot:</span>
                    <CopyChip value={ip} label="IP do hotspot" copyKey="hdr_ip" api={api} />
                  </div>
                ) : (
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                    Compartilhe a VPN com outros aparelhos no Wi-Fi deste celular.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleMasterToggle}
              disabled={loading}
              className={`w-full sm:w-auto px-5 min-h-[46px] rounded-xl sm:rounded-full font-bold text-sm transition-all duration-200 touch-manipulation active:scale-95 flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                isEnabled
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-[var(--danger)] border border-rose-500/40'
                  : 'text-white hover:brightness-110 shadow-lg'
              }`}
              style={{ background: isEnabled ? undefined : 'var(--accent)' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>{isEnabled ? 'Parando...' : 'Iniciando...'}</span>
                </>
              ) : (
                <>
                  <Power className="w-4 h-4" />
                  <span>{isEnabled ? 'Desativar' : 'Ativar hotspot'}</span>
                </>
              )}
            </button>
          </div>

          {!isVpnActive && (
            <div className="relative z-10 mt-3">
              <Notice tone="warn">
                <strong className="block">A VPN está desconectada</strong>
                Conecte a VPN antes de ativar o hotspot para os outros aparelhos navegarem por ela.
              </Notice>
            </div>
          )}
        </section>

        {/* Abas */}
        <nav className="grid grid-cols-3 p-1 rounded-xl gap-1" style={cardStyle} aria-label="Seções do hotspot">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`min-h-[40px] px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer touch-manipulation ${
                activeTab === id
                  ? 'bg-[var(--accent)] text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
              }`}
              aria-pressed={activeTab === id}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>

        {/* ABA: CONEXÕES */}
        {activeTab === 'connect' && (
          <div className="space-y-3.5 animate-fadeIn">
            {!isEnabled && (
              <Notice>
                Ligue o <strong>hotspot Wi-Fi do Android</strong> e toque em <strong>Ativar hotspot</strong>. Em seguida, conecte os outros aparelhos no Wi-Fi deste celular.
              </Notice>
            )}

            {/* ⭐ MÉTODO RECOMENDADO: VTUNNEL SHARE */}
            <section
              className="p-4 sm:p-5 rounded-2xl relative overflow-hidden transition-all duration-300 border shadow-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.18) 0%, rgba(16, 185, 129, 0.10) 50%, rgba(99, 102, 241, 0.15) 100%)',
                borderColor: 'rgba(124, 58, 237, 0.45)',
              }}
            >
              <div
                className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-30"
                style={{ background: 'var(--accent, #7c3aed)' }}
              />

              <div className="relative z-10 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                      }}
                    >
                      <Share2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-[var(--text)] flex items-center gap-1.5">
                          VTunnel Share Client
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                          Melhor Solução
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 leading-relaxed text-[var(--text-muted)]">
                        Roteamento <strong>100% transparente</strong> de todo o sistema operacional (TCP + UDP) sem root e sem configurar proxy manual.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vantagens em destaque */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl border flex items-center gap-2" style={fieldStyle}>
                    <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <strong className="block font-semibold text-[var(--text)]">Todos os Apps</strong>
                      <span className="text-[10px] text-[var(--text-muted)]">YouTube, Jogos, etc.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border flex items-center gap-2" style={fieldStyle}>
                    <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <strong className="block font-semibold text-[var(--text)]">UDP & Speedtest</strong>
                      <span className="text-[10px] text-[var(--text-muted)]">Sem perda de pacotes</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border flex items-center gap-2" style={fieldStyle}>
                    <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <div>
                      <strong className="block font-semibold text-[var(--text)]">Túnel VPN TUN</strong>
                      <span className="text-[10px] text-[var(--text-muted)]">Sem root no aparelho</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border flex items-center gap-2" style={fieldStyle}>
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div>
                      <strong className="block font-semibold text-[var(--text)]">Auto Detecção</strong>
                      <span className="text-[10px] text-[var(--text-muted)]">Conecta em 1 toque</span>
                    </div>
                  </div>
                </div>

                {/* Dados da conexão rápida para o VT Share */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <CopyField label="Gateway (IP Hotspot)" value={ip} copyKey="vt_ip" api={api} />
                  <CopyField
                    label="Porta SOCKS5 (VT Share)"
                    value={String(hotspotInfo.socksPort)}
                    copyKey="vt_port"
                    api={api}
                    valueClassName={TONES.violet.text}
                  />
                </div>

                {/* Botões de Ação */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openUrl(VT_SHARE_RELEASES_URL)}
                    className="w-full min-h-[42px] px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer touch-manipulation text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar VT Share</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openGuide('vtshare')}
                    className={`w-full min-h-[42px] px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation transition-colors ${TONES.violet.button}`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Como usar (Guia)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => copy(VT_SHARE_RELEASES_URL, 'Link do VTunnel Share', 'vt_share_link')}
                    className="w-full min-h-[42px] px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation hover:bg-[var(--surface-hover)] transition-colors"
                    style={fieldStyle}
                  >
                    {copiedKey === 'vt_share_link' ? (
                      <Check className="w-4 h-4 text-[var(--ok)]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[var(--accent)]" />
                    )}
                    <span>{copiedKey === 'vt_share_link' ? 'Link copiado!' : 'Copiar link de download'}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Separador elegante para métodos manuais */}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Ou configure manualmente (Métodos Legados)
              </span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            {waSupported && (
              <MethodCard
                icon={MessageCircle}
                tone="green"
                title="WhatsApp"
                subtitle="Proxy próprio do WhatsApp — ele não aceita HTTP nem SOCKS5"
                badge="Mensagens e mídia"
              >
                {waAvailable ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <CopyField label="Endereço do proxy" value={ip} copyKey="wa_ip" api={api} className="col-span-2" />
                      <CopyField
                        label="Porta do chat"
                        value={String(waChatPort)}
                        copyKey="wa_chat"
                        api={api}
                        valueClassName={TONES.green.text}
                      />
                      <CopyField
                        label="Porta de mídia"
                        value={String(waMediaPort)}
                        copyKey="wa_media"
                        api={api}
                        valueClassName={TONES.green.text}
                      />
                    </div>
                    <Notice>
                      Preencha as duas portas e deixe <strong>Usar TLS</strong> desligado. Chamadas de voz e vídeo não
                      funcionam por proxy no WhatsApp.
                    </Notice>
                    <button
                      type="button"
                      onClick={() => openGuide('whatsapp')}
                      className={`w-full min-h-[40px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation transition-colors ${TONES.green.button}`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Ver passo a passo no WhatsApp
                    </button>
                  </>
                ) : (
                  <Notice tone="warn">
                    O app não conseguiu abrir as portas {WHATSAPP_CHAT_PORT}/{WHATSAPP_MEDIA_PORT} neste aparelho.
                    Desative e ative o hotspot novamente.
                  </Notice>
                )}
              </MethodCard>
            )}

            <MethodCard
              icon={Globe}
              tone="sky"
              title="Proxy HTTP"
              subtitle="Celulares, PCs, Smart TVs e consoles (configuração manual do Wi-Fi)"
              badge="Universal"
            >
              <div className="grid grid-cols-2 gap-2">
                <CopyField label="Endereço IP" value={ip} copyKey="http_ip" api={api} />
                <CopyField label="Porta" value={String(hotspotInfo.httpPort)} copyKey="http_port" api={api} />
                <CopyField
                  label="IP:Porta"
                  value={hotspotInfo.httpProxy}
                  copyKey="http_full"
                  api={api}
                  className="col-span-2"
                  small
                />
              </div>
            </MethodCard>

            <MethodCard
              icon={ShieldCheck}
              tone="violet"
              title="Proxy SOCKS5"
              subtitle="Telegram, navegadores e apps com SOCKS; UDP para DNS e jogos"
              badge={hotspotInfo.udpSupported ? 'UDP ativo' : 'TCP'}
            >
              <div className="grid grid-cols-2 gap-2">
                <CopyField label="Endereço IP" value={ip} copyKey="socks_ip" api={api} className="col-span-2" />
                <CopyField label="Porta TCP" value={String(hotspotInfo.socksPort)} copyKey="socks_port" api={api} />
                <CopyField
                  label="Relay UDP"
                  value={String(udpPort)}
                  copyKey="socks_udp_port"
                  api={api}
                  valueClassName={TONES.emerald.text}
                />
                <CopyField
                  label="SOCKS5 IP:Porta"
                  value={hotspotInfo.socksProxy}
                  copyKey="socks_full"
                  api={api}
                  className="col-span-2"
                  small
                />
                <CopyField
                  label="Relay UDP IP:Porta"
                  value={udpProxy}
                  copyKey="socks_udp_full"
                  api={api}
                  className="col-span-2"
                  valueClassName={TONES.emerald.text}
                  small
                />
              </div>
              <button
                type="button"
                onClick={() => copy(telegramLink, 'Link do Telegram', 'socks_tg')}
                className={`w-full min-h-[40px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation transition-colors ${TONES.sky.button}`}
              >
                {copiedKey === 'socks_tg' ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                {copiedKey === 'socks_tg' ? 'Link copiado!' : 'Copiar link de proxy do Telegram'}
              </button>
            </MethodCard>

            <MethodCard
              icon={Radio}
              tone="amber"
              title="Configuração automática (PAC)"
              subtitle="iPhone, iPad, Mac e Windows: cole a URL em Proxy → Automático"
              badge="Auto"
            >
              <CopyField
                label="URL do script PAC"
                value={hotspotInfo.pacUrl}
                copyKey="pac_url"
                api={api}
                valueClassName={TONES.amber.text}
                small
              />
            </MethodCard>

            <section className="p-3 rounded-xl flex items-center gap-3" style={cardStyle}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${TONES.emerald.icon}`}>
                <ExternalLink className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-xs" style={{ color: 'var(--text)' }}>
                  Página de teste e ajuda
                </h4>
                <p className="text-[11px] truncate font-mono" style={{ color: 'var(--text-muted)' }}>
                  {hotspotInfo.helpUrl}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => copy(hotspotInfo.helpUrl, 'URL de teste', 'help_url')}
                  className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer touch-manipulation hover:bg-[var(--surface-hover)]"
                  style={fieldStyle}
                  aria-label="Copiar URL de teste"
                >
                  {copiedKey === 'help_url' ? (
                    <Check className="w-4 h-4 text-[var(--ok)]" />
                  ) : (
                    <Copy className="w-4 h-4 text-[var(--accent)]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => openUrl(hotspotInfo.helpUrl)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer touch-manipulation hover:bg-[var(--surface-hover)]"
                  style={fieldStyle}
                  aria-label="Abrir página de teste"
                >
                  <ExternalLink className="w-4 h-4 text-[var(--accent)]" />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ABA: COMO USAR */}
        {activeTab === 'guides' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="grid grid-cols-3 gap-1.5">
              {GUIDES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setGuide(id)}
                  className={`min-h-[40px] px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation transition-all duration-150 ${
                    guide === id ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                  style={guide === id ? undefined : cardStyle}
                  aria-pressed={guide === id}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            <section className="p-3.5 sm:p-4 rounded-xl space-y-3.5" style={cardStyle}>
              {guide === 'vtshare' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-[var(--text)] flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-[var(--accent)]" />
                        VTunnel Share Client (Recomendado)
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                        A solução ideal: cria uma interface virtual TUN que roteia 100% de todo o tráfego do sistema (inclusive Speedtest, jogos e chamadas de vídeo) sem precisar configurar proxy individual em nenhum aplicativo.
                      </p>
                    </div>
                  </div>

                  {/* Seletor de Plataforma no Guia */}
                  <div className="grid grid-cols-2 p-1 rounded-xl gap-1" style={fieldStyle}>
                    <button
                      type="button"
                      onClick={() => setVtPlatform('android')}
                      className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        vtPlatform === 'android'
                          ? 'bg-[var(--accent)] text-white shadow-md'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>No Android (APK)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVtPlatform('windows')}
                      className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        vtPlatform === 'windows'
                          ? 'bg-[var(--accent)] text-white shadow-md'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      <span>No Windows (PC)</span>
                    </button>
                  </div>

                  {vtPlatform === 'android' ? (
                    <div className="space-y-3">
                      <Steps
                        items={[
                          <>
                            Conecte o outro celular na rede Wi-Fi deste aparelho (Hotspot).
                          </>,
                          <>
                            Instale o app <strong>VTunnel Share</strong> no outro aparelho:
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openUrl(VT_SHARE_APK_UNIVERSAL_URL)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-[var(--accent)] text-white hover:brightness-110 cursor-pointer shadow-sm"
                              >
                                <Download className="w-3.5 h-3.5" /> Baixar APK Universal
                              </button>
                              <button
                                type="button"
                                onClick={() => openUrl(VT_SHARE_APK_ARM64_URL)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border hover:bg-[var(--surface-hover)] cursor-pointer"
                                style={fieldStyle}
                              >
                                <Download className="w-3.5 h-3.5 text-[var(--accent)]" /> ARM64 (64-bit)
                              </button>
                              <button
                                type="button"
                                onClick={() => copy(VT_SHARE_APK_UNIVERSAL_URL, 'Link do APK', 'g_apk_link')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border hover:bg-[var(--surface-hover)] cursor-pointer"
                                style={fieldStyle}
                              >
                                {copiedKey === 'g_apk_link' ? (
                                  <Check className="w-3.5 h-3.5 text-[var(--ok)]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>{copiedKey === 'g_apk_link' ? 'Copiado!' : 'Copiar link'}</span>
                              </button>
                            </div>
                          </>,
                          <>
                            Abra o app <strong>VTunnel Share</strong>. Ele detecta automaticamente o IP do Gateway{' '}
                            <CopyChip value={ip} label="IP Gateway" copyKey="g_vt_ip" api={api} /> e a Porta SOCKS5{' '}
                            <CopyChip value={String(hotspotInfo.socksPort)} label="Porta SOCKS5" copyKey="g_vt_port" api={api} />.
                          </>,
                          <>
                            Toque no botão central <strong>Conectar</strong> e confirme a permissão de VPN do Android.
                          </>,
                          <>
                            <strong>Pronto!</strong> Todo o tráfego do sistema (YouTube, Speedtest, WhatsApp e jogos) passará de forma veloz e transparente pelo túnel.
                          </>,
                        ]}
                      />

                      <Notice tone="info">
                        Diferente da configuração manual de proxy Wi-Fi, o <strong>VTunnel Share</strong> cria uma VPN nativa de tunelamento. Nenhum app conseguirá ignorar ou vazar a conexão!
                      </Notice>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Steps
                        items={[
                          <>
                            Conecte seu computador ou notebook no Wi-Fi deste celular.
                          </>,
                          <>
                            Baixe o executável oficial para Windows:
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openUrl(VT_SHARE_EXE_X64_URL)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-[var(--accent)] text-white hover:brightness-110 cursor-pointer shadow-sm"
                              >
                                <Download className="w-3.5 h-3.5" /> Baixar Windows x64
                              </button>
                              <button
                                type="button"
                                onClick={() => openUrl(VT_SHARE_EXE_ARM64_URL)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border hover:bg-[var(--surface-hover)] cursor-pointer"
                                style={fieldStyle}
                              >
                                <Download className="w-3.5 h-3.5 text-[var(--accent)]" /> ARM64 (Surface)
                              </button>
                              <button
                                type="button"
                                onClick={() => copy(VT_SHARE_EXE_X64_URL, 'Link do Windows', 'g_win_link')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border hover:bg-[var(--surface-hover)] cursor-pointer"
                                style={fieldStyle}
                              >
                                {copiedKey === 'g_win_link' ? (
                                  <Check className="w-3.5 h-3.5 text-[var(--ok)]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>{copiedKey === 'g_win_link' ? 'Copiado!' : 'Copiar link'}</span>
                              </button>
                            </div>
                          </>,
                          <>
                            Execute o programa como <strong>Administrador</strong> (necessário para criar a interface virtual TUN Wintun).
                          </>,
                          <>
                            O programa abrirá na bandeja do sistema (Systray). Ele detecta automaticamente o IP{' '}
                            <CopyChip value={ip} label="IP" copyKey="g_win_ip" api={api} /> e porta{' '}
                            <CopyChip value={String(hotspotInfo.socksPort)} label="Porta" copyKey="g_win_port" api={api} />.
                          </>,
                          <>
                            Clique em <strong>Conectar</strong>. Todo o tráfego do Windows será roteado automaticamente!
                          </>,
                        ]}
                      />

                      <Notice tone="info">
                        O driver virtual de alta velocidade <strong>Wintun</strong> já vem integrado internamente no executável, sem requerer nenhuma instalação externa ou configuração adicional no Windows.
                      </Notice>
                    </div>
                  )}
                </div>
              )}

              {guide === 'whatsapp' && (
                <>
                  <h4 className={`font-bold text-sm flex items-center gap-2 ${TONES.green.text}`}>
                    <MessageCircle className="w-4 h-4" /> WhatsApp pelo hotspot
                  </h4>
                  {waSupported ? (
                    <Steps
                      items={[
                        'Conecte o outro celular no Wi-Fi deste aparelho.',
                        <>
                          No WhatsApp, abra <strong>Configurações → Armazenamento e dados → Proxy</strong>.
                        </>,
                        <>
                          Ative <strong>Usar proxy</strong> e toque em <strong>Configurar proxy</strong>.
                        </>,
                        <>
                          Endereço do proxy: <CopyChip value={ip} label="Endereço" copyKey="g_wa_ip" api={api} />
                        </>,
                        <>
                          Porta do chat:{' '}
                          <CopyChip value={String(waChatPort)} label="Porta do chat" copyKey="g_wa_chat" api={api} /> · Porta
                          de mídia:{' '}
                          <CopyChip value={String(waMediaPort)} label="Porta de mídia" copyKey="g_wa_media" api={api} />
                        </>,
                        <>
                          Deixe <strong>Usar TLS</strong> desligado e salve. O WhatsApp mostra <em>Conectado</em> quando
                          funcionar.
                        </>,
                      ]}
                    />
                  ) : (
                    <Notice tone="warn">Atualize o app para usar o proxy do WhatsApp pelo hotspot.</Notice>
                  )}
                  <Notice>
                    Se preencher só o endereço, o WhatsApp tenta a porta 443 com TLS e não conecta. Chamadas não
                    funcionam por proxy.
                  </Notice>
                </>
              )}

              {guide === 'android' && (
                <>
                  <h4 className={`font-bold text-sm flex items-center gap-2 ${TONES.sky.text}`}>
                    <Smartphone className="w-4 h-4" /> Android
                  </h4>
                  <Steps
                    items={[
                      'Conecte o outro aparelho no Wi-Fi deste celular.',
                      <>
                        Em <strong>Configurações de Wi-Fi</strong>, toque na engrenagem da rede (ou segure e escolha{' '}
                        <strong>Modificar rede</strong>).
                      </>,
                      <>
                        Em <strong>Opções avançadas → Proxy</strong>, escolha <strong>Manual</strong>.
                      </>,
                      <>
                        Nome do host: <CopyChip value={ip} label="IP" copyKey="g_and_ip" api={api} /> · Porta:{' '}
                        <CopyChip value={String(hotspotInfo.httpPort)} label="Porta" copyKey="g_and_port" api={api} />
                      </>,
                      <>
                        Toque em <strong>Salvar</strong>.
                      </>,
                    ]}
                  />
                  <Notice>
                    Alguns apps ignoram o proxy do Wi-Fi. Para o WhatsApp, use o{' '}
                    <button
                      type="button"
                      onClick={() => setGuide('whatsapp')}
                      className="underline font-semibold text-[var(--accent)] cursor-pointer"
                    >
                      guia do WhatsApp
                    </button>
                    .
                  </Notice>
                </>
              )}

              {guide === 'ios' && (
                <>
                  <h4 className={`font-bold text-sm flex items-center gap-2 ${TONES.amber.text}`}>
                    <Smartphone className="w-4 h-4" /> iPhone / iPad
                  </h4>
                  <Steps
                    items={[
                      'Conecte o iPhone no Wi-Fi deste celular.',
                      <>
                        Toque no <strong>(i)</strong> ao lado da rede e depois em <strong>Configurar Proxy</strong>.
                      </>,
                      <>
                        Recomendado: escolha <strong>Automático</strong> e cole a URL:{' '}
                        <CopyChip value={hotspotInfo.pacUrl} label="URL PAC" copyKey="g_ios_pac" api={api} />
                      </>,
                      <>
                        Ou <strong>Manual</strong>: servidor{' '}
                        <CopyChip value={ip} label="IP" copyKey="g_ios_ip" api={api} /> · porta{' '}
                        <CopyChip value={String(hotspotInfo.httpPort)} label="Porta" copyKey="g_ios_port" api={api} />
                      </>,
                      <>
                        Toque em <strong>Salvar</strong>.
                      </>,
                    ]}
                  />
                </>
              )}

              {guide === 'windows' && (
                <>
                  <h4 className={`font-bold text-sm flex items-center gap-2 ${TONES.violet.text}`}>
                    <Monitor className="w-4 h-4" /> Windows
                  </h4>
                  <Steps
                    items={[
                      'Conecte o computador no Wi-Fi deste celular.',
                      <>
                        Pressione <strong>Win + I</strong> e abra <strong>Rede e Internet → Proxy</strong>.
                      </>,
                      <>
                        Mais simples: em <strong>Usar script de configuração</strong>, cole{' '}
                        <CopyChip value={hotspotInfo.pacUrl} label="URL PAC" copyKey="g_win_pac" api={api} />
                      </>,
                      <>
                        Ou em <strong>Configuração manual</strong>: endereço{' '}
                        <CopyChip value={ip} label="IP" copyKey="g_win_ip" api={api} /> · porta{' '}
                        <CopyChip value={String(hotspotInfo.httpPort)} label="Porta" copyKey="g_win_port" api={api} />
                      </>,
                      <>
                        Clique em <strong>Salvar</strong>.
                      </>,
                    ]}
                  />
                </>
              )}

              {guide === 'tv' && (
                <>
                  <h4 className={`font-bold text-sm flex items-center gap-2 ${TONES.emerald.text}`}>
                    <Tv className="w-4 h-4" /> Smart TV e TV Box
                  </h4>
                  <Steps
                    items={[
                      'Conecte a TV no Wi-Fi deste celular.',
                      <>
                        Abra <strong>Configurações → Rede → Wi-Fi</strong> e entre nas opções avançadas da rede.
                      </>,
                      <>
                        Em <strong>Proxy</strong>, escolha <strong>Manual</strong>.
                      </>,
                      <>
                        Servidor: <CopyChip value={ip} label="IP" copyKey="g_tv_ip" api={api} /> · Porta:{' '}
                        <CopyChip value={String(hotspotInfo.httpPort)} label="Porta" copyKey="g_tv_port" api={api} />
                      </>,
                      'Salve. Se a TV não tiver opção de proxy, ela não consegue usar o hotspot.',
                    ]}
                  />
                </>
              )}

              {guide === 'telegram' && (
                <>
                  <h4 className={`font-bold text-sm flex items-center gap-2 ${TONES.sky.text}`}>
                    <Send className="w-4 h-4" /> Telegram
                  </h4>
                  <Steps
                    items={[
                      <>
                        No Telegram, abra <strong>Configurações → Dados e armazenamento → Proxy</strong>.
                      </>,
                      <>
                        Adicione um proxy <strong>SOCKS5</strong>.
                      </>,
                      <>
                        Servidor: <CopyChip value={ip} label="IP" copyKey="g_tg_ip" api={api} /> · Porta:{' '}
                        <CopyChip value={String(hotspotInfo.socksPort)} label="Porta" copyKey="g_tg_port" api={api} />
                      </>,
                      <>
                        Ou envie o link para o outro aparelho:{' '}
                        <CopyChip value={telegramLink} label="Link do Telegram" copyKey="g_tg_link" api={api} />
                      </>,
                    ]}
                  />
                </>
              )}
            </section>
          </div>
        )}

        {/* ABA: AVANÇADO */}
        {activeTab === 'advanced' && (
          <div className="space-y-3 animate-fadeIn">
            <section className="p-3.5 sm:p-4 rounded-xl space-y-3" style={cardStyle}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    Porta do hotspot
                  </h3>
                  <p className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                    SOCKS5 e relay UDP usam as portas seguintes automaticamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetPort}
                  className="px-2.5 min-h-[32px] rounded-lg text-[11px] font-medium cursor-pointer flex-shrink-0 hover:bg-[var(--surface-hover)]"
                  style={{ ...fieldStyle, color: 'var(--text-muted)' }}
                >
                  Restaurar {DEFAULT_PORT}
                </button>
              </div>

              <div>
                <label
                  htmlFor="hotspot-port"
                  className="text-[11px] block font-medium mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Porta HTTP
                </label>
                <input
                  id="hotspot-port"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={portInput}
                  onChange={(e) => handlePortInput(e.target.value)}
                  className="w-full px-3 min-h-[44px] rounded-lg text-base font-mono font-bold focus:outline-none transition-colors"
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${portError ? 'rgba(244, 63, 94, 0.6)' : 'var(--border)'}`,
                    color: 'var(--text)',
                  }}
                  aria-invalid={!!portError}
                  aria-describedby="hotspot-port-help"
                />
                <p
                  id="hotspot-port-help"
                  className={`text-[11px] mt-1 ${portError ? 'text-[var(--danger)]' : ''}`}
                  style={portError ? undefined : { color: 'var(--text-muted)' }}
                >
                  {portError ?? 'Entre 1024 e 65533.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'SOCKS5', value: portError ? '—' : chosenDerived.socks, cls: '' },
                  { label: 'Relay UDP', value: portError ? '—' : chosenDerived.udp, cls: TONES.emerald.text },
                  { label: 'WhatsApp chat', value: WHATSAPP_CHAT_PORT, cls: TONES.green.text },
                  { label: 'WhatsApp mídia', value: WHATSAPP_MEDIA_PORT, cls: TONES.green.text },
                ].map((item) => (
                  <div key={item.label} className="p-2.5 rounded-lg" style={fieldStyle}>
                    <span className="text-[10px] block font-medium uppercase tracking-wider truncate" style={{ color: 'var(--text-muted)' }}>
                      {item.label}
                    </span>
                    <span
                      className={`font-mono font-bold text-sm ${item.cls}`}
                      style={item.cls ? undefined : { color: 'var(--text)' }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {isEnabled && !portError && chosenPort !== hotspotInfo.httpPort && (
                <button
                  type="button"
                  onClick={handleRestartOnPort}
                  disabled={loading}
                  className="w-full min-h-[42px] px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer touch-manipulation bg-[var(--accent)] text-white shadow-md hover:brightness-110 disabled:opacity-60"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reiniciar hotspot na porta {chosenPort}
                </button>
              )}
            </section>

            <section className="p-3.5 sm:p-4 rounded-xl space-y-3" style={cardStyle}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    Rede deste aparelho
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    IPs locais detectados
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    checkStatus();
                    setLocalIps(getLocalIpsData());
                    haptic(20);
                    showNativeToast('Informações de rede atualizadas');
                  }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--accent)] cursor-pointer touch-manipulation hover:bg-[var(--surface-hover)] flex-shrink-0"
                  style={fieldStyle}
                  aria-label="Atualizar"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {localIps.ipv4 || ip ? (
                  <CopyField label="IPv4" value={localIps.ipv4 || ip} copyKey="diag_ipv4" api={api} />
                ) : null}
                {localIps.ipv6 ? (
                  <CopyField label="IPv6" value={localIps.ipv6} copyKey="diag_ipv6" api={api} small />
                ) : (
                  <div className="p-2.5 rounded-lg text-xs" style={{ ...fieldStyle, color: 'var(--text-muted)' }}>
                    IPv6 não disponível
                  </div>
                )}
              </div>

              <Notice>
                O hotspot Wi-Fi do Android costuma usar <strong>192.168.43.1</strong>. Em ancoragem USB ou Wi-Fi Direct
                o IP pode mudar (ex.: 192.168.49.1).
              </Notice>
            </section>
          </div>
        )}
      </div>
    </Modal>
  );
});

export { Hotspot };
export default Hotspot;
