import { startConnection, stopConnection, getConnectionState } from './appFunctions';

// Tipos para configuração do autoconecte
export interface AutoConnectConfig {
  fetchTimeout: number;     // Timeout do fetch (ms)
  connectionTimeout: number; // Timeout da conexão (ms)
  selectedCategories: number[]; // IDs das categorias selecionadas (vazio = todas)
  configType: 'all' | 'ssh' | 'v2ray'; // Tipo de config a testar
}

export const DEFAULT_AUTO_CONNECT_CONFIG: AutoConnectConfig = {
  fetchTimeout: 4000,
  connectionTimeout: 10000,
  selectedCategories: [],
  configType: 'all'
};

async function testInternet(timeout = 4000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    await fetch('https://www.google.com/generate_204', { signal: controller.signal });
    clearTimeout(id);
    return true;
  } catch {
    return false;
  }
}

async function waitForConnectionState(targetState: string, timeout: number, cancelRef?: React.MutableRefObject<{ cancelled: boolean }>): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (cancelRef?.current?.cancelled) return false;
    const state = getConnectionState();
    if (state === targetState) return true;
    await new Promise(res => setTimeout(res, 500));
  }
  return false;
}

// Remova qualquer execução automática do teste daqui. 
// Apenas exporte a função, não execute nada ao importar este arquivo.

export async function autoConnectTest({
  configs,
  setCurrentName,
  setTested,
  setActiveConfig,
  setActiveConfigState,
  setSelectedCategory,
  setSuccess,
  cancelRef,
  onTestResult,
  autoConnectConfig = DEFAULT_AUTO_CONNECT_CONFIG, 
}: {
  configs: any[],
  setCurrentName: (name: string) => void,
  setTested: (n: number) => void,
  setActiveConfig: (id: any) => void,
  setActiveConfigState: (cfg: any) => void,
  setSelectedCategory: (cat: any) => void,
  setSuccess: (name: string | null) => void,
  cancelRef: React.MutableRefObject<{ cancelled: boolean }>,
  onTestResult?: (configName: string, success: boolean, message?: string) => void,
  autoConnectConfig?: AutoConnectConfig,
}): Promise<boolean> {
  // Filtra configs baseado nas configurações
  let filteredConfigs = configs;
  
  // Filtro por categoria (os configs já vêm com category_id quando flatMap é usado no hook)
  if (autoConnectConfig.selectedCategories.length > 0) {
    filteredConfigs = filteredConfigs.filter(config => 
      autoConnectConfig.selectedCategories.includes(config.category_id || config.categoryId)
    );
  }
  
  // Filtro por tipo de configuração
  if (autoConnectConfig.configType !== 'all') {
    filteredConfigs = filteredConfigs.filter(config => {
      const mode = config.mode?.toLowerCase() || '';
      if (autoConnectConfig.configType === 'ssh') {
        return mode.includes('ssh') || mode.includes('proxy') || mode.includes('socks');
      } else if (autoConnectConfig.configType === 'v2ray') {
        return mode.includes('v2ray') || mode.includes('vmess') || mode.includes('vless');
      }
      return true;
    });
  }

  for (let i = 0; i < filteredConfigs.length; i++) {
    if (cancelRef.current.cancelled) return false;
    const config = filteredConfigs[i];
    setCurrentName(config.name);
    setTested(i + 1);

    setActiveConfig(config.id);
    setActiveConfigState(config);

    try {
      startConnection();

      const connected = await waitForConnectionState('CONNECTED', autoConnectConfig.connectionTimeout, cancelRef);

      if (cancelRef.current.cancelled) return false;

      if (connected) {
        const internetOk = await testInternet(autoConnectConfig.fetchTimeout);
        if (cancelRef.current.cancelled) return false;
        
        if (internetOk) {
          setSuccess(config.name);
          setSelectedCategory(null);
          onTestResult?.(config.name, true, 'Conexão bem-sucedida!');
          return true;
        } else {
          onTestResult?.(config.name, false, 'Sem acesso à internet');
        }
      } else {
        onTestResult?.(config.name, false, 'Falha na conexão VPN');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      onTestResult?.(config.name, false, errorMsg);
    }

    stopConnection();
    // Removido o intervalo entre testes - prossegue imediatamente para o próximo
  }
  
  setSuccess(null);
  return false;
}
