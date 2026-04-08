
import { memo } from 'react';
import { Download, Upload } from '../utils/icons';
import { useNetworkStatsGlobal } from '../hooks/useGlobalPolling';

const NetworkStats = memo(function NetworkStats() {
  const {
    downloadSpeed,
    uploadSpeed,
    formattedTotalDownloaded,
    formattedTotalUploaded
  } = useNetworkStatsGlobal();

  return (
    <section className="
      w-full p-4 rounded-xl
      bg-gradient-to-br from-[#26074d]/60 to-[#3a0a7a]/40
      border border-[#6205D5]/30 shadow-lg
      flex flex-col gap-4
    ">
      {/* Título */}
      <div className="text-center pb-2 border-b border-[#6205D5]/20">
        <h3 className="text-[#b0a8ff] text-sm lg:text-base font-semibold uppercase tracking-wide">Estatísticas</h3>
      </div>
      
      <div className="flex justify-between items-center gap-4 lg:flex-col">
        {/* Download */}
        <div className="flex flex-col items-center flex-1 lg:w-full lg:bg-[#6205D5]/8 lg:p-4 lg:rounded-xl lg:border lg:border-[#6205D5]/20">
          <div className="flex items-center gap-2 text-[#b0a8ff] mb-2">
            <Download className="w-5 h-5" />
            <span className="text-xs lg:text-sm font-semibold uppercase tracking-wide">Download</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[#b0a8ff] font-mono text-xl lg:text-2xl font-bold drop-shadow">
              {downloadSpeed}
            </span>
            <span className="text-xs text-[#b0a8ff]/70">Total: {formattedTotalDownloaded}</span>
          </div>
        </div>
        
        {/* Separador */}
        <div className="w-px h-12 lg:w-full lg:h-px bg-gradient-to-b lg:bg-gradient-to-r from-[#b0a8ff]/30 via-[#b0a8ff]/50 to-[#b0a8ff]/30" />
        
        {/* Upload */}
        <div className="flex flex-col items-center flex-1 lg:w-full lg:bg-[#6205D5]/8 lg:p-4 lg:rounded-xl lg:border lg:border-[#6205D5]/20">
          <div className="flex items-center gap-2 text-[#b0a8ff] mb-2">
            <Upload className="w-5 h-5" />
            <span className="text-xs lg:text-sm font-semibold uppercase tracking-wide">Upload</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[#b0a8ff] font-mono text-xl lg:text-2xl font-bold drop-shadow">
              {uploadSpeed}
            </span>
            <span className="text-xs text-[#b0a8ff]/70">Total: {formattedTotalUploaded}</span>
          </div>
        </div>
      </div>
    </section>
  );
});

export { NetworkStats };
export default NetworkStats;