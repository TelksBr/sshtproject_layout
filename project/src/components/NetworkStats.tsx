import React from 'react';
import { Download, Upload } from 'lucide-react';
import { useNetworkStats } from '../hooks/useNetworkStats';

export function NetworkStats() {
  const { downloadSpeed, uploadSpeed } = useNetworkStats();

  return (
    <section className="grid grid-cols-2 gap-3 p-3 mt-auto rounded-lg bg-[#26074d]/30 border border-[#6205D5]/20 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1.5 text-[#b0a8ff]">
          <Download className="w-4 h-4" />
          <span className="text-xs font-medium">Download</span>
        </div>
        <span className="text-[#b0a8ff] font-mono text-sm">
          {downloadSpeed}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1.5 text-[#b0a8ff]">
          <Upload className="w-4 h-4" />
          <span className="text-xs font-medium">Upload</span>
        </div>
        <span className="text-[#b0a8ff] font-mono text-sm">
          {uploadSpeed}
        </span>
      </div>
    </section>
  );
}