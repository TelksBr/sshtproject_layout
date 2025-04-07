import { useState, useEffect } from 'react';
import { getDownloadBytes, getUploadBytes } from '../utils/appFunctions';
import { formatBytes, calculateSpeed } from '../utils/networkUtils';

export function useNetworkStats(pollInterval = 1000) {
  const [downloadSpeed, setDownloadSpeed] = useState('0 B/s');
  const [uploadSpeed, setUploadSpeed] = useState('0 B/s');
  const [totalDownloaded, setTotalDownloaded] = useState(0);
  const [totalUploaded, setTotalUploaded] = useState(0);

  useEffect(() => {
    let previousDownload = getDownloadBytes();
    let previousUpload = getUploadBytes();
    let lastUpdate = Date.now();

    const interval = setInterval(() => {
      const currentDownload = getDownloadBytes();
      const currentUpload = getUploadBytes();
      const now = Date.now();
      const timeDiff = now - lastUpdate;

      // Calculate speeds
      const downloadSpeed = calculateSpeed(currentDownload, previousDownload, timeDiff);
      const uploadSpeed = calculateSpeed(currentUpload, previousUpload, timeDiff);

      // Update states
      setDownloadSpeed(formatBytes(downloadSpeed));
      setUploadSpeed(formatBytes(uploadSpeed));
      setTotalDownloaded(currentDownload);
      setTotalUploaded(currentUpload);

      // Update previous values
      previousDownload = currentDownload;
      previousUpload = currentUpload;
      lastUpdate = now;
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval]);

  return {
    downloadSpeed,
    uploadSpeed,
    totalDownloaded,
    totalUploaded,
    formattedTotalDownloaded: formatBytes(totalDownloaded),
    formattedTotalUploaded: formatBytes(totalUploaded)
  };
}