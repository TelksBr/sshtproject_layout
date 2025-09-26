
import { memo } from 'react';
import { Download, Upload } from 'lucide-react';
import { useNetworkStatsGlobal } from '../hooks/useGlobalPolling';

const NetworkStats = memo(function NetworkStats() {
  const {
    downloadSpeed,
    uploadSpeed,
    formattedTotalDownloaded,
    formattedTotalUploaded
  } = useNetworkStatsGlobal();

  return (
    <section className="w-full max-w-md md:max-w-xl lg:max-w-xs lg:w-full mx-auto p-4 md:p-6 lg:p-3 network-stats-mobile-landscape rounded-2xl lg:rounded-xl bg-gradient-to-br from-[#26074d]/60 to-[#3a0a7a]/40 border border-[#6205D5]/30 shadow-lg backdrop-blur-md flex flex-col gap-3 md:gap-6 lg:gap-3 lg:mt-4 lg:sticky lg:top-4">
      {/* Título para landscape */}
      <div className="hidden lg:block text-center mb-2">
        <h3 className="text-[#b0a8ff] text-sm font-semibold uppercase tracking-wide">Estatísticas</h3>
      </div>
      
      <div className="flex justify-between items-center gap-4 md:gap-8 lg:gap-3 lg:flex-col lg:items-stretch">
        <div className="flex flex-col items-center flex-1 lg:flex-col lg:items-center lg:bg-[#6205D5]/8 lg:p-3 lg:rounded-lg lg:border lg:border-[#6205D5]/20">
          <div className="flex items-center gap-1.5 text-[#b0a8ff] lg:mb-2">
            <Download className="w-5 h-5 md:w-6 md:h-6 lg:w-4 lg:h-4" />
            <span className="text-xs md:text-sm lg:text-xs font-semibold uppercase tracking-wide">Download</span>
          </div>
          <div className="flex flex-col lg:flex-col lg:items-center lg:gap-1">
            <span className="text-[#b0a8ff] font-mono text-lg md:text-2xl lg:text-lg font-bold drop-shadow text-center">
              {downloadSpeed}
            </span>
            <span className="text-xs md:text-sm lg:text-xs text-[#b0a8ff]/70 mt-1 lg:mt-0 text-center">Total: {formattedTotalDownloaded}</span>
          </div>
        </div>
        
        <div className="w-px h-12 md:h-16 lg:w-full lg:h-px bg-gradient-to-b lg:bg-gradient-to-r from-[#b0a8ff]/30 to-transparent mx-2 lg:mx-0 lg:my-2" />
        
        <div className="flex flex-col items-center flex-1 lg:flex-col lg:items-center lg:bg-[#6205D5]/8 lg:p-3 lg:rounded-lg lg:border lg:border-[#6205D5]/20">
          <div className="flex items-center gap-1.5 text-[#b0a8ff] lg:mb-2">
            <Upload className="w-5 h-5 md:w-6 md:h-6 lg:w-4 lg:h-4" />
            <span className="text-xs md:text-sm lg:text-xs font-semibold uppercase tracking-wide">Upload</span>
          </div>
          <div className="flex flex-col lg:flex-col lg:items-center lg:gap-1">
            <span className="text-[#b0a8ff] font-mono text-lg md:text-2xl lg:text-lg font-bold drop-shadow text-center">
              {uploadSpeed}
            </span>
            <span className="text-xs md:text-sm lg:text-xs text-[#b0a8ff]/70 mt-1 lg:mt-0 text-center">Total: {formattedTotalUploaded}</span>
          </div>
        </div>
      </div>
    </section>
  );
});

export { NetworkStats };
export default NetworkStats;