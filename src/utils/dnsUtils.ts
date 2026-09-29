import { getSdk } from './sdkInstance';
import { getStorageItem, setStorageItem } from './storageUtils';

export interface DnsPreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  primaryIpv6?: string;
  secondaryIpv6?: string;
  description: string;
}

export interface CustomDnsSettings {
  enabled: boolean;
  primary: string;
  secondary: string;
  primaryIpv6?: string;
  secondaryIpv6?: string;
}

const STORAGE_DNS_KEY = 'vtunnel_custom_dns_settings';

export const DEFAULT_DNS_PRESETS: DnsPreset[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    primary: '1.1.1.1',
    secondary: '1.0.0.1',
    primaryIpv6: '2606:4700:4700::1111',
    secondaryIpv6: '2606:4700:4700::1001',
    description: 'Máxima velocidade e foco em privacidade',
  },
  {
    id: 'google',
    name: 'Google DNS',
    primary: '8.8.8.8',
    secondary: '8.8.4.4',
    primaryIpv6: '2001:4860:4860::8888',
    secondaryIpv6: '2001:4860:4860::8844',
    description: 'Alta disponibilidade e estabilidade global',
  },
  {
    id: 'adguard',
    name: 'AdGuard DNS',
    primary: '94.140.14.14',
    secondary: '94.140.15.15',
    primaryIpv6: '2a10:50c0::ad1:ff',
    secondaryIpv6: '2a10:50c0::ad2:ff',
    description: 'Bloqueio de anúncios e rastreadores',
  },
  {
    id: 'quad9',
    name: 'Quad9',
    primary: '9.9.9.9',
    secondary: '149.112.112.112',
    primaryIpv6: '2620:fe::fe',
    secondaryIpv6: '2620:fe::9',
    description: 'Proteção avançada contra malwares e phishing',
  },
  {
    id: 'opendns',
    name: 'OpenDNS',
    primary: '208.67.222.222',
    secondary: '208.67.220.220',
    primaryIpv6: '2620:119:35::35',
    secondaryIpv6: '2620:119:53::53',
    description: 'Filtro de segurança e proteção de navegação',
  },
];

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6_REGEX = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

export function isValidIpv4Address(ip: string): boolean {
  const trimmed = ip.trim();
  if (!trimmed) return false;
  return IPV4_REGEX.test(trimmed);
}

export function isValidIpv6Address(ip: string): boolean {
  const trimmed = ip.trim();
  if (!trimmed) return false;
  return IPV6_REGEX.test(trimmed);
}

export function isValidIpAddress(ip: string): boolean {
  const trimmed = ip.trim();
  if (!trimmed) return false;
  return IPV4_REGEX.test(trimmed) || IPV6_REGEX.test(trimmed);
}

export function getDnsPresets(): DnsPreset[] {
  const sdk = getSdk();
  if (sdk?.dns && typeof sdk.dns.getPresets === 'function') {
    try {
      const nativePresets = sdk.dns.getPresets();
      if (Array.isArray(nativePresets) && nativePresets.length > 0) {
        return nativePresets.map((np) => {
          const foundDefault = DEFAULT_DNS_PRESETS.find(
            (dp) => dp.id === np.id || dp.name.toLowerCase() === np.name.toLowerCase()
          );
          return {
            id: np.id || foundDefault?.id || np.name.toLowerCase().replace(/\s+/g, '-'),
            name: np.name || foundDefault?.name || 'DNS',
            primary: np.primary || foundDefault?.primary || '',
            secondary: np.secondary || foundDefault?.secondary || '',
            primaryIpv6: np.primaryIpv6 || foundDefault?.primaryIpv6 || '',
            secondaryIpv6: np.secondaryIpv6 || foundDefault?.secondaryIpv6 || '',
            description: foundDefault?.description || 'Servidor DNS pré-configurado',
          };
        });
      }
    } catch {
      // fallback para os presets padrão
    }
  }
  return DEFAULT_DNS_PRESETS;
}

export function getCustomDnsConfig(): CustomDnsSettings {
  const sdk = getSdk();
  let sdkConfig: {
    enabled?: boolean;
    primary?: string;
    secondary?: string;
    primaryIpv6?: string;
    secondaryIpv6?: string;
  } | null = null;

  if (sdk?.dns) {
    try {
      sdkConfig = sdk.dns.get();
    } catch {
      // Ignora erro se bridge não estiver ativa
    }
  }

  const stored = getStorageItem<CustomDnsSettings>(STORAGE_DNS_KEY);

  const primaryIpv4 = sdkConfig?.primary || stored?.primary || '1.1.1.1';
  const matchedPreset = DEFAULT_DNS_PRESETS.find((p) => p.primary === primaryIpv4);

  const primaryIpv6 =
    sdkConfig?.primaryIpv6 !== undefined
      ? sdkConfig.primaryIpv6
      : stored?.primaryIpv6 !== undefined
      ? stored.primaryIpv6
      : matchedPreset?.primaryIpv6 || '2606:4700:4700::1111';

  const secondaryIpv6 =
    sdkConfig?.secondaryIpv6 !== undefined
      ? sdkConfig.secondaryIpv6
      : stored?.secondaryIpv6 !== undefined
      ? stored.secondaryIpv6
      : matchedPreset?.secondaryIpv6 || '2606:4700:4700::1001';

  return {
    enabled: typeof sdkConfig?.enabled === 'boolean' ? sdkConfig.enabled : (stored?.enabled ?? false),
    primary: primaryIpv4,
    secondary: sdkConfig?.secondary || stored?.secondary || '1.0.0.1',
    primaryIpv6,
    secondaryIpv6,
  };
}

export function setCustomDnsConfig(settings: CustomDnsSettings): void {
  const sdk = getSdk();

  const cleanSettings: CustomDnsSettings = {
    enabled: settings.enabled,
    primary: (settings.primary || '').trim(),
    secondary: (settings.secondary || '').trim(),
    primaryIpv6: (settings.primaryIpv6 || '').trim(),
    secondaryIpv6: (settings.secondaryIpv6 || '').trim(),
  };

  // Salva no storage local
  setStorageItem(STORAGE_DNS_KEY, cleanSettings);

  // Aplica no SDK VTunnel
  if (sdk?.dns) {
    try {
      sdk.dns.set({
        enabled: cleanSettings.enabled,
        primary: cleanSettings.primary,
        secondary: cleanSettings.secondary,
        primaryIpv6: cleanSettings.primaryIpv6,
        secondaryIpv6: cleanSettings.secondaryIpv6,
      });

      if (typeof sdk.dns.save === 'function') {
        try {
          sdk.dns.save(
            cleanSettings.enabled,
            cleanSettings.primary,
            cleanSettings.secondary,
            cleanSettings.primaryIpv6,
            cleanSettings.secondaryIpv6
          );
        } catch {
          // ignore
        }
      }
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
