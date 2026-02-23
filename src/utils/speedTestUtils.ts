interface FastAPIResponse {
  client: {
    ip: string;
    asn: string;
    location: {
      city: string;
      country: string;
    };
  };
  targets: Array<{
    name: string;
    url: string;
    location: {
      city: string;
      country: string;
    };
  }>;
}

interface SpeedTestResult {
  download: number;
  upload: number;  // Adicionado
  ping: number;
}

export interface TestServer {
  name: string;
  url: string;
  location: {
    city: string;
    country: string;
  };
  ping?: number;
  ip?: string | null; // Permite null para compatibilidade com getIpFromUrl
}

const FAST_API_URL = 'https://api.fast.com/netflix/speedtest/v2?https=true&token=YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm&urlCount=10';
const TEST_DURATION = 30000;
const PING_TIMEOUT = 2000;
const MAX_ACCEPTABLE_PING = 200; // ms
const PARALLEL_CONNECTIONS = 4; // Reduzido para 4 para webview (otimizado)
const CHUNK_SIZE = 8388608; // 8MB em bytes (reduzido para menos CPU)
const STABILITY_THRESHOLD = 0.1; // 10% de variação máxima
const STABILITY_SAMPLES = 5; // Número de amostras para confirmar estabilidade
const MIN_TEST_DURATION = 5000; // Mínimo de 5 segundos de teste
const LATENCY_MEASUREMENTS_FREQUENCY_MS = 1000; // Intervalo entre medições
const UPDATE_THROTTLE_MS = 500; // Atualização da UI a cada 500ms (otimizado para webview)

function decodeSpecialCharacters(text: string): string {
  try {
    // Decodifica usando diretamente ISO-8859-1 (Latin-1)
    const bytes = new Uint8Array([...text].map(c => c.charCodeAt(0) & 0xFF));
    return new TextDecoder('iso-8859-1').decode(bytes);
  } catch {
    return text; // Fallback para o texto original em caso de erro
  }
}

// Função utilitária para extrair hostname de uma URL
function extractHostname(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return null;
  }
}

// Função para obter o IP de um hostname usando DNS-over-HTTPS (Google)
export async function getIpFromUrl(url: string): Promise<string | null> {
  const hostname = extractHostname(url);
  if (!hostname) return null;
  try {
    const res = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
    const data = await res.json();
    if (data && data.Answer && data.Answer.length > 0) {
      // Pega o primeiro IP v4
      const ip = data.Answer.find((a: any) => a.type === 1)?.data;
      return ip || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSpeedTestServers(initial = false): Promise<TestServer[]> {
  try {
    const response = await fetch(FAST_API_URL);
    if (!response.ok) throw new Error('Failed to fetch speed test servers');
    
    const rawText = await response.text();
    const data: FastAPIResponse = JSON.parse(rawText);
    
    // Decodifica nomes e salva IP
    const servers: TestServer[] = await Promise.all(data.targets.map(async server => {
      const ip = await getIpFromUrl(server.url);
      return {
        ...server,
        location: {
          city: decodeSpecialCharacters(server.location.city),
          country: decodeSpecialCharacters(server.location.country)
        },
        ping: undefined, // Lazy measurement
        ip
      };
    }));
    
    // Se não for inicial, mede ping já na listagem
    if (!initial) {
      const serversWithPing = await Promise.all(
        servers.map(async s => ({
          ...s,
          ping: await measureLatency(s.url, false)
        }))
      );
      const goodServers = serversWithPing.filter(s => s.ping !== undefined && s.ping < MAX_ACCEPTABLE_PING);
      return goodServers.length > 0 ? 
        goodServers.sort((a, b) => (a.ping || Infinity) - (b.ping || Infinity)) :
        serversWithPing.sort((a, b) => (a.ping || Infinity) - (b.ping || Infinity));
    }
    // Inicial: retorna sem ping
    return servers;
  } catch (error) {
    throw error;
  }
}

// Novo tipo para armazenar medições de latência
interface LatencyMeasurement {
  value: number;
  time: number;
}

export async function measureLatency(url: string, singleSample = false): Promise<number> {
  const measurements: LatencyMeasurement[] = [];
  const startTime = performance.now();
  let lastMeasurementTime = 0;
  const samplesToMeasure = singleSample ? 1 : 5;

  // Tenta obter o IP
  const ip = await getIpFromUrl(url);
  let pingUrl = url;
  if (ip) {
    // Substitui hostname pelo IP na URL
    try {
      const u = new URL(url);
      u.hostname = ip;
      pingUrl = u.toString();
    } catch {}
  }

  // Função para uma única medição
  const takeMeasurement = async (): Promise<LatencyMeasurement | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);
    try {
      const start = performance.now();
      await fetch(pingUrl, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          // Host header para SNI
          ...(ip ? { Host: extractHostname(url) || '' } : {})
        }
      });
      const end = performance.now();
      clearTimeout(timeoutId);
      return {
        value: end - start,
        time: end
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Se falhar com IP, tenta hostname (DNS)
      if (ip && err.name !== 'AbortError') {
        try {
          const start = performance.now();
          await fetch(url, {
            method: 'HEAD',
            cache: 'no-store',
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          const end = performance.now();
          return {
            value: end - start,
            time: end
          };
        } catch {}
      }
      if (err.name === 'AbortError') return null;
      return null;
    }
  };


  // Coleta medições até ter amostras suficientes ou timeout
  while (performance.now() - startTime < TEST_DURATION && measurements.length < samplesToMeasure) {
    const now = performance.now();
    if (now - lastMeasurementTime >= LATENCY_MEASUREMENTS_FREQUENCY_MS) {
      const measurement = await takeMeasurement();
      if (measurement) {
        measurements.push(measurement);
        lastMeasurementTime = now;
        if (singleSample && measurements.length === 1) {
          return Math.round(measurement.value);
        }
      }
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Se não conseguiu estabilizar, retorna média das medições válidas
  return measurements.length > 0 ? 
    Math.round(measurements.reduce((a, b) => a + b.value, 0) / measurements.length) : 
    Infinity;
}

async function measureDownloadSpeed(
  url: string, 
  onProgress: (speed: number) => void
): Promise<number> {
  const startTime = performance.now();
  let totalBytes = 0;
  let lastUpdate = startTime;
  const speedSamples: number[] = [];
  let isStable = false;

  try {
    const downloadPromises = Array.from({ length: PARALLEL_CONNECTIONS }).map(async () => {
      while (performance.now() - startTime < TEST_DURATION && !isStable) {
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          keepalive: true,
          headers: {
            'Cache-Control': 'no-cache,no-store,must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        const reader = response.body?.getReader();
        if (!reader) continue;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            totalBytes += value.length;
            const now = performance.now();
            
            if (now - lastUpdate > UPDATE_THROTTLE_MS) {
              const currentDuration = (now - startTime) / 1000;
              const currentSpeed = (totalBytes * 8) / (currentDuration * 1000000);
              const roundedSpeed = Math.round(currentSpeed * 100) / 100;
              
              onProgress(roundedSpeed);
              speedSamples.push(roundedSpeed);
              
              // Verifica estabilidade após tempo mínimo
              if (now - startTime > MIN_TEST_DURATION && speedSamples.length >= STABILITY_SAMPLES) {
                const recentSamples = speedSamples.slice(-STABILITY_SAMPLES);
                const avg = recentSamples.reduce((a, b) => a + b) / recentSamples.length;
                const isStableSpeed = recentSamples.every(speed => 
                  Math.abs(speed - avg) / avg <= STABILITY_THRESHOLD
                );
                
                if (isStableSpeed) {
                  isStable = true;
                  break;
                }
              }
              
              lastUpdate = now;
            }
          }
        } finally {
          reader.cancel();
        }
        
        if (isStable) break;
      }
    });

    await Promise.all(downloadPromises);
    const durationInSeconds = (performance.now() - startTime) / 1000;
    const finalSpeed = (totalBytes * 8) / (durationInSeconds * 1000000);
    
    // Retorna a média das últimas amostras estáveis
    if (speedSamples.length >= STABILITY_SAMPLES) {
      const recentSamples = speedSamples.slice(-STABILITY_SAMPLES);
      return recentSamples.reduce((a, b) => a + b) / recentSamples.length;
    }
    
    return finalSpeed;
  } catch (error) {
    return 0;
  }
}

async function measureUploadSpeed(
  url: string,
  onProgress: (speed: number) => void
): Promise<number> {
  const startTime = performance.now();
  let totalBytesSent = 0;
  let lastUpdate = startTime;
  const speedSamples: number[] = [];
  let isStable = false;
  let shouldStop = false;

  // Configura timeout global
  setTimeout(() => {
    shouldStop = true;
  }, TEST_DURATION);

  try {
    const uploadPromises = Array.from({ length: PARALLEL_CONNECTIONS }).map(async () => {
      while (!shouldStop && !isStable) {
        const blob = generateRandomData(CHUNK_SIZE);
        
        const response = await fetch(url, {
          method: 'POST',
          body: blob,
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        });

        if (!response.ok) continue;
        totalBytesSent += CHUNK_SIZE;
        
        const now = performance.now();
        if (now - lastUpdate > UPDATE_THROTTLE_MS) {
          const currentDuration = (now - startTime) / 1000;
          const currentSpeed = (totalBytesSent * 8) / (currentDuration * 1000000);
          const roundedSpeed = Math.round(currentSpeed * 100) / 100;

          onProgress(roundedSpeed);
          speedSamples.push(roundedSpeed);

          // Verifica estabilidade após tempo mínimo
          if (now - startTime > MIN_TEST_DURATION && speedSamples.length >= STABILITY_SAMPLES) {
            const recentSamples = speedSamples.slice(-STABILITY_SAMPLES);
            const avg = recentSamples.reduce((a, b) => a + b) / recentSamples.length;
            
            const isStableSpeed = recentSamples.every(speed =>
              Math.abs(speed - avg) / avg <= STABILITY_THRESHOLD
            );

            if (isStableSpeed) {
              isStable = true;
              break;
            }
          }

          lastUpdate = now;
        }
      }
    });

    await Promise.all(uploadPromises);
    
    // Calcula velocidade final usando amostras estáveis
    if (speedSamples.length >= STABILITY_SAMPLES) {
      const recentSamples = speedSamples.slice(-STABILITY_SAMPLES);
      return recentSamples.reduce((a, b) => a + b) / recentSamples.length;
    }

    // Fallback para cálculo tradicional
    const duration = (performance.now() - startTime) / 1000;
    return (totalBytesSent * 8) / (duration * 1000000);
  } catch (error) {
    return 0;
  }
}

// Cache de dados para reutilização (evita regeneração constante)
let cachedDataBlob: Blob | null = null;
let cachedDataSize = 0;

function generateRandomData(size: number): Blob {
  // Reutiliza cache se mesmo tamanho
  if (cachedDataBlob && cachedDataSize === size) {
    return cachedDataBlob;
  }
  
  const array = new Uint8Array(size);
  
  // Usa crypto.getRandomValues quando disponível (muito mais rápido)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Preenche em chunks de 65536 bytes (limite do crypto.getRandomValues)
    const chunkSize = 65536;
    for (let i = 0; i < size; i += chunkSize) {
      const chunk = array.subarray(i, Math.min(i + chunkSize, size));
      crypto.getRandomValues(chunk);
    }
  } else {
    // Fallback: preenche com padrão repetido (muito mais rápido que Math.random)
    const pattern = new Uint8Array([0x00, 0xFF, 0xAA, 0x55]);
    for (let i = 0; i < size; i++) {
      array[i] = pattern[i % pattern.length];
    }
  }
  
  cachedDataBlob = new Blob([array]);
  cachedDataSize = size;
  return cachedDataBlob;
}

export async function runSpeedTest(
  server: TestServer,
  onProgress: (phase: 'ping' | 'download' | 'upload', value: number) => void
): Promise<SpeedTestResult> {
  try {
    // Measure ping first
    onProgress('ping', 0);
    const ping = await measureLatency(server.url);
    onProgress('ping', ping);

    // Then download
    onProgress('download', 0);
    const download = await measureDownloadSpeed(server.url, (speed) => {
      onProgress('download', speed);
    });

    // Finally upload
    onProgress('upload', 0);
    const upload = await measureUploadSpeed(server.url, (speed) => {
      onProgress('upload', speed);
    });

    return {
      download: Math.round(download * 100) / 100,
      upload: Math.round(upload * 100) / 100,
      ping: Math.round(ping)
    };
  } catch (error) {
    throw error;
  }
}