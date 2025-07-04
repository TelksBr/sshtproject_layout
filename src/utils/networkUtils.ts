/**
 * Formata bytes em string legível (ex: 1.23 MB/s).
 * @param bytes Quantidade de bytes por segundo
 * @param decimals Casas decimais
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B/s';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Calcula a velocidade de bytes por segundo.
 * @param currentBytes Valor atual de bytes
 * @param previousBytes Valor anterior de bytes
 * @param interval Intervalo em ms
 */
export function calculateSpeed(currentBytes: number, previousBytes: number, interval: number): number {
  return (currentBytes - previousBytes) / (interval / 1000);
}