import { useState } from 'react';
import { Modal } from './modals/Modal';
import { RefreshCw, CheckCircle, XCircle, Wifi, AlertCircle, Settings } from 'lucide-react';
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
}: AutoConnectModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'config' | 'logs'>('status');
  
  if (!open) return null;

  const progressPercentage = totalConfigs > 0 ? (testedConfigs / totalConfigs) * 100 : 0;
  const isCompleted = !running && testedConfigs > 0;

  // Obter todas as categorias disponíveis
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

  const getStatusIcon = (status: TestLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
      case 'timeout':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'connecting':
        return <Wifi className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'testing':
        return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

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

  // Tab Navigation simplificada
  const tabs = [
    { id: 'status', label: 'Status', icon: RefreshCw },
    { id: 'config', label: 'Config', icon: Settings },
    { id: 'logs', label: 'Logs', icon: AlertCircle },
  ];

  return (
    <Modal onClose={onClose} title="Teste Automático" icon={RefreshCw}>
      <div className="w-full max-w-2xl mx-auto">
        
        {/* Tab Navigation - Mobile Friendly */}
        <div className="flex bg-[#26074d]/40 rounded-lg p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md font-medium transition-all duration-200 text-sm ${
                activeTab === tab.id 
                  ? 'bg-[#6205D5] text-white shadow-lg' 
                  : 'text-[#b0a8ff]/70 hover:bg-[#6205D5]/20 hover:text-[#b0a8ff]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          
          {/* STATUS TAB */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              
              {/* Current Status Card */}
              <div className="card p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    running ? 'bg-blue-500/20' : successConfigName ? 'bg-green-500/20' : 'bg-gray-500/20'
                  }`}>
                    {running ? (
                      <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                    ) : successConfigName ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <Wifi className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-[#b0a8ff]">
                      {running ? 'Testando Conexões...' : successConfigName ? 'Conectado!' : 'Pronto para Testar'}
                    </h3>
                    <p className="text-sm text-[#b0a8ff]/70">
                      {running && currentConfigName ? `Testando: ${currentConfigName.substring(0, 30)}...` : 
                       successConfigName ? `Usando: ${successConfigName.substring(0, 30)}...` : 
                       `${totalConfigs} configurações encontradas`}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#b0a8ff]/70">Progresso do Teste</span>
                    <span className="text-[#b0a8ff] font-medium">{testedConfigs}/{totalConfigs}</span>
                  </div>
                  
                  <div className="w-full bg-[#26074d] rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#6205D5] to-[#7c4dff] h-full rounded-full transition-all duration-700 ease-out relative"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-2xl font-bold text-[#6205D5]">{progressPercentage.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Current Test Duration */}
                {running && currentTestDuration > 0 && (
                  <div className="mt-4 flex justify-center">
                    <div className="px-4 py-2 bg-[#6205D5]/20 text-[#6205D5] font-mono rounded-full border border-[#6205D5]/30">
                      ⏱️ {formatDuration(currentTestDuration)}
                    </div>
                  </div>
                )}
              </div>

              {/* Success Message */}
              {successConfigName && (
                <div className="bg-green-500/20 border border-green-400/40 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-green-400 text-lg">🎉 Conectado com Sucesso!</h4>
                      <p className="text-green-300 font-mono text-sm break-all">{successConfigName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-400/40 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-400 text-lg">Erro no Teste</h4>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {!running ? (
                  <button
                    onClick={onStart}
                    className="flex-1 bg-gradient-to-r from-[#6205D5] to-[#7c4dff] hover:from-[#7c4dff] hover:to-[#9575ff] text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    <Wifi className="w-5 h-5" />
                    {isCompleted ? 'Testar Novamente' : 'Iniciar Teste'}
                  </button>
                ) : (
                  <button
                    onClick={onCancel}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    <XCircle className="w-5 h-5" />
                    Parar Teste
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  disabled={running}
                  className="px-6 py-4 bg-[#26074d]/80 hover:bg-[#6205D5]/20 disabled:bg-gray-700/50 text-[#b0a8ff] hover:text-white disabled:text-gray-400 rounded-xl border border-[#6205D5]/30 hover:border-[#6205D5]/60 disabled:border-gray-600/30 font-bold transition-all duration-300"
                >
                  {running ? 'Aguarde...' : 'Fechar'}
                </button>
              </div>
            </div>
          )}

          {/* CONFIG TAB */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              
              {/* Connection Type */}
              <div className="card p-4">
                <h4 className="font-bold text-[#b0a8ff] mb-3 text-lg">🔧 Tipo de Configuração</h4>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'all', label: 'Todas as Configurações', desc: 'SSH + V2Ray + Proxy', icon: '🌐' },
                    { value: 'ssh', label: 'SSH/Proxy', desc: 'Apenas SSH e Proxy', icon: '🔐' },
                    { value: 'v2ray', label: 'V2Ray', desc: 'Apenas protocolos V2Ray', icon: '🚀' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateConfig({ configType: option.value as 'all' | 'ssh' | 'v2ray' })}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-200 flex items-center gap-4 ${
                        autoConnectConfig.configType === option.value 
                          ? 'bg-[#6205D5] text-white shadow-lg transform scale-[1.02]' 
                          : 'bg-[#26074d]/40 text-[#b0a8ff] hover:bg-[#6205D5]/20 hover:scale-[1.01]'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold">{option.label}</div>
                        <div className="text-sm opacity-80">{option.desc}</div>
                      </div>
                      {autoConnectConfig.configType === option.value && (
                        <CheckCircle className="w-6 h-6 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeouts */}
              <div className="card p-4">
                <h4 className="font-bold text-[#b0a8ff] mb-4 text-lg">⏱️ Configurações de Tempo</h4>
                <div className="space-y-6">
                  
                  {/* Connection Timeout */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[#b0a8ff] font-medium">Timeout de Conexão</span>
                      <span className="bg-[#6205D5]/20 text-[#6205D5] px-3 py-1 rounded-full font-mono text-sm">
                        {(autoConnectConfig.connectionTimeout / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3000"
                      max="15000"
                      step="1000"
                      value={autoConnectConfig.connectionTimeout}
                      onChange={(e) => updateConfig({ connectionTimeout: parseInt(e.target.value) })}
                      className="w-full h-3 bg-[#26074d] rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-[#b0a8ff]/60 mt-1">
                      <span>3s</span>
                      <span>15s</span>
                    </div>
                  </div>
                  
                  {/* Fetch Timeout */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[#b0a8ff] font-medium">Timeout de Internet</span>
                      <span className="bg-[#6205D5]/20 text-[#6205D5] px-3 py-1 rounded-full font-mono text-sm">
                        {(autoConnectConfig.fetchTimeout / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2000"
                      max="10000"
                      step="1000"
                      value={autoConnectConfig.fetchTimeout}
                      onChange={(e) => updateConfig({ fetchTimeout: parseInt(e.target.value) })}
                      className="w-full h-3 bg-[#26074d] rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-[#b0a8ff]/60 mt-1">
                      <span>2s</span>
                      <span>10s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="card p-4">
                <h4 className="font-bold text-[#b0a8ff] mb-4 text-lg">📂 Categorias para Testar</h4>
                <div className="space-y-2">
                  
                  {/* All Categories Button */}
                  <button
                    onClick={() => updateConfig({ selectedCategories: [] })}
                    className={`w-full p-3 rounded-lg text-left transition-all duration-200 font-medium ${
                      autoConnectConfig.selectedCategories.length === 0 
                        ? 'bg-[#6205D5] text-white shadow-lg' 
                        : 'bg-[#26074d]/40 text-[#b0a8ff] hover:bg-[#6205D5]/20'
                    }`}
                  >
                    🌐 Todas as Categorias ({categories.length} disponíveis)
                  </button>
                  
                  {/* Individual Categories */}
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {categories.slice(0, 8).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`w-full p-2 rounded-lg text-left transition-all duration-200 flex items-center gap-3 ${
                          autoConnectConfig.selectedCategories.includes(category.id) 
                            ? 'bg-[#6205D5] text-white shadow-md' 
                            : 'bg-[#26074d]/40 text-[#b0a8ff] hover:bg-[#6205D5]/20'
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium">{category.name}</span>
                        {autoConnectConfig.selectedCategories.includes(category.id) && (
                          <CheckCircle className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="card p-4">
                <h4 className="font-bold text-[#b0a8ff] mb-4 text-lg">📋 Histórico de Testes</h4>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {logs.length > 0 ? (
                    logs.slice(-15).reverse().map((log) => (
                      <div key={log.id} className="flex items-center gap-4 p-3 bg-[#26074d]/40 rounded-lg hover:bg-[#26074d]/60 transition-colors">
                        <div className="flex-shrink-0">
                          {getStatusIcon(log.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[#b0a8ff] truncate text-sm">
                            {log.configName}
                          </div>
                          {log.message && (
                            <div className="text-xs text-[#b0a8ff]/70 mt-1">{log.message}</div>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-xs text-[#b0a8ff]/50 font-mono">
                          {log.duration ? formatDuration(log.duration) : ''}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-[#b0a8ff]/40 mx-auto mb-4" />
                      <h5 className="font-bold text-[#b0a8ff]/60 mb-2">Nenhum Log Disponível</h5>
                      <p className="text-[#b0a8ff]/40 text-sm">Os logs aparecerão quando o teste iniciar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
