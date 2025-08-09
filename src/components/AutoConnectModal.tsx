import { useState } from 'react';
import { Modal } from './modals/Modal';
import { RefreshCw, CheckCircle, XCircle, Wifi, AlertCircle, Settings, Zap } from 'lucide-react';
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
    <Modal 
      onClose={onClose} 
      title={running ? `Testando (${testedConfigs}/${actualTotalConfigs})` : successConfigName ? 'Conectado!' : 'Teste Automático'} 
      icon={running ? RefreshCw : successConfigName ? CheckCircle : Zap}
    >
      <div className="w-full max-w-2xl mx-auto">
        
        {/* Status Header - Sempre visível */}
        <div className="mb-6">
          <div className={`relative rounded-xl p-4 border-2 transition-all duration-500 ${
            running 
              ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-400/40 shadow-lg shadow-blue-500/20' 
              : successConfigName 
                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/40 shadow-lg shadow-green-500/20'
                : error
                  ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-400/40 shadow-lg shadow-red-500/20'
                  : 'bg-gradient-to-r from-[#6205D5]/10 to-[#26074d]/20 border-[#6205D5]/30'
          }`}>
            
            {/* Progress Ring */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none" stroke="currentColor" strokeWidth="4"
                    className="text-[#26074d] opacity-20"
                  />
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none" stroke="currentColor" strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPercentage / 100)}`}
                    className={`transition-all duration-700 ease-out ${
                      running ? 'text-blue-400' : successConfigName ? 'text-green-400' : 'text-[#6205D5]'
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {running ? (
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                  ) : successConfigName ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : error ? (
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  ) : (
                    <Zap className="w-6 h-6 text-[#6205D5]" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white truncate">
                    {running ? 'Testando Conexões...' : successConfigName ? '🎉 Conectado!' : error ? '❌ Erro no Teste' : 'Pronto para Testar'}
                  </h3>
                  {running && (
                    <div className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full font-mono animate-pulse">
                      {formatDuration(currentTestDuration)}
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-[#b0a8ff]/70 mb-2 truncate">
                  {running && currentConfigName 
                    ? `Testando: ${currentConfigName}` 
                    : successConfigName 
                      ? `Usando: ${successConfigName}` 
                      : error
                        ? 'Verifique as configurações e tente novamente'
                        : `${actualTotalConfigs} configurações encontradas`
                  }
                </p>
                
                {/* Mini Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[#26074d]/60 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        running ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 
                        successConfigName ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 
                        'bg-gradient-to-r from-[#6205D5] to-[#7c4dff]'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white min-w-[3rem] text-right">
                    {progressPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation - Melhorado */}
        <div className="flex bg-[#26074d]/40 rounded-xl p-1 mb-6 backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 text-sm relative ${
                activeTab === tab.id 
                  ? 'bg-[#6205D5] text-white shadow-lg transform scale-105' 
                  : 'text-[#b0a8ff]/70 hover:bg-[#6205D5]/20 hover:text-[#b0a8ff] hover:scale-102'
              }`}
            >
              <tab.icon className={`w-4 h-4 transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`} />
              <span className="hidden sm:inline font-semibold">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          
          {/* STATUS TAB */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              
              {/* Success Message */}
              {successConfigName && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/40 rounded-xl p-4 shadow-lg shadow-green-500/20 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-400 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-green-400 text-lg mb-1">🎉 Conectado com Sucesso!</h4>
                      <p className="text-green-300 font-mono text-sm truncate">{successConfigName}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                        <span className="text-green-300 text-xs">Conexão ativa e estável</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/40 rounded-xl p-4 shadow-lg shadow-red-500/20 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-red-400 text-lg mb-1">Erro no Teste</h4>
                      <p className="text-red-300 text-sm">{error}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                        <span className="text-red-300 text-xs">Verifique sua conexão</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Running Status */}
              {running && (
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/40 rounded-xl p-4 shadow-lg shadow-blue-500/20 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-blue-400 text-lg mb-1">Testando em Progresso...</h4>
                      {currentConfigName && (
                        <p className="text-blue-300 font-mono text-sm truncate mb-2">
                          Config atual: {currentConfigName}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-blue-300 text-xs">Procurando melhor conexão</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#26074d]/40 rounded-xl p-4 border border-[#6205D5]/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#6205D5]/20 rounded-lg flex items-center justify-center">
                      <Wifi className="w-5 h-5 text-[#6205D5]" />
                    </div>
                    <div>
                      <p className="text-[#b0a8ff]/70 text-xs">Configurações</p>
                      <p className="text-white font-bold text-lg">{actualTotalConfigs}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#26074d]/40 rounded-xl p-4 border border-[#6205D5]/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-[#b0a8ff]/70 text-xs">Testadas</p>
                      <p className="text-white font-bold text-lg">{testedConfigs}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Melhorados */}
              <div className="flex gap-3 pt-2">
                {!running ? (
                  <button
                    onClick={onStart}
                    className="flex-1 bg-gradient-to-r from-[#6205D5] to-[#7c4dff] hover:from-[#7c4dff] hover:to-[#9575ff] text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    <Zap className="w-5 h-5" />
                    {isCompleted ? 'Testar Novamente' : 'Iniciar Teste'}
                    <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                  </button>
                ) : (
                  <button
                    onClick={onCancel}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    <XCircle className="w-5 h-5" />
                    Parar Teste
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  disabled={running}
                  className="px-6 py-4 bg-[#26074d]/80 hover:bg-[#6205D5]/20 disabled:bg-gray-700/50 text-[#b0a8ff] hover:text-white disabled:text-gray-400 rounded-xl border border-[#6205D5]/30 hover:border-[#6205D5]/60 disabled:border-gray-600/30 font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:scale-100"
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
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3 ${
                          autoConnectConfig.selectedCategories.includes(category.id) 
                            ? 'bg-[#6205D5] text-white shadow-md transform scale-[1.01]' 
                            : 'bg-[#26074d]/40 text-[#b0a8ff] hover:bg-[#6205D5]/20 hover:scale-[1.01]'
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white/20"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium flex-1 min-w-0 truncate">{category.name}</span>
                        {autoConnectConfig.selectedCategories.includes(category.id) && (
                          <CheckCircle className="w-4 h-4 flex-shrink-0 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* Categories Count Info */}
                  <div className="mt-3 flex justify-between items-center text-xs text-[#b0a8ff]/60">
                    <span>
                      {autoConnectConfig.selectedCategories.length > 0 
                        ? `${autoConnectConfig.selectedCategories.length} categoria(s) selecionada(s)` 
                        : 'Todas as categorias serão testadas'
                      }
                    </span>
                    <span>{categories.length} total</span>
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

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6205D5, #7c4dff);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 4px 8px rgba(98, 5, 213, 0.3);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 12px rgba(98, 5, 213, 0.5);
        }
        
        .slider::-webkit-slider-track {
          background: linear-gradient(90deg, #6205D5, #7c4dff);
          height: 4px;
          border-radius: 2px;
        }
        
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation: animate-in 0.3s ease-out;
        }
        
        .slide-in-from-top-4 {
          animation: slide-in-from-top-4 0.5s ease-out;
        }
        
        @keyframes slide-in-from-top-4 {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Modal>
  );
}
