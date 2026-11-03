import { message as tr, useMessages } from '../../i18n/messages';
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
  if (!raw.trim() || !Number.isInteger(port)) return tr("ma515107e17");
  if (port < 1024 || port > 65533) return tr("m4b3b9d0a9d");
  const { socks } = derivedPorts(port);
  if (RESERVED_PORTS.includes(port) || RESERVED_PORTS.includes(socks)) {
    return tr("m5012393f9d", { p0: WHATSAPP_CHAT_PORT, p1: WHATSAPP_MEDIA_PORT });
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
  useMessages();
  const copied = api.copiedKey === copyKey;
  return (
    <button
      type="button"
      onClick={() => api.copy(value, label, copyKey)}
      className={`w-full min-h-[52px] p-2.5 rounded-lg flex items-center justify-between gap-2 text-start cursor-pointer touch-manipulation transition-all duration-150 active:scale-[0.98] hover:brightness-110 ${className}`}
      style={{ ...fieldStyle, borderColor: copied ? 'rgba(16, 185, 129, 0.5)' : 'var(--border)' }}
      aria-label={tr("m487127b5f3", { p0: label })}
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
  useMessages();
  const copied = api.copiedKey === copyKey;
  return (
    <button
      type="button"
      onClick={() => api.copy(value, label, copyKey)}
      className="inline-flex items-center gap-1 max-w-full px-2 py-0.5 rounded-md font-mono font-bold text-[11px] align-middle cursor-pointer touch-manipulation active:scale-95 transition-transform"
      style={{ ...fieldStyle, color: copied ? 'var(--ok)' : 'var(--text)' }}
      aria-label={tr("m487127b5f3", { p0: label })}
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
  useMessages();
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
  useMessages();
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
  useMessages();
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
  { id: 'connect', get label() { return tr("m21f8570469"); }, icon: Globe },
  { id: 'guides', get label() { return tr("m0adafccb1c"); }, icon: Smartphone },
  { id: 'advanced', get label() { return tr("m27964de71a"); }, icon: Settings },
];

const GUIDES: { id: GuideId; label: string; icon: LucideIcon }[] = [
  { id: 'vtshare', get label() { return tr("mc09cdb9d34"); }, icon: Share2 },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'android', get label() { return tr("m8c904995d8"); }, icon: Smartphone },
  { id: 'windows', get label() { return tr("m6320a0e25c"); }, icon: Monitor },
  { id: 'ios', get label() { return tr("m38fdf51931"); }, icon: Smartphone },
  { id: 'tv', get label() { return tr("ma85c31d9d3"); }, icon: Tv },
  { id: 'telegram', label: 'Telegram', icon: Send },
];

const Hotspot = memo(function Hotspot({ onClose }: HotspotProps) {
  useMessages();
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
    showNativeToast(tr("me96eb75153", { p0: label }));
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
    showNativeToast(tr("m4b529e6103", { p0: DEFAULT_PORT }));
  };

  const handleMasterToggle = async () => {
    haptic(35);
    if (isEnabled) {
      await stop();
      return;
    }
    if (portError) {
      showNativeToast(tr("mfea0f8930f"));
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
    <Modal onClose={onClose} title={tr("me166b402c0")} icon={Wifi}>
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
                      ? tr("m90f4d1260e")
                      : tr("m2406ecbe69")
                    : isEnabled
                    ? tr("mba4343af5f")
                    : tr("m70544fbd32")}
                </h2>
                {isEnabled ? (
                  <div className="flex items-center gap-1.5 mt-1 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
                    <span>{tr("md98be39185")}</span>
                    <CopyChip value={ip} label={tr("m52917bab27")} copyKey="hdr_ip" api={api} />
                  </div>
                ) : (
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                    {tr("m618057e30f")}</p>
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
                  <span>{isEnabled ? tr("m67afbeec3d") : tr("mf9c08559d3")}</span>
                </>
              )}
            </button>
          </div>

          {!isVpnActive && (
            <div className="relative z-10 mt-3">
              <Notice tone="warn">
                <strong className="block">{tr("mb6e074882d")}</strong>
                {tr("m2f81ccff2f")}</Notice>
            </div>
          )}
        </section>

        {/* Abas */}
        <nav className="grid grid-cols-3 p-1 rounded-xl gap-1" style={cardStyle} aria-label={tr("ma23ae0b27b")}>
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
                {tr("mb54dd9de3c") + " "}<strong>{tr("m28d985b39e")}</strong> {" " + tr("md2508ed8ab") + " "}<strong>{tr("mf9c08559d3")}</strong>{tr("ma28d2f5ddc")}</Notice>
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
                          {tr("m3e7477a23a")}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                          {tr("m25abf23df9")}</span>
                      </div>
                      <p className="text-xs mt-0.5 leading-relaxed text-[var(--text-muted)]">
                        {tr("m69bcd5f0d7") + " "}<strong>{tr("m1f835026b6")}</strong> {" " + tr("m75a6ef0acc")}</p>
                    </div>
                  </div>
                </div>

                {/* Vantagens em destaque */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl border flex items-center gap-2" style={fieldStyle}>
                    <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <strong className="block font-semibold text-[var(--text)]">{tr("mfa56025b99")}</strong>
                      <span className="text-[10px] text-[var(--text-muted)]">{tr("m5d91be2cdf")}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border flex items-center gap-2" style={fieldStyle}>
                    <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <strong className="block font-semibold text-[var(--text)]">{tr("m5404fb4239")}</strong>
                      <span className="text-[10px] text-[var(--text-muted)]">{tr("mb95e2b87c1")}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border flex items-center gap-2" style={fieldStyle}>
                    <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <div>
                      <strong className="block font-semibold text-[var(--text)]">{tr("m19408ed13c")}</strong>
                      <span className="text-[10px] text-[var(--text-muted)]">{tr("m5d2d3d3372")}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border flex items-center gap-2" style={fieldStyle}>
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div>
                      <strong className="block font-semibold text-[var(--text)]">{tr("me515c87c0e")}</strong>
                      <span className="text-[10px] text-[var(--text-muted)]">{tr("mcb23881ee1")}</span>
                    </div>
                  </div>
                </div>

                {/* Dados da conexão rápida para o VT Share */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <CopyField label={tr("m38bb3e0a1c")} value={ip} copyKey="vt_ip" api={api} />
                  <CopyField
                    label={tr("mab9816e4f5")}
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
                    <span>{tr("mfe7010adeb")}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openGuide('vtshare')}
                    className={`w-full min-h-[42px] px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation transition-colors ${TONES.violet.button}`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{tr("ma65d5f86c7")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => copy(VT_SHARE_RELEASES_URL, tr("mfb85c49b47"), 'vt_share_link')}
                    className="w-full min-h-[42px] px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation hover:bg-[var(--surface-hover)] transition-colors"
                    style={fieldStyle}
                  >
                    {copiedKey === 'vt_share_link' ? (
                      <Check className="w-4 h-4 text-[var(--ok)]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[var(--accent)]" />
                    )}
                    <span>{copiedKey === 'vt_share_link' ? tr("me0b19ca0b0") : tr("mcaf0af2ab6")}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Separador elegante para métodos manuais */}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {tr("mdb3fa256a9")}</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            {waSupported && (
              <MethodCard
                icon={MessageCircle}
                tone="green"
                title="WhatsApp"
                subtitle={tr("mc55fe8d771")}
                badge={tr("mda2a73a8f7")}
              >
                {waAvailable ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <CopyField label={tr("m594b46f6a7")} value={ip} copyKey="wa_ip" api={api} className="col-span-2" />
                      <CopyField
                        label={tr("mc06e301b9a")}
                        value={String(waChatPort)}
                        copyKey="wa_chat"
                        api={api}
                        valueClassName={TONES.green.text}
                      />
                      <CopyField
                        label={tr("m6b6dec06a4")}
                        value={String(waMediaPort)}
                        copyKey="wa_media"
                        api={api}
                        valueClassName={TONES.green.text}
                      />
                    </div>
                    <Notice>
                      {tr("m9dc644e213") + " "}<strong>{tr("m1fd04add1d")}</strong> {" " + tr("m5e9b5d5ba9")}</Notice>
                    <button
                      type="button"
                      onClick={() => openGuide('whatsapp')}
                      className={`w-full min-h-[40px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation transition-colors ${TONES.green.button}`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      {tr("m586a0b8c9c")}</button>
                  </>
                ) : (
                  <Notice tone="warn">
                    {tr("m81e8798373") + " "}{WHATSAPP_CHAT_PORT}/{WHATSAPP_MEDIA_PORT} {" " + tr("m8a54aa9ef7")}</Notice>
                )}
              </MethodCard>
            )}

            <MethodCard
              icon={Globe}
              tone="sky"
              title={tr("m15c83f12fc")}
              subtitle={tr("m7b920a4884")}
              badge={tr("mb23b6b4d06")}
            >
              <div className="grid grid-cols-2 gap-2">
                <CopyField label={tr("m473e035d74")} value={ip} copyKey="http_ip" api={api} />
                <CopyField label={tr("m946d1f8153")} value={String(hotspotInfo.httpPort)} copyKey="http_port" api={api} />
                <CopyField
                  label={tr("m7becca1a2e")}
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
              title={tr("m75548cb620")}
              subtitle={tr("mbe66cd50b3")}
              badge={hotspotInfo.udpSupported ? tr("m53be7f1e37") : 'TCP'}
            >
              <div className="grid grid-cols-2 gap-2">
                <CopyField label={tr("m473e035d74")} value={ip} copyKey="socks_ip" api={api} className="col-span-2" />
                <CopyField label={tr("mcf8602caa4")} value={String(hotspotInfo.socksPort)} copyKey="socks_port" api={api} />
                <CopyField
                  label={tr("m3bd119ac9c")}
                  value={String(udpPort)}
                  copyKey="socks_udp_port"
                  api={api}
                  valueClassName={TONES.emerald.text}
                />
                <CopyField
                  label={tr("m7da3df8568")}
                  value={hotspotInfo.socksProxy}
                  copyKey="socks_full"
                  api={api}
                  className="col-span-2"
                  small
                />
                <CopyField
                  label={tr("m1fb8b00425")}
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
                onClick={() => copy(telegramLink, tr("ma66a7b564e"), 'socks_tg')}
                className={`w-full min-h-[40px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation transition-colors ${TONES.sky.button}`}
              >
                {copiedKey === 'socks_tg' ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                {copiedKey === 'socks_tg' ? tr("me0b19ca0b0") : tr("m7236ab725d")}
              </button>
            </MethodCard>

            <MethodCard
              icon={Radio}
              tone="amber"
              title={tr("m1060a97a49")}
              subtitle={tr("m37f08785a2")}
              badge={tr("m0286249762")}
            >
              <CopyField
                label={tr("m27c9d797f5")}
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
                  {tr("me7c245bd65")}</h4>
                <p className="text-[11px] truncate font-mono" style={{ color: 'var(--text-muted)' }}>
                  {hotspotInfo.helpUrl}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => copy(hotspotInfo.helpUrl, tr("m763a9cb2bf"), 'help_url')}
                  className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer touch-manipulation hover:bg-[var(--surface-hover)]"
                  style={fieldStyle}
                  aria-label={tr("m41576196f2")}
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
                  aria-label={tr("m5ca141274b")}
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
                        {tr("m8bac14221b")}</h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                        {tr("mc8995ae619")}</p>
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
                      <span>{tr("m77e4d2451f")}</span>
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
                      <span>{tr("me6e1ba7225")}</span>
                    </button>
                  </div>

                  {vtPlatform === 'android' ? (
                    <div className="space-y-3">
                      <Steps
                        items={[
                          <>
                            {tr("m25158a70bb")}</>,
                          <>
                            {tr("mfcb36ffc7d") + " "}<strong>{tr("m389f3dd712")}</strong> {" " + tr("m3e267a7613")}<div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openUrl(VT_SHARE_APK_UNIVERSAL_URL)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-[var(--accent)] text-white hover:brightness-110 cursor-pointer shadow-sm"
                              >
                                <Download className="w-3.5 h-3.5" /> {" " + tr("m6db9cd0cfa")}</button>
                              <button
                                type="button"
                                onClick={() => openUrl(VT_SHARE_APK_ARM64_URL)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border hover:bg-[var(--surface-hover)] cursor-pointer"
                                style={fieldStyle}
                              >
                                <Download className="w-3.5 h-3.5 text-[var(--accent)]" /> {" " + tr("m85307a2c11")}</button>
                              <button
                                type="button"
                                onClick={() => copy(VT_SHARE_APK_UNIVERSAL_URL, tr("m4208c18880"), 'g_apk_link')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border hover:bg-[var(--surface-hover)] cursor-pointer"
                                style={fieldStyle}
                              >
                                {copiedKey === 'g_apk_link' ? (
                                  <Check className="w-3.5 h-3.5 text-[var(--ok)]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>{copiedKey === 'g_apk_link' ? 'Copiado!' : tr("mc19488a055")}</span>
                              </button>
                            </div>
                          </>,
                          <>
                            {tr("m2f8286e270") + " "}<strong>{tr("m389f3dd712")}</strong>{tr("m88b09510c1")}{' '}
                            <CopyChip value={ip} label={tr("mab34c1af31")} copyKey="g_vt_ip" api={api} /> {" " + tr("m476faceb75")}{' '}
                            <CopyChip value={String(hotspotInfo.socksPort)} label={tr("m8dee138248")} copyKey="g_vt_port" api={api} />.
                          </>,
                          <>
                            {tr("ma8cfe9f7ff") + " "}<strong>{tr("m3b0b0fdfe2")}</strong> {" " + tr("m895854f4f8")}</>,
                          <>
                            <strong>{tr("m334ebb0843")}</strong> {" " + tr("m97a86b5b54")}</>,
                        ]}
                      />

                      <Notice tone="info">
                        {tr("m2b6799c1fe") + " "}<strong>{tr("m389f3dd712")}</strong> {" " + tr("m14598d9b72")}</Notice>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Steps
                        items={[
                          <>
                            {tr("m0fea3cbb7f")}</>,
                          <>
                            {tr("m959610975b")}<div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openUrl(VT_SHARE_EXE_X64_URL)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-[var(--accent)] text-white hover:brightness-110 cursor-pointer shadow-sm"
                              >
                                <Download className="w-3.5 h-3.5" /> {" " + tr("m9ff2252571")}</button>
                              <button
                                type="button"
                                onClick={() => openUrl(VT_SHARE_EXE_ARM64_URL)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border hover:bg-[var(--surface-hover)] cursor-pointer"
                                style={fieldStyle}
                              >
                                <Download className="w-3.5 h-3.5 text-[var(--accent)]" /> {" " + tr("mb9ec21b9a5")}</button>
                              <button
                                type="button"
                                onClick={() => copy(VT_SHARE_EXE_X64_URL, tr("mda20cd2477"), 'g_win_link')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border hover:bg-[var(--surface-hover)] cursor-pointer"
                                style={fieldStyle}
                              >
                                {copiedKey === 'g_win_link' ? (
                                  <Check className="w-3.5 h-3.5 text-[var(--ok)]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>{copiedKey === 'g_win_link' ? 'Copiado!' : tr("mc19488a055")}</span>
                              </button>
                            </div>
                          </>,
                          <>
                            {tr("mf9c333913c") + " "}<strong>{tr("md4584547c7")}</strong> {" " + tr("m0b872f5a35")}</>,
                          <>
                            {tr("m7d5e9375f7")}{' '}
                            <CopyChip value={ip} label="IP" copyKey="g_win_ip" api={api} /> {" " + tr("m4b209a2714")}{' '}
                            <CopyChip value={String(hotspotInfo.socksPort)} label={tr("m946d1f8153")} copyKey="g_win_port" api={api} />.
                          </>,
                          <>
                            {tr("mbc3a5125ec") + " "}<strong>{tr("m3b0b0fdfe2")}</strong>{tr("ma88e58ed2d")}</>,
                        ]}
                      />

                      <Notice tone="info">
                        {tr("mf8934dd4eb") + " "}<strong>{tr("m62ba5d393a")}</strong> {" " + tr("m6c7f7cb79d")}</Notice>
                    </div>
                  )}
                </div>
              )}

              {guide === 'whatsapp' && (
                <>
                  <h4 className={`font-bold text-sm flex items-center gap-2 ${TONES.green.text}`}>
                    <MessageCircle className="w-4 h-4" /> {" " + tr("m6e45bfcb10")}</h4>
                  {waSupported ? (
                    <Steps
                      items={[
                        tr("m54ab55c8eb"),
                        <>
                          {tr("m9e98fca5bb") + " "}<strong>{tr("m7eb7eb18bc")}</strong>.
                        </>,
                        <>
                          {tr("m81e1c326d5") + " "}<strong>{tr("m151cbfc9f8")}</strong> {" " + tr("md2508ed8ab") + " "}<strong>{tr("m5bf5a6cfad")}</strong>.
                        </>,
                        <>
                          {tr("m294005b2a1") + " "}<CopyChip value={ip} label={tr("mef5e7e12bd")} copyKey="g_wa_ip" api={api} />
                        </>,
                        <>
                          {tr("m961e110ddb")}{' '}
                          <CopyChip value={String(waChatPort)} label={tr("mc06e301b9a")} copyKey="g_wa_chat" api={api} /> {" " + tr("mc05509e442")}{' '}
                          <CopyChip value={String(waMediaPort)} label={tr("m6b6dec06a4")} copyKey="g_wa_media" api={api} />
                        </>,
                        <>
                          {tr("m27a72b2d6c") + " "}<strong>{tr("m1fd04add1d")}</strong> {" " + tr("ma29ec9c61e") + " "}<em>{tr("m7444e37ea6")}</em> {" " + tr("mc993d1a4e0")}</>,
                      ]}
                    />
                  ) : (
                    <Notice tone="warn">{tr("m48cf01bf7d")}</Notice>
                  )}
                  <Notice>
                    {tr("m62130dadda")}</Notice>
                </>
              )}

              {guide === 'android' && (
                <>
                  <h4 className={`font-bold text-sm flex items-center gap-2 ${TONES.sky.text}`}>
                    <Smartphone className="w-4 h-4" /> Android
                  </h4>
                  <Steps
                    items={[
                      tr("m63d21ed4e4"),
                      <>
                        {tr("mab56faecef") + " "}<strong>{tr("mcfb7726eb8")}</strong>{tr("mf423f7ebcf")}{' '}
                        <strong>{tr("mc3f1b096cd")}</strong>).
                      </>,
                      <>
                        {tr("mab56faecef") + " "}<strong>{tr("m5faf10d37e")}</strong>{tr("m4956988e8c") + " "}<strong>{tr("mb0b9fe24ff")}</strong>.
                      </>,
                      <>
                        {tr("m20c116ae12") + " "}<CopyChip value={ip} label="IP" copyKey="g_and_ip" api={api} /> {" " + tr("ma1bc1dbf02")}{' '}
                        <CopyChip value={String(hotspotInfo.httpPort)} label={tr("m946d1f8153")} copyKey="g_and_port" api={api} />
                      </>,
                      <>
                        {tr("m9bd94e9348") + " "}<strong>{tr("maef7cd5b20")}</strong>.
                      </>,
                    ]}
                  />
                  <Notice>
                    {tr("m10b3c3a0b3")}{' '}
                    <button
                      type="button"
                      onClick={() => setGuide('whatsapp')}
                      className="underline font-semibold text-[var(--accent)] cursor-pointer"
                    >
                      {tr("md0ffdd5da5")}</button>
                    .
                  </Notice>
                </>
              )}

              {guide === 'ios' && (
                <>
                  <h4 className={`font-bold text-sm flex items-center gap-2 ${TONES.amber.text}`}>
                    <Smartphone className="w-4 h-4" /> {" " + tr("md19a4da0d0")}</h4>
                  <Steps
                    items={[
                      tr("m95cde23899"),
                      <>
                        {tr("me168936a5b") + " "}<strong>{tr("m272ab01808")}</strong> {" " + tr("m9e241a4c6c") + " "}<strong>{tr("m6836960f9b")}</strong>.
                      </>,
                      <>
                        {tr("m94933bd0d6") + " "}<strong>{tr("mb803f24d52")}</strong> {" " + tr("m00f1338bab")}{' '}
                        <CopyChip value={hotspotInfo.pacUrl} label={tr("m1ec1aa3431")} copyKey="g_ios_pac" api={api} />
                      </>,
                      <>
                        {tr("mfb2c7d8dd3") + " "}<strong>{tr("mb0b9fe24ff")}</strong>{tr("m19ce90db16")}{' '}
                        <CopyChip value={ip} label="IP" copyKey="g_ios_ip" api={api} /> {" " + tr("m2c16071093")}{' '}
                        <CopyChip value={String(hotspotInfo.httpPort)} label={tr("m946d1f8153")} copyKey="g_ios_port" api={api} />
                      </>,
                      <>
                        {tr("m9bd94e9348") + " "}<strong>{tr("maef7cd5b20")}</strong>.
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
                      tr("m6d30be5b80"),
                      <>
                        {tr("m0e8560c033") + " "}<strong>{tr("md2cf5d0389")}</strong> {" " + tr("m1df5e4d1de") + " "}<strong>{tr("m6ccdc156ca")}</strong>.
                      </>,
                      <>
                        {tr("mb4356f85e2") + " "}<strong>{tr("m8cbc21c63e")}</strong>{tr("m99f0e628f3")}{' '}
                        <CopyChip value={hotspotInfo.pacUrl} label={tr("m1ec1aa3431")} copyKey="g_win_pac" api={api} />
                      </>,
                      <>
                        {tr("m09a9253d00") + " "}<strong>{tr("meb2e7856f6")}</strong>{tr("m4495aa18e1")}{' '}
                        <CopyChip value={ip} label="IP" copyKey="g_win_ip" api={api} /> {" " + tr("m2c16071093")}{' '}
                        <CopyChip value={String(hotspotInfo.httpPort)} label={tr("m946d1f8153")} copyKey="g_win_port" api={api} />
                      </>,
                      <>
                        {tr("mbc3a5125ec") + " "}<strong>{tr("maef7cd5b20")}</strong>.
                      </>,
                    ]}
                  />
                </>
              )}

              {guide === 'tv' && (
                <>
                  <h4 className={`font-bold text-sm flex items-center gap-2 ${TONES.emerald.text}`}>
                    <Tv className="w-4 h-4" /> {" " + tr("m3e95bad17b")}</h4>
                  <Steps
                    items={[
                      tr("m5dbb4a089d"),
                      <>
                        {tr("m40d77cf40e") + " "}<strong>{tr("m3d7c79e9c6")}</strong> {" " + tr("m138e4598d9")}</>,
                      <>
                        {tr("mab56faecef") + " "}<strong>Proxy</strong>{tr("m4956988e8c") + " "}<strong>{tr("mb0b9fe24ff")}</strong>.
                      </>,
                      <>
                        {tr("m2ff4d965f9") + " "}<CopyChip value={ip} label="IP" copyKey="g_tv_ip" api={api} /> {" " + tr("ma1bc1dbf02")}{' '}
                        <CopyChip value={String(hotspotInfo.httpPort)} label={tr("m946d1f8153")} copyKey="g_tv_port" api={api} />
                      </>,
                      tr("m8d1513c669"),
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
                        {tr("mb698679dca") + " "}<strong>{tr("md11f5692e3")}</strong>.
                      </>,
                      <>
                        {tr("mab6f7add66") + " "}<strong>SOCKS5</strong>.
                      </>,
                      <>
                        {tr("m2ff4d965f9") + " "}<CopyChip value={ip} label="IP" copyKey="g_tg_ip" api={api} /> {" " + tr("ma1bc1dbf02")}{' '}
                        <CopyChip value={String(hotspotInfo.socksPort)} label={tr("m946d1f8153")} copyKey="g_tg_port" api={api} />
                      </>,
                      <>
                        {tr("m30c821f369")}{' '}
                        <CopyChip value={telegramLink} label={tr("ma66a7b564e")} copyKey="g_tg_link" api={api} />
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
                    {tr("m80e0c77fca")}</h3>
                  <p className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                    {tr("ma53af56579")}</p>
                </div>
                <button
                  type="button"
                  onClick={handleResetPort}
                  className="px-2.5 min-h-[32px] rounded-lg text-[11px] font-medium cursor-pointer flex-shrink-0 hover:bg-[var(--surface-hover)]"
                  style={{ ...fieldStyle, color: 'var(--text-muted)' }}
                >
                  {tr("meda02893d3") + " "}{DEFAULT_PORT}
                </button>
              </div>

              <div>
                <label
                  htmlFor="hotspot-port"
                  className="text-[11px] block font-medium mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {tr("m693b644889")}</label>
                <input dir="auto"
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
                  {portError ?? tr("m6b573202ff")}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'SOCKS5', value: portError ? '—' : chosenDerived.socks, cls: '' },
                  { label: tr("m3bd119ac9c"), value: portError ? '—' : chosenDerived.udp, cls: TONES.emerald.text },
                  { label: tr("m3345014d73"), value: WHATSAPP_CHAT_PORT, cls: TONES.green.text },
                  { label: tr("ma18e7cf7ff"), value: WHATSAPP_MEDIA_PORT, cls: TONES.green.text },
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
                  {tr("mc5fb4dd14f") + " "}{chosenPort}
                </button>
              )}
            </section>

            <section className="p-3.5 sm:p-4 rounded-xl space-y-3" style={cardStyle}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    {tr("m56c5990c9f")}</h3>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {tr("m199d00fe87")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    checkStatus();
                    setLocalIps(getLocalIpsData());
                    haptic(20);
                    showNativeToast(tr("m9453d52d65"));
                  }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--accent)] cursor-pointer touch-manipulation hover:bg-[var(--surface-hover)] flex-shrink-0"
                  style={fieldStyle}
                  aria-label={tr("mdafb59613e")}
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
                    {tr("m716068eac9")}</div>
                )}
              </div>

              <Notice>
                {tr("mb8cf6beff3") + " "}<strong>192.168.43.1</strong>{tr("mbb88add416")}</Notice>
            </section>
          </div>
        )}
      </div>
    </Modal>
  );
});

export { Hotspot };
export default Hotspot;
