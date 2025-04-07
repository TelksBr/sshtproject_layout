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
}

const FAST_API_URL = 'https://api.fast.com/netflix/speedtest/v2?https=true&token=YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm&urlCount=10';
const TEST_DURATION = 10000;
const PING_TIMEOUT = 2000;
const MAX_ACCEPTABLE_PING = 200; // ms
const PARALLEL_CONNECTIONS = 8; // Aumentado para 8 conexões simultâneas
const CHUNK_SIZE = 26214400; // 25MB em bytes
const STABILITY_THRESHOLD = 0.1; // 10% de variação máxima
const STABILITY_SAMPLES = 5; // Número de amostras para confirmar estabilidade
const MIN_TEST_DURATION = 5000; // Mínimo de 5 segundos de teste
const LATENCY_MEASUREMENTS_FREQUENCY_MS = 1000; // Intervalo entre medições
const LATENCY_WINDOW_SIZE = 5; // Tamanho da janela para média móvel
const MIN_LATENCY_MEASUREMENTS = 3; // Mínimo de medições para considerar estável

function decodeSpecialCharacters(text: string): string {
  try {
    // Decodifica usando diretamente ISO-8859-1 (Latin-1)
    const bytes = new Uint8Array([...text].map(c => c.charCodeAt(0) & 0xFF));
    return new TextDecoder('iso-8859-1').decode(bytes);
  } catch {
    return text; // Fallback para o texto original em caso de erro
  }
}

export async function getSpeedTestServers(): Promise<TestServer[]> {
  try {
    const response = await fetch(FAST_API_URL);
    if (!response.ok) throw new Error('Failed to fetch speed test servers');
    
    const rawText = await response.text();
    const data: FastAPIResponse = JSON.parse(rawText);
    
    const serversWithPing = await Promise.all(
      data.targets.map(async server => ({
        ...server,
        location: {
          city: decodeSpecialCharacters(server.location.city),
          country: decodeSpecialCharacters(server.location.country)
        },
        ping: await measureLatency(server.url)
      }))
    );

    // Filtra servidores com ping aceitável
    const goodServers = serversWithPing.filter(s => 
      s.ping !== undefined && 
      s.ping < MAX_ACCEPTABLE_PING
    );

    return goodServers.length > 0 ? 
      goodServers.sort((a, b) => (a.ping || Infinity) - (b.ping || Infinity)) :
      serversWithPing.sort((a, b) => (a.ping || Infinity) - (b.ping || Infinity));
  } catch (error) {
    console.error('Error fetching speed test servers:', error);
    throw error;
  }
}

// Novo tipo para armazenar medições de latência
interface LatencyMeasurement {
  value: number;
  time: number;
}

async function measureLatency(url: string): Promise<number> {
  const measurements: LatencyMeasurement[] = [];
  const startTime = performance.now();
  let lastMeasurementTime = 0;

  // Função para uma única medição
  const takeMeasurement = async (): Promise<LatencyMeasurement | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);
      
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
      clearTimeout(timeoutId);
      
      return {
        value: end - start,
        time: end
      };
    } catch {
      return null;
    }
  };

  // Função para calcular média das últimas medições
  const calculateAverage = (measurements: LatencyMeasurement[]): number => {
    const recentMeasurements = measurements
      .slice(-LATENCY_WINDOW_SIZE)
      .map(m => m.value)
      .sort((a, b) => a - b);

    // Remove outliers se tivermos medições suficientes
    if (recentMeasurements.length >= 4) {
      recentMeasurements.pop(); // Remove maior
      recentMeasurements.shift(); // Remove menor
    }

    return recentMeasurements.reduce((a, b) => a + b, 0) / recentMeasurements.length;
  };

  // Coleta medições até ter amostras suficientes ou timeout
  while (performance.now() - startTime < TEST_DURATION) {
    const now = performance.now();
    
    // Respeita o intervalo entre medições
    if (now - lastMeasurementTime >= LATENCY_MEASUREMENTS_FREQUENCY_MS) {
      const measurement = await takeMeasurement();
      
      if (measurement) {
        measurements.push(measurement);
        lastMeasurementTime = now;

        // Verifica se temos medições suficientes e estáveis
        if (measurements.length >= MIN_LATENCY_MEASUREMENTS) {
          const avg = calculateAverage(measurements);
          const isStable = measurements
            .slice(-MIN_LATENCY_MEASUREMENTS)
            .every(m => Math.abs(m.value - avg) / avg <= STABILITY_THRESHOLD);

          if (isStable) {
            return Math.round(avg);
          }
        }
      }
    }

    // Pequena pausa para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Se não conseguiu estabilizar, retorna média das medições válidas
  return measurements.length > 0 ? 
    Math.round(calculateAverage(measurements)) : 
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
            
            if (now - lastUpdate > 200) {
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
    console.error('Erro ao medir a velocidade do download:', error);
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
        if (now - lastUpdate > 200) {
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
    console.error('Erro ao medir a velocidade de upload:', error);
    return 0;
  }
}

function generateRandomData(size: number): Blob {
  const array = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return new Blob([array]);
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
    console.error('Speed test failed:', error);
    throw error;
  }
}