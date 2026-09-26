import { getSdk } from './sdkInstance';
import { call, callVoid } from './dtunnelBridge';
import type { VTunnelHotSpotInfo, VTunnelHotSpotStatus } from 'vtunnel-sdk';

export type { VTunnelHotSpotInfo, VTunnelHotSpotStatus };

export interface LocalIpsData {
  ipv4: string | null;
  ipv6: string | null;
}

/**
 * Retorna o status atual do serviço Hotspot ('RUNNING', 'STOPPED' ou null)
 */
export function getHotspotStatus(): 'STOPPED' | 'RUNNING' | null {
  try {
    const sdk = getSdk();
    let status: string | null = null;
    if (sdk?.android) {
      const v = sdk.android.getHotSpotStatus();
      status = v ? String(v) : null;
    }
    if (status == null) {
      const raw = call('VtGetStatusHotSpotService', 'execute') ?? call('DtGetStatusHotSpotService', 'execute');
      status = raw ? String(raw) : null;
    }
    if (status == null) return null;
    const normalizedStatus = String(status).toUpperCase().trim();
    if (normalizedStatus === 'RUNNING' || normalizedStatus === 'ACTIVE') return 'RUNNING';
    if (normalizedStatus === 'STOPPED' || normalizedStatus === 'INACTIVE') return 'STOPPED';
    return 'STOPPED';
  } catch {
    return null;
  }
}

/**
 * Retorna os IPs locais detectados na interface de rede (IPv4 e IPv6)
 */
export function getLocalIpsData(): LocalIpsData {
  try {
    const sdk = getSdk();
    let ipv4: string | null = null;
    let ipv6: string | null = null;

    if (sdk?.main) {
      try {
        const rawJson = sdk.main.getLocalIps();
        if (rawJson) {
          const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
          if (parsed && typeof parsed === 'object') {
            ipv4 = parsed.ipv4 ? String(parsed.ipv4) : null;
            ipv6 = parsed.ipv6 ? String(parsed.ipv6) : null;
          }
        }
      } catch {
        // ignora erro no parse
      }

      if (!ipv4 && typeof sdk.main.getLocalIp === 'function') {
        const v = sdk.main.getLocalIp();
        if (v) ipv4 = String(v);
      }
      if (!ipv6 && typeof sdk.main.getLocalIpv6 === 'function') {
        const v = sdk.main.getLocalIpv6();
        if (v) ipv6 = String(v);
      }
    }

    if (!ipv4) {
      const raw = call('VtGetLocalIP', 'execute') ?? call('DtGetLocalIP', 'execute');
      if (raw) ipv4 = String(raw);
    }
    if (!ipv6) {
      const raw = call('VtGetLocalIPv6', 'execute') ?? call('DtGetLocalIPv6', 'execute');
      if (raw) ipv6 = String(raw);
    }

    return { ipv4, ipv6 };
  } catch {
    return { ipv4: null, ipv6: null };
  }
}

/**
 * Consulta as informações completas do HotSpot (IPs, portas, PAC e URLs de proxy)
 */
export function getHotspotInfo(): VTunnelHotSpotInfo | null {
  try {
    const sdk = getSdk();
    if (sdk?.android && typeof sdk.android.getHotSpotInfo === 'function') {
      const info = sdk.android.getHotSpotInfo();
      if (info && typeof info === 'object') {
        return info;
      }
    }

    let raw = call('VtGetHotSpotInfo', 'execute');
    if (raw == null) {
      raw = call('DtGetHotSpotInfo', 'execute');
    }

    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as VTunnelHotSpotInfo;
      } catch {
        return null;
      }
    } else if (raw && typeof raw === 'object') {
      return raw as VTunnelHotSpotInfo;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Retorna as informações resolvidas e consistentes de todos os métodos de conexão Hotspot,
 * garantindo valores pré-calculados para exibição imediata na interface mesmo em fallback.
 */
export function getResolvedHotspotInfo(preferredPort = 8578): VTunnelHotSpotInfo {
  const rawInfo = getHotspotInfo();
  const status = getHotspotStatus() || 'STOPPED';
  const isRunning = status === 'RUNNING';
  const localIps = getLocalIpsData();

  const ip = rawInfo?.ip || localIps.ipv4 || '192.168.43.1';
  const httpPort = Number(rawInfo?.httpPort) || preferredPort;
  const socksPort = Number(rawInfo?.socksPort) || (httpPort === 8578 ? 8579 : httpPort + 1);
  const socksUdpPort = Number(rawInfo?.socksUdpPort) || (httpPort === 8578 ? 8580 : httpPort + 2);
  const udpSupported = rawInfo?.udpSupported !== undefined ? Boolean(rawInfo.udpSupported) : isRunning;

  return {
    state: status,
    running: isRunning,
    ip,
    httpPort,
    socksPort,
    socksUdpPort,
    udpSupported,
    httpProxy: rawInfo?.httpProxy || `${ip}:${httpPort}`,
    socksProxy: rawInfo?.socksProxy || `${ip}:${socksPort}`,
    socksUdpProxy: rawInfo?.socksUdpProxy || `${ip}:${socksUdpPort}`,
    pacUrl: rawInfo?.pacUrl || `http://${ip}:${httpPort}/proxy.pac`,
    helpUrl: rawInfo?.helpUrl || `http://${ip}:${httpPort}/`,
  };
}

/**
 * Inicia o serviço de HotSpot com porta opcional (padrão 8578)
 */
export function startHotspot(port?: number): boolean {
  try {
    const sdk = getSdk();
    const portArg = typeof port === 'number' && port >= 1024 && port <= 65535 ? port : undefined;

    if (sdk?.android && typeof sdk.android.startHotSpotService === 'function') {
      if (portArg != null) {
        sdk.android.startHotSpotService(portArg);
      } else {
        sdk.android.startHotSpotService();
      }
      return true;
    }

    if (portArg != null) {
      callVoid('VtStartHotSpotService', 'execute', [portArg]);
      callVoid('DtStartHotSpotService', 'execute', [portArg]);
    } else {
      callVoid('VtStartHotSpotService', 'execute');
      callVoid('DtStartHotSpotService', 'execute');
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Para o serviço de HotSpot
 */
export function stopHotspot(): boolean {
  try {
    const sdk = getSdk();
    if (sdk?.android && typeof sdk.android.stopHotSpotService === 'function') {
      sdk.android.stopHotSpotService();
      return true;
    }

    callVoid('VtStopHotSpotService', 'execute');
    callVoid('DtStopHotSpotService', 'execute');
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica rapidamente se o hotspot está ativo
 */
export function isHotspotRunning(): boolean {
  const sdk = getSdk();
  if (sdk?.android && typeof sdk.android.isHotSpotRunning === 'function') {
    return sdk.android.isHotSpotRunning();
  }
  return getHotspotStatus() === 'RUNNING';
}