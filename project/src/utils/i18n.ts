export function translateText(key: string): string {
  if (window?.DtTranslateText?.execute && typeof window.DtTranslateText.execute === "function") {
    return window.DtTranslateText.execute(key) || key;
  }
  return key;
}

export const TRANSLATIONS = {
  pt: {
    'LBL_BTN_START': 'Conectar',
    'LBL_BTN_STOP': 'Desconectar',
    'LBL_BTN_STOPPING': 'Parando...',
    'LBL_STATE_DISCONNECTED': 'Desconectado',
    'LBL_STATE_CONNECTING': 'Conectando...',
    'LBL_STATE_CONNECTED': 'Conectado',
    'LBL_STATE_STOPPING': 'Parando...',
    'LBL_STATE_NO_NETWORK': 'Sem Rede',
    'LBL_STATE_AUTH': 'Autenticando...',
    'LBL_STATE_AUTH_FAILED': 'Falha na Autenticação',
    'TOOLTIP_CONNECT': 'Clique para conectar',
    'TOOLTIP_DISCONNECT': 'Clique para desconectar',
    'TOOLTIP_CONFIG': 'Configurações',
    'TOOLTIP_REFRESH': 'Atualizar',
    'TOOLTIP_CHECK_USER': 'Verificar usuário'
  }
};