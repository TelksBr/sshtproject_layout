
import { Download, Upload } from 'lucide-react';
import { useNetworkStats } from '../hooks/useNetworkStats';

export function NetworkStats() {
  const {
    downloadSpeed,
    uploadSpeed,
    formattedTotalDownloaded,
    formattedTotalUploaded
  } = useNetworkStats();

  return (
    <section className="w-full max-w-md mx-auto p-4 rounded-2xl bg-gradient-to-br from-[#26074d]/60 to-[#3a0a7a]/40 border border-[#6205D5]/30 shadow-lg backdrop-blur-md flex flex-col gap-3">
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-center gap-1.5 text-[#b0a8ff]">
            <Download className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Download</span>
          </div>
          <span className="text-[#b0a8ff] font-mono text-lg font-bold drop-shadow">
            {downloadSpeed}
          </span>
          <span className="text-xs text-[#b0a8ff]/70 mt-1">Total: {formattedTotalDownloaded}</span>
        </div>
        <div className="w-px h-12 bg-gradient-to-b from-[#b0a8ff]/30 to-transparent mx-2" />
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-center gap-1.5 text-[#b0a8ff]">
            <Upload className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Upload</span>
          </div>
          <span className="text-[#b0a8ff] font-mono text-lg font-bold drop-shadow">
            {uploadSpeed}
          </span>
          <span className="text-xs text-[#b0a8ff]/70 mt-1">Total: {formattedTotalUploaded}</span>
        </div>
      </div>
    </section>
  );
}