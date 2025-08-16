import { useState, useEffect, useRef } from 'react';
import { getDownloadBytes, getUploadBytes } from '../utils';
import { APP_CONFIG } from '../constants';

/**
 * Hook para estatísticas de rede com polling próprio.
 * Conforme padrão documentado, faz seu próprio polling para estatísticas.
 */
export function useNetworkStats() {
  const [stats, setStats] = useState({
    downloadSpeed: '0 B/s',
    uploadSpeed: '0 B/s',
    totalDownloaded: 0,
    totalUploaded: 0,
  });

  const previousStatsRef = useRef({
    downloadBytes: 0,
    uploadBytes: 0,
    timestamp: Date.now(),
  });

  useEffect(() => {
    const updateStats = () => {
      const currentDownload = getDownloadBytes();
      const currentUpload = getUploadBytes();
      const now = Date.now();
      const timeDiff = now - previousStatsRef.current.timestamp;

      if (timeDiff > 0) {
        const downloadSpeed = ((currentDownload - previousStatsRef.current.downloadBytes) / timeDiff) * 1000;
        const uploadSpeed = ((currentUpload - previousStatsRef.current.uploadBytes) / timeDiff) * 1000;

        setStats({
          downloadSpeed: formatBytes(downloadSpeed),
          uploadSpeed: formatBytes(uploadSpeed),
          totalDownloaded: currentDownload,
          totalUploaded: currentUpload,
        });

        previousStatsRef.current = {
          downloadBytes: currentDownload,
          uploadBytes: currentUpload,
          timestamp: now,
        };
      }
    };

    // Atualiza a cada 2 segundos
    const interval = setInterval(updateStats, APP_CONFIG.POLLING_INTERVALS.NETWORK_STATS);
    
    // Primeira atualização imediata
    updateStats();

    return () => clearInterval(interval);
  }, []); // Fix: dependências vazias para evitar loop infinito

  return {
    downloadSpeed: stats.downloadSpeed,
    uploadSpeed: stats.uploadSpeed,
    totalDownloaded: stats.totalDownloaded,
    totalUploaded: stats.totalUploaded,
    formattedTotalDownloaded: formatBytes(stats.totalDownloaded),
    formattedTotalUploaded: formatBytes(stats.totalUploaded),
  };
}

// Mantém as funções utilitárias
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}