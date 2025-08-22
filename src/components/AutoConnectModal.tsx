import { useState, useEffect, Fragment } from 'react';
import { Modal } from './modals/Modal';
import { RefreshCw, CheckCircle, XCircle, Wifi, AlertCircle, Settings, Zap, Play, Square } from 'lucide-react';
import { TestLog } from '../hooks/useAutoConnect';
import { AutoConnectConfig } from '../utils/autoConnectUtils';
import { getAllConfigs } from '../utils/appFunctions';

interface AutoConnectModalProps {
  open: boolean;
  onClose: () => void;
  currentConfigName: string | null;
  totalConfigs: number;
  testedConfigs: number;
  successConfigName: string | null;
  running: boolean;
  onStart: () => void;
  onCancel?: () => void;
  error?: string | null;
  logs?: TestLog[];
  currentTestDuration?: number;
  autoConnectConfig: AutoConnectConfig;
  setAutoConnectConfig: (config: AutoConnectConfig) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

export function AutoConnectModal({
  open,
  onClose,
  currentConfigName,
  totalConfigs,
  testedConfigs,
  successConfigName,
  running,
  onStart,
  onCancel,
  error,
  logs = [],
  currentTestDuration = 0,
  autoConnectConfig,
  setAutoConnectConfig,
  showSettings,
  setShowSettings,
}: AutoConnectModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'config'>('status');
  
  if (!open) return null;

  // Obter todas as categorias e configurações disponíveis
  const allConfigs = getAllConfigs();
  const categories = allConfigs.reduce((acc: any[], category) => {
    if (!acc.find(c => c.id === category.id)) {
      acc.push({
        id: category.id,
        name: category.name,
        color: category.color || '#6205D5'
      });
    }
    return acc;
  }, []);

  // Calcular total de configurações baseado nos filtros atuais
  const allConfigsFlat = allConfigs.flatMap(category => 
    category.items.map(item => ({
      ...item,
      category_id: category.id
    }))
  );

  // Aplicar filtros do autoConnectConfig para obter o total correto
  let filteredConfigsForTotal = allConfigsFlat;
  
  // Filtro por categoria
  if (autoConnectConfig.selectedCategories.length > 0) {
    filteredConfigsForTotal = filteredConfigsForTotal.filter(config => 
      autoConnectConfig.selectedCategories.includes(config.category_id)
    );
  }
  
  // Filtro por tipo de configuração
  if (autoConnectConfig.configType !== 'all') {
    filteredConfigsForTotal = filteredConfigsForTotal.filter(config => {
      const mode = config.mode?.toLowerCase() || '';
      if (autoConnectConfig.configType === 'ssh') {
        return mode.includes('ssh') || mode.includes('proxy') || mode.includes('socks');
      } else if (autoConnectConfig.configType === 'v2ray') {
        return mode.includes('v2ray') || mode.includes('vmess') || mode.includes('vless');
      }
      return true;
    });
  }

  // Usar o total calculado localmente se for maior que o recebido via props
  const actualTotalConfigs = Math.max(totalConfigs, filteredConfigsForTotal.length);
  const progressPercentage = actualTotalConfigs > 0 ? (testedConfigs / actualTotalConfigs) * 100 : 0;
  const isCompleted = !running && testedConfigs > 0;

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const updateConfig = (updates: Partial<AutoConnectConfig>) => {
    setAutoConnectConfig({ ...autoConnectConfig, ...updates });
  };

  const toggleCategory = (categoryId: number) => {
    const current = autoConnectConfig.selectedCategories;
    const updated = current.includes(categoryId)
      ? current.filter(id => id !== categoryId)
      : [...current, categoryId];
    updateConfig({ selectedCategories: updated });
  };

  return (
    <Modal 
      onClose={onClose} 
      title="Teste Automático" 
      icon={Zap}
    >
      <div className="w-full max-w-md mx-auto p-4">
        
        {/* Status Principal - Compacto */}
        <div className="mb-6">
          <div className={`relative rounded-xl p-4 border-2 transition-all duration-500 ${
            running 
              ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-400/40' 
              : successConfigName 
                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/40'
                : error
                  ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-400/40'
                  : 'bg-gradient-to-r from-[#6205D5]/10 to-[#26074d]/20 border-[#6205D5]/30'
          }`}>
            
            {/* Progress Ring Menor */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                  <circle
                    cx="24" cy="24" r="20"
                    fill="none" stroke="currentColor" strokeWidth="3"
                    className="text-[#26074d] opacity-20"
                  />
                  <circle
                    cx="24" cy="24" r="20"
                    fill="none" stroke="currentColor" strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressPercentage / 100)}`}
                    className={`transition-all duration-700 ease-out ${
                      running ? 'text-blue-400' : successConfigName ? 'text-green-400' : 'text-[#6205D5]'
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {running ? (
                    <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                  ) : successConfigName ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : error ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <Zap className="w-5 h-5 text-[#6205D5]" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white truncate mb-1">
                  {running ? 'Testando...' : successConfigName ? '🎉 Conectado!' : error ? '❌ Erro' : 'Pronto'}
                </h3>
                
                <p className="text-xs text-[#b0a8ff]/70 mb-2 truncate">
                  {running && currentConfigName 
                    ? currentConfigName
                    : successConfigName 
                      ? successConfigName
                      : error
                        ? 'Verifique as configurações'
                        : `${actualTotalConfigs} configs encontradas`
                  }
                </p>
                
                {/* Progress Bar Compacto */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#26074d]/60 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        running ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 
                        successConfigName ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 
                        'bg-gradient-to-r from-[#6205D5] to-[#7c4dff]'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white min-w-[2.5rem] text-right">
                    {testedConfigs}/{actualTotalConfigs}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message Compacto */}
        {successConfigName && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/40 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-green-400 text-sm">Conectado!</h4>
                <p className="text-green-300 text-xs truncate">{successConfigName}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message Compacto */}
        {error && (
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/40 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-red-400 text-sm">Erro</h4>
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation Simplificada */}
        <div className="flex bg-[#26074d]/40 rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md font-medium transition-all duration-300 text-sm ${
              activeTab === 'status' 
                ? 'bg-[#6205D5] text-white' 
                : 'text-[#b0a8ff]/70 hover:bg-[#6205D5]/20'
            }`}
          >
            <Zap className="w-4 h-4" />
            Status
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md font-medium transition-all duration-300 text-sm ${
              activeTab === 'config' 
                ? 'bg-[#6205D5] text-white' 
                : 'text-[#b0a8ff]/70 hover:bg-[#6205D5]/20'
            }`}
          >
            <Settings className="w-4 h-4" />
            Config
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          
          {/* STATUS TAB */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              
              {/* Running Status Compacto */}
              {running && (
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/40 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                    <span className="text-blue-400 font-medium text-sm">Testando...</span>
                    {running && (
                      <div className="ml-auto px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full font-mono">
                        {formatDuration(currentTestDuration)}
                      </div>
                    )}
                  </div>
                  {currentConfigName && (
                    <p className="text-blue-300 text-xs truncate">{currentConfigName}</p>
                  )}
                </div>
              )}

              {/* Stats Compactos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#26074d]/40 rounded-lg p-3 border border-[#6205D5]/20">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-[#6205D5]" />
                    <div>
                      <p className="text-[#b0a8ff]/70 text-xs">Total</p>
                      <p className="text-white font-bold">{actualTotalConfigs}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#26074d]/40 rounded-lg p-3 border border-[#6205D5]/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <div>
                      <p className="text-[#b0a8ff]/70 text-xs">Testadas</p>
                      <p className="text-white font-bold">{testedConfigs}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logs Simplificados - Apenas últimos 3 */}
              {logs.length > 0 && (
                <div className="bg-[#26074d]/40 rounded-lg p-3 border border-[#6205D5]/20">
                  <h4 className="font-medium text-[#b0a8ff] mb-2 text-sm">Últimos Testes</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {logs.slice(-3).reverse().map((log) => (
                      <div key={log.id} className="flex items-center gap-2 text-xs">
                        <div className="flex-shrink-0">
                          {log.status === 'success' && <CheckCircle className="w-3 h-3 text-green-400" />}
                          {log.status === 'failed' && <XCircle className="w-3 h-3 text-red-400" />}
                          {log.status === 'connecting' && <Wifi className="w-3 h-3 text-blue-400" />}
                          {log.status === 'testing' && <RefreshCw className="w-3 h-3 text-yellow-400 animate-spin" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[#b0a8ff] truncate">{log.configName}</div>
                        </div>
                        {log.duration && (
                          <div className="text-[#b0a8ff]/50 font-mono text-xs">
                            {formatDuration(log.duration)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {!running ? (
                  <button
                    onClick={onStart}
                    className="flex-1 bg-gradient-to-r from-[#6205D5] to-[#7c4dff] hover:from-[#7c4dff] hover:to-[#9575ff] text-white py-3 px-4 rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Play className="w-4 h-4" />
                    {isCompleted ? 'Testar Novamente' : 'Iniciar'}
                  </button>
                ) : (
                  <button
                    onClick={onCancel}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Square className="w-4 h-4" />
                    Parar
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  disabled={running}
                  className="px-4 py-3 bg-[#26074d]/80 hover:bg-[#6205D5]/20 disabled:bg-gray-700/50 text-[#b0a8ff] hover:text-white disabled:text-gray-400 rounded-lg border border-[#6205D5]/30 font-medium transition-all duration-300 active:scale-95 disabled:scale-100"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}

          {/* CONFIG TAB */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              
              {/* Connection Type - Compacto */}
              <div className="bg-[#26074d]/40 rounded-lg p-3 border border-[#6205D5]/20">
                <h4 className="font-medium text-[#b0a8ff] mb-3 text-sm">Tipo de Config</h4>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'Todas', icon: '🌐' },
                    { value: 'ssh', label: 'SSH/Proxy', icon: '🔐' },
                    { value: 'v2ray', label: 'V2Ray', icon: '🚀' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateConfig({ configType: option.value as 'all' | 'ssh' | 'v2ray' })}
                      className={`w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3 ${
                        autoConnectConfig.configType === option.value 
                          ? 'bg-[#6205D5] text-white' 
                          : 'bg-[#26074d]/40 text-[#b0a8ff] hover:bg-[#6205D5]/20'
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{option.label}</div>
                      </div>
                      {autoConnectConfig.configType === option.value && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeouts Simplificados */}
              <div className="bg-[#26074d]/40 rounded-lg p-3 border border-[#6205D5]/20">
                <h4 className="font-medium text-[#b0a8ff] mb-3 text-sm">Tempos Limite</h4>
                <div className="space-y-4">
                  
                  {/* Connection Timeout */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[#b0a8ff] text-sm">Conexão</span>
                      <span className="bg-[#6205D5]/20 text-[#6205D5] px-2 py-1 rounded-full font-mono text-xs">
                        {(autoConnectConfig.connectionTimeout / 1000).toFixed(0)}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5000"
                      max="15000"
                      step="2500"
                      value={autoConnectConfig.connectionTimeout}
                      onChange={(e) => updateConfig({ connectionTimeout: parseInt(e.target.value) })}
                      className="w-full h-2 bg-[#26074d] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  {/* Fetch Timeout */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[#b0a8ff] text-sm">Internet</span>
                      <span className="bg-[#6205D5]/20 text-[#6205D5] px-2 py-1 rounded-full font-mono text-xs">
                        {(autoConnectConfig.fetchTimeout / 1000).toFixed(0)}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2000"
                      max="8000"
                      step="1000"
                      value={autoConnectConfig.fetchTimeout}
                      onChange={(e) => updateConfig({ fetchTimeout: parseInt(e.target.value) })}
                      className="w-full h-2 bg-[#26074d] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Categories Simplificadas */}
              <div className="bg-[#26074d]/40 rounded-lg p-3 border border-[#6205D5]/20">
                <h4 className="font-medium text-[#b0a8ff] mb-3 text-sm">Categorias</h4>
                
                {/* All Categories Button */}
                <button
                  onClick={() => updateConfig({ selectedCategories: [] })}
                  className={`w-full p-2 rounded-lg text-left transition-all duration-200 font-medium mb-2 text-sm ${
                    autoConnectConfig.selectedCategories.length === 0 
                      ? 'bg-[#6205D5] text-white' 
                      : 'bg-[#26074d]/40 text-[#b0a8ff] hover:bg-[#6205D5]/20'
                  }`}
                >
                  🌐 Todas ({categories.length})
                </button>
                
                {/* Individual Categories - Máximo 4 visíveis */}
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {categories.slice(0, 6).map((category) => (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`w-full p-2 rounded-lg text-left transition-all duration-200 flex items-center gap-2 text-sm ${
                        autoConnectConfig.selectedCategories.includes(category.id) 
                          ? 'bg-[#6205D5] text-white' 
                          : 'bg-[#26074d]/40 text-[#b0a8ff] hover:bg-[#6205D5]/20'
                      }`}
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="flex-1 min-w-0 truncate font-medium">{category.name}</span>
                      {autoConnectConfig.selectedCategories.includes(category.id) && (
                        <CheckCircle className="w-3 h-3 flex-shrink-0 text-white" />
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Info de seleção */}
                <div className="mt-2 text-xs text-[#b0a8ff]/60 text-center">
                  {autoConnectConfig.selectedCategories.length > 0 
                    ? `${autoConnectConfig.selectedCategories.length} selecionada(s)` 
                    : 'Todas serão testadas'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6205D5, #7c4dff);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(98, 5, 213, 0.3);
          transition: all 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(98, 5, 213, 0.5);
        }
        
        input[type="range"]::-webkit-slider-track {
          background: linear-gradient(90deg, #6205D5, #7c4dff);
          height: 3px;
          border-radius: 2px;
        }
      `}</style>
    </Modal>
  );
}