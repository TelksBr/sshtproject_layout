import { ptBR } from './pt-BR';
import { extendLocale, type LocaleOverrides } from '../extendLocale';

// Shared by Portugal and Portuguese-speaking African countries. Store differences only.
const overrides = {
  "common": {
    "loading": "A carregar...",
    "save": "Guardar",
    "active": "ACTIVA",
    "configs": "configurações"
  },
  "header": {
    "connected": "Ligado",
    "connecting": "A ligar...",
    "stopping": "A parar ligação...",
    "auth": "A autenticar...",
    "disconnected": "Desligado"
  },
  "serverSelector": {
    "autoConnectTitle": "LIGAÇÃO AUTO",
    "updateConfigs": "Actualizar configurações",
    "checkUser": "Verificar conta",
    "airplaneMode": "Modo de voo",
    "currentConfig": "Config actual:",
    "selectConfigPrompt": "Seleccione uma configuração para ligar",
    "noCategoryForCountryDesc": "Não encontrámos categorias com a bandeira seleccionada.",
    "noConfigsFoundDesc": "Para descarregar as configurações mais recentes, é necessária uma ligação estável à internet.",
    "checkConnectionPrompt": "Verifique a sua ligação e tente novamente"
  },
  "connectionForm": {
    "connected": "DESLIGAR",
    "connecting": "A LIGAR...",
    "disconnected": "LIGAR",
    "stopping": "A PARAR...",
    "usernamePlaceholder": "Utilizador",
    "passwordPlaceholder": "Palavra-passe",
    "showPassword": "Ver palavra-passe",
    "hidePassword": "Ocultar palavra-passe",
    "showUuid": "Ver UUID",
    "uuidHelpDesc1": "É a chave única de acesso do seu V2Ray.",
    "uuidHelpDesc2": "Recebida no bot após a adesão.",
    "uuidHelpWarning": "Copie sem espaços adicionais.",
    "noNetworkError": "Sem ligação à internet",
    "recordsButton": "Registos",
    "autoConnectButton": "Ligação Auto"
  },
  "sidebar": {
    "quickActions": "Acções Rápidas",
    "recoverLogin": "Recuperar Acesso",
    "checkUser": "Verificar Conta",
    "speedTest": "Teste de Velocidade",
    "hotspot": "Hotspot (Partilha)",
    "ipFinder": "Localizador de IP",
    "settings": "Definições",
    "customDns": "DNS Personalizado",
    "apnSettings": "Definições de APN",
    "networkSettings": "Definições de Rede",
    "checkUpdates": "Verificar Actualizações",
    "activeBadge": "Activo",
  },
  "autoConnect": {
    "configsToTest": "{count} configuração(ões) a testar"
  }
} satisfies LocaleOverrides;

export const ptPT = extendLocale(ptBR, overrides);
