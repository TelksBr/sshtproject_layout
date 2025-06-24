import { startConnection, stopConnection, getConnectionState } from './appFunctions';

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

async function waitForConnectionState(targetState: string, timeout = 10000, cancelRef?: React.MutableRefObject<{ cancelled: boolean }>): Promise<boolean> {
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
  setError,
  cancelRef,
  timeout = 8000,
  fetchTimeout = 4000,
}: {
  configs: any[],
  setCurrentName: (name: string) => void,
  setTested: (n: number) => void,
  setActiveConfig: (id: any) => void,
  setActiveConfigState: (cfg: any) => void,
  setSelectedCategory: (cat: any) => void,
  setSuccess: (name: string | null) => void,
  setError: (msg: string) => void,
  cancelRef: React.MutableRefObject<{ cancelled: boolean }>,
  timeout?: number,
  fetchTimeout?: number,
}): Promise<boolean> {
  for (let i = 0; i < configs.length; i++) {
    if (cancelRef.current.cancelled) return false;
    const config = configs[i];
    setCurrentName(config.name);
    setTested(i + 1);

    setActiveConfig(config.id);
    setActiveConfigState(config);

    startConnection();

    const connected = await waitForConnectionState('CONNECTED', timeout, cancelRef);

    if (cancelRef.current.cancelled) return false;

    if (connected) {
      const ok = await testInternet(fetchTimeout);
      if (cancelRef.current.cancelled) return false;
      if (ok) {
        setSuccess(config.name);
        setSelectedCategory(null);
        return true;
      }
    }

    stopConnection();
    await new Promise(res => setTimeout(res, 1000));
  }
  setSuccess(null);
  return false;
}
