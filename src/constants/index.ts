// Arquivo central para exportar todas as constantes
export * from './appLogo';

// Constantes de configuração da aplicação
export const APP_CONFIG = {
  POLLING_INTERVALS: {
    IP_UPDATE: 5000,
    NETWORK_STATS: 2000,
    VPN_STATE_SYNC: 1000,
  },
  TIMEOUTS: {
    CONNECTION: 10000,
    FETCH: 4000,
    PING: 2000,
  },
  STORAGE_KEYS: {
    TERMS_ACCEPTED: 'terms-accepted-23-03-2025',
    PRIVACY_ACCEPTED: 'privacy-accepted-23-03-2025',
  },
  API: {
    BASE_URL: 'https://bot.sshtproject.com',
    FAST_API_URL: 'https://api.fast.com/netflix/speedtest/v2?https=true&token=YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm&urlCount=10',
  },
} as const;