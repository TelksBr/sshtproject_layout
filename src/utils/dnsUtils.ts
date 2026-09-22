import { getSdk } from './sdkInstance';
import { getStorageItem, setStorageItem } from './storageUtils';

export interface DnsPreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  description: string;
}

export interface CustomDnsSettings {
  enabled: boolean;
  primary: string;
  secondary: string;
}

const STORAGE_DNS_KEY = 'vtunnel_custom_dns_settings';

export const DEFAULT_DNS_PRESETS: DnsPreset[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    primary: '1.1.1.1',
    secondary: '1.0.0.1',
    description: 'Máxima velocidade e foco em privacidade',
  },
  {
    id: 'google',
    name: 'Google DNS',
    primary: '8.8.8.8',
    secondary: '8.8.4.4',
    description: 'Alta disponibilidade e estabilidade global',
  },
  {
    id: 'adguard',
    name: 'AdGuard DNS',
    primary: '94.140.14.14',
    secondary: '94.140.15.15',
    description: 'Bloqueio de anúncios e rastreadores',
  },
  {
    id: 'quad9',
    name: 'Quad9',
    primary: '9.9.9.9',
    secondary: '149.112.112.112',
    description: 'Proteção avançada contra malwares e phishing',
  },
  {
    id: 'opendns',
    name: 'OpenDNS',
    primary: '208.67.222.222',
    secondary: '208.67.220.220',
    description: 'Filtro de segurança e proteção de navegação',
  },
];

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6_REGEX = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

export function isValidIpAddress(ip: string): boolean {
  const trimmed = ip.trim();
  if (!trimmed) return false;
  return IPV4_REGEX.test(trimmed) || IPV6_REGEX.test(trimmed);
}

export function getCustomDnsConfig(): CustomDnsSettings {
  const sdk = getSdk();
  let sdkConfig: { enabled?: boolean; primary?: string; secondary?: string } | null = null;

  if (sdk?.dns) {
    try {
      sdkConfig = sdk.dns.get();
    } catch {
      // Ignora erro se bridge não estiver ativa
    }
  }

  const stored = getStorageItem<CustomDnsSettings>(STORAGE_DNS_KEY);

  return {
    enabled: typeof sdkConfig?.enabled === 'boolean' ? sdkConfig.enabled : (stored?.enabled ?? false),
    primary: sdkConfig?.primary || stored?.primary || '1.1.1.1',
    secondary: sdkConfig?.secondary || stored?.secondary || '1.0.0.1',
  };
}

export function setCustomDnsConfig(settings: CustomDnsSettings): void {
  const sdk = getSdk();

  // Salva no storage local
  setStorageItem(STORAGE_DNS_KEY, settings);

  // Aplica no SDK VTunnel
  if (sdk?.dns) {
    try {
      sdk.dns.set({
        enabled: settings.enabled,
        primary: settings.primary.trim(),
        secondary: settings.secondary.trim(),
      });
    } catch (err) {
      console.warn('Falha ao aplicar DNS no SDK nativo:', err);
    }
  }
}

export function openNativeDnsDialog(): boolean {
  const sdk = getSdk();
  if (sdk?.dns) {
    try {
      sdk.dns.showDialog();
      return true;
    } catch (err) {
      console.warn('Erro ao abrir diálogo nativo de DNS:', err);
    }
  }
  return false;
}
