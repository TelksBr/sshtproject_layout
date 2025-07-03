import { useState } from 'react';
import { Modal } from './modals/Modal';
import { RefreshCw, CheckCircle, XCircle, Clock, Wifi, AlertCircle, Settings, Plus, Minus, ChevronDown, Check } from 'lucide-react';
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
  const [showConfigTypeDropdown, setShowConfigTypeDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  
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

  // Tela de Configurações
  const renderSettings = () => (
    <div className="space-y-6">
      {/* Header das Configurações */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#b0a8ff] flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurações do Teste
        </h3>
        <button
          onClick={() => setShowSettings(false)}
          className="text-[#b0a8ff] hover:text-white transition-colors"
        >
          Voltar
        </button>
      </div>

      {/* Tempos */}
      <div className="space-y-6">
        <h4 className="font-semibold text-[#b0a8ff] flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Configurações de Tempo
        </h4>
        
        {/* Timeout de conexão */}
        <div className="space-y-3">
          <label className="text-sm text-[#b0a8ff] flex items-center justify-between">
            <span>Timeout de conexão</span>
            <span className="text-xs text-[#b0a8ff]/60">{(autoConnectConfig.connectionTimeout / 1000).toFixed(1)}s</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateConfig({ connectionTimeout: Math.max(3000, autoConnectConfig.connectionTimeout - 1000) })}
              className="w-10 h-10 rounded-lg bg-[#6205D5] hover:bg-[#7c4dff] transition-colors flex items-center justify-center"
            >
              <Minus className="w-4 h-4 text-white" />
            </button>
            <div className="flex-1 relative">
              <input
                type="range"
                min="3000"
                max="15000"
                step="1000"
                value={autoConnectConfig.connectionTimeout}
                onChange={(e) => updateConfig({ connectionTimeout: parseInt(e.target.value) })}
                className="w-full h-2 bg-[#26074d] rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #6205D5 0%, #6205D5 ${((autoConnectConfig.connectionTimeout - 3000) / 12000) * 100}%, #26074d ${((autoConnectConfig.connectionTimeout - 3000) / 12000) * 100}%, #26074d 100%)`
                }}
              />
              <input
                type="number"
                value={autoConnectConfig.connectionTimeout}
                onChange={(e) => updateConfig({ connectionTimeout: Math.max(3000, parseInt(e.target.value) || 8000) })}
                className="absolute top-6 left-1/2 transform -translate-x-1/2 w-20 px-2 py-1 bg-[#1a0533] border border-[#6205D5]/30 rounded text-white text-xs text-center"
                min="3000"
                step="1000"
              />
            </div>
            <button
              onClick={() => updateConfig({ connectionTimeout: Math.min(30000, autoConnectConfig.connectionTimeout + 1000) })}
              className="w-10 h-10 rounded-lg bg-[#6205D5] hover:bg-[#7c4dff] transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Timeout do fetch */}
        <div className="space-y-3">
          <label className="text-sm text-[#b0a8ff] flex items-center justify-between">
            <span>Timeout do teste de internet</span>
            <span className="text-xs text-[#b0a8ff]/60">{(autoConnectConfig.fetchTimeout / 1000).toFixed(1)}s</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateConfig({ fetchTimeout: Math.max(2000, autoConnectConfig.fetchTimeout - 1000) })}
              className="w-10 h-10 rounded-lg bg-[#6205D5] hover:bg-[#7c4dff] transition-colors flex items-center justify-center"
            >
              <Minus className="w-4 h-4 text-white" />
            </button>
            <div className="flex-1 relative">
              <input
                type="range"
                min="2000"
                max="10000"
                step="1000"
                value={autoConnectConfig.fetchTimeout}
                onChange={(e) => updateConfig({ fetchTimeout: parseInt(e.target.value) })}
                className="w-full h-2 bg-[#26074d] rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #6205D5 0%, #6205D5 ${((autoConnectConfig.fetchTimeout - 2000) / 8000) * 100}%, #26074d ${((autoConnectConfig.fetchTimeout - 2000) / 8000) * 100}%, #26074d 100%)`
                }}
              />
              <input
                type="number"
                value={autoConnectConfig.fetchTimeout}
                onChange={(e) => updateConfig({ fetchTimeout: Math.max(2000, parseInt(e.target.value) || 4000) })}
                className="absolute top-6 left-1/2 transform -translate-x-1/2 w-20 px-2 py-1 bg-[#1a0533] border border-[#6205D5]/30 rounded text-white text-xs text-center"
                min="2000"
                step="1000"
              />
            </div>
            <button
              onClick={() => updateConfig({ fetchTimeout: Math.min(15000, autoConnectConfig.fetchTimeout + 1000) })}
              className="w-10 h-10 rounded-lg bg-[#6205D5] hover:bg-[#7c4dff] transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Tipo de Configuração */}
      <div className="space-y-4">
        <h4 className="font-semibold text-[#b0a8ff]">Tipo de Configuração</h4>
        <div className="relative">
          <button
            onClick={() => setShowConfigTypeDropdown(!showConfigTypeDropdown)}
            className="w-full px-4 py-3 bg-[#26074d] border border-[#6205D5]/30 rounded-lg text-left text-[#b0a8ff] hover:border-[#6205D5]/50 transition-colors flex items-center justify-between"
          >
            <span>
              {autoConnectConfig.configType === 'all' && '🌐 Todas as configurações'}
              {autoConnectConfig.configType === 'ssh' && '🔐 Apenas SSH/Proxy'}
              {autoConnectConfig.configType === 'v2ray' && '🚀 Apenas V2Ray'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showConfigTypeDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showConfigTypeDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1a0533] border border-[#6205D5]/30 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
              {[
                { value: 'all', label: '🌐 Todas as configurações', desc: 'Testa SSH e V2Ray' },
                { value: 'ssh', label: '🔐 Apenas SSH/Proxy', desc: 'SSH, Proxy, SOCKS' },
                { value: 'v2ray', label: '🚀 Apenas V2Ray', desc: 'V2Ray, VMess, VLess' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    updateConfig({ configType: option.value as 'all' | 'ssh' | 'v2ray' });
                    setShowConfigTypeDropdown(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-[#26074d] transition-colors flex items-center justify-between border-b border-[#6205D5]/20 last:border-b-0 ${
                    autoConnectConfig.configType === option.value ? 'bg-[#6205D5]/20 text-white' : 'text-[#b0a8ff]'
                  }`}
                >
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-[#b0a8ff]/60">{option.desc}</div>
                  </div>
                  {autoConnectConfig.configType === option.value && (
                    <Check className="w-4 h-4 text-[#6205D5]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seleção de Categorias */}
      <div className="space-y-4">
        <h4 className="font-semibold text-[#b0a8ff]">Categorias para Testar</h4>
        <div className="relative">
          <button
            onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
            className="w-full px-4 py-3 bg-[#26074d] border border-[#6205D5]/30 rounded-lg text-left text-[#b0a8ff] hover:border-[#6205D5]/50 transition-colors flex items-center justify-between"
          >
            <span>
              {autoConnectConfig.selectedCategories.length === 0 
                ? '📂 Todas as categorias' 
                : `📂 ${autoConnectConfig.selectedCategories.length} categoria(s) selecionada(s)`
              }
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showCategoriesDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showCategoriesDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1a0533] border border-[#6205D5]/30 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto custom-scrollbar">
              <div className="p-2">
                <button
                  onClick={() => {
                    updateConfig({ selectedCategories: [] });
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-[#26074d] rounded transition-colors flex items-center justify-between mb-1 ${
                    autoConnectConfig.selectedCategories.length === 0 ? 'bg-[#6205D5]/20 text-white' : 'text-[#b0a8ff]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-[#6205D5] to-[#7c4dff]" />
                    <span className="font-medium">Todas as categorias</span>
                  </div>
                  {autoConnectConfig.selectedCategories.length === 0 && (
                    <Check className="w-4 h-4 text-[#6205D5]" />
                  )}
                </button>
                
                <div className="border-t border-[#6205D5]/20 pt-2 mt-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`w-full px-3 py-2 text-left hover:bg-[#26074d] rounded transition-colors flex items-center justify-between mb-1 ${
                        autoConnectConfig.selectedCategories.includes(category.id) ? 'bg-[#6205D5]/20 text-white' : 'text-[#b0a8ff]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      {autoConnectConfig.selectedCategories.includes(category.id) && (
                        <Check className="w-4 h-4 text-[#6205D5]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Tela Principal
  const renderMainScreen = () => (
    <div className="space-y-6">

      {/* Resumo das Configurações Ativas */}
      <div className="card md:p-6 lg:p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6205D5]/10 via-transparent to-[#4B0082]/5 pointer-events-none"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg md:text-xl font-bold text-gradient flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#6205D5]/20 backdrop-blur-sm">
                <Settings className="w-5 h-5 text-[#6205D5]" />
              </div>
              Configurações Ativas
            </h3>
            <div className="px-3 py-1 bg-[#6205D5]/20 text-[#6205D5] text-xs font-semibold rounded-full uppercase tracking-wide">
              Ativo
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: '🌐',
                label: 'Tipo de Config',
                value: autoConnectConfig.configType === 'all' ? 'Todas as configurações' 
                      : autoConnectConfig.configType === 'ssh' ? 'SSH/Proxy' 
                      : 'V2Ray'
              },
              {
                icon: '📂',
                label: 'Categorias',
                value: autoConnectConfig.selectedCategories.length === 0 
                      ? 'Todas as categorias' 
                      : `${autoConnectConfig.selectedCategories.length} selecionada(s)`
              },
              {
                icon: '⏱️',
                label: 'Timeout Conexão',
                value: `${(autoConnectConfig.connectionTimeout / 1000).toFixed(1)}s`
              },
              {
                icon: '🌐',
                label: 'Timeout Internet',
                value: `${(autoConnectConfig.fetchTimeout / 1000).toFixed(1)}s`
              }
            ].map((item, index) => (
              <div key={index} className="bg-[#26074d]/40 backdrop-blur-sm border border-[#6205D5]/20 rounded-xl p-4 hover:border-[#6205D5]/40 transition-all duration-300 group">
                <div className="flex items-center gap-3">
                  <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-[#b0a8ff]/70 text-xs font-medium uppercase tracking-wider mb-1">
                      {item.label}
                    </div>
                    <div className="text-[#b0a8ff] font-semibold text-sm md:text-base">
                      {item.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* Progress Section */}
      <div className="card md:p-6 lg:p-4 space-y-6">
        {/* Progress Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg md:text-xl font-bold text-gradient flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#6205D5]/20 backdrop-blur-sm">
              <RefreshCw className={`w-5 h-5 text-[#6205D5] ${running ? 'animate-spin' : ''}`} />
            </div>
            Status do Teste
          </h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${running ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium text-[#b0a8ff]">
              {running ? 'Em execução' : isCompleted ? 'Concluído' : 'Aguardando'}
            </span>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-[#26074d]/40 rounded-xl border border-[#6205D5]/20">
            <div className="text-2xl md:text-3xl font-bold text-[#6205D5] mb-1">{testedConfigs}</div>
            <div className="text-xs text-[#b0a8ff]/70 uppercase tracking-wide">Testados</div>
          </div>
          <div className="text-center p-4 bg-[#26074d]/40 rounded-xl border border-[#6205D5]/20">
            <div className="text-2xl md:text-3xl font-bold text-[#b0a8ff] mb-1">{totalConfigs}</div>
            <div className="text-xs text-[#b0a8ff]/70 uppercase tracking-wide">Total</div>
          </div>
          <div className="text-center p-4 bg-[#26074d]/40 rounded-xl border border-[#6205D5]/20">
            <div className="text-2xl md:text-3xl font-bold text-green-400 mb-1">{progressPercentage.toFixed(0)}%</div>
            <div className="text-xs text-[#b0a8ff]/70 uppercase tracking-wide">Progresso</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-medium text-[#b0a8ff]">
            <span>Progresso Geral</span>
            <span>{testedConfigs}/{totalConfigs} configs</span>
          </div>
          <div className="relative">
            <div className="w-full bg-[#26074d] rounded-full h-4 shadow-inner overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#6205D5] via-[#7c4dff] to-[#9575ff] h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Test Info */}
        {running && currentConfigName && (
          <div className="bg-gradient-to-r from-[#6205D5]/20 via-[#7c4dff]/10 to-[#6205D5]/20 border border-[#6205D5]/40 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#6205D5]/5 via-transparent to-[#7c4dff]/5 animate-pulse"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6205D5] to-[#7c4dff] flex items-center justify-center shadow-lg">
                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <div className="text-[#b0a8ff] font-semibold text-lg">Testando Agora</div>
                  <div className="text-[#6205D5] text-sm font-medium">Verificando conectividade...</div>
                </div>
              </div>
              
              <div className="bg-[#0f0221]/80 border border-[#6205D5]/30 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-[#b0a8ff]/70 text-xs font-medium uppercase tracking-wider mb-2">Configuração Atual:</div>
                <div className="text-white font-mono text-base md:text-lg break-all">
                  {currentConfigName}
                </div>
              </div>
              
              {currentTestDuration > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-[#b0a8ff]/70">Tempo decorrido:</div>
                  <div className="px-3 py-1 bg-[#6205D5]/20 text-[#6205D5] text-sm font-mono rounded-full">
                    {formatDuration(currentTestDuration)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Message */}
        {successConfigName && (
          <div className="bg-gradient-to-r from-green-500/20 via-emerald-500/15 to-green-500/20 border border-green-400/40 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 via-transparent to-emerald-400/5 animate-pulse"></div>
            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-green-400 text-xl font-bold mb-1">🎉 Conectado com Sucesso!</div>
                  <div className="text-green-300 text-sm mb-3">Conexão estabelecida e testada</div>
                  <div className="bg-green-950/50 border border-green-400/30 rounded-lg p-3">
                    <div className="text-green-300/70 text-xs font-medium uppercase tracking-wider mb-1">Configuração Ativa:</div>
                    <div className="text-green-200 font-mono text-sm break-all">{successConfigName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Divider visual */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#6205D5]/50 to-transparent"></div>
        <span className="text-[#6205D5] text-sm font-medium">Logs do Teste</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#6205D5]/50 to-transparent"></div>
      </div>

      {/* Logs Section */}
      <div className="card md:p-6 lg:p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg md:text-xl font-bold text-gradient flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#6205D5]/20 backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-[#6205D5]" />
            </div>
            Histórico de Testes
          </h3>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-[#26074d]/60 text-[#b0a8ff] text-xs font-semibold rounded-full border border-[#6205D5]/20">
              {logs.length} eventos
            </div>
          </div>
        </div>
        
        <div className="bg-[#0f0221]/80 border border-[#6205D5]/30 rounded-xl overflow-hidden">
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {logs.length > 0 ? (
              <div className="p-4 space-y-3">
                {logs.slice(-10).reverse().map((log, index) => (
                  <div key={log.id} className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-[#26074d]/30 border border-transparent hover:border-[#6205D5]/20 ${
                    index === 0 ? 'bg-[#6205D5]/10 border-[#6205D5]/20' : 'bg-[#1a0533]/50'
                  }`}>
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        log.status === 'success' ? 'bg-green-500/20 text-green-400' :
                        log.status === 'failed' || log.status === 'timeout' ? 'bg-red-500/20 text-red-400' :
                        log.status === 'connecting' ? 'bg-blue-500/20 text-blue-400' :
                        log.status === 'testing' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {getStatusIcon(log.status)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[#b0a8ff] font-semibold text-base truncate">
                          {log.configName}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {log.duration && (
                            <div className="px-2 py-1 bg-[#6205D5]/20 text-[#6205D5] text-xs font-mono rounded-full">
                              {formatDuration(log.duration)}
                            </div>
                          )}
                          <span className="text-[#b0a8ff]/50 text-xs font-mono">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      {log.message && (
                        <div className="text-[#b0a8ff]/70 text-sm bg-[#26074d]/30 rounded-lg p-2 border border-[#6205D5]/10">
                          {log.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#26074d]/40 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-[#b0a8ff]/40" />
                </div>
                <div className="text-lg font-semibold text-[#b0a8ff]/60 mb-2">Nenhum log disponível</div>
                <div className="text-sm text-[#b0a8ff]/40">Os logs aparecerão quando o teste iniciar</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[#6205D5]/20">
        {!running ? (
          <button
            onClick={onStart}
            className="flex-1 group relative overflow-hidden py-4 px-6 bg-gradient-to-r from-[#6205D5] to-[#7c4dff] hover:from-[#7c4dff] hover:to-[#9575ff] text-white rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-2xl hover:shadow-[#6205D5]/25 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="relative flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Wifi className="w-5 h-5" />
              </div>
              <span>{isCompleted ? '🔄 Testar Novamente' : '🚀 Iniciar Teste Automático'}</span>
            </div>
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="flex-1 group relative overflow-hidden py-4 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-2xl hover:shadow-red-500/25 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="relative flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <span>🛑 Parar Teste</span>
            </div>
          </button>
        )}
        <button
          onClick={onClose}
          disabled={running}
          className="py-4 px-6 bg-[#26074d]/80 hover:bg-[#6205D5]/20 disabled:bg-gray-700/50 disabled:cursor-not-allowed text-[#b0a8ff] hover:text-white disabled:text-gray-400 rounded-xl border border-[#6205D5]/30 hover:border-[#6205D5]/60 disabled:border-gray-600/30 font-semibold text-base transition-all duration-300 backdrop-blur-sm hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
        >
          {running ? '⏳ Aguarde...' : 'Fechar'}
        </button>
      </div>
    </div>
  );

  return (
    <Modal onClose={onClose} title="Teste Automático" icon={RefreshCw}>
      <div className="p-4 md:p-6 lg:p-4 w-full flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header com botão de configurações */}
        <div className="flex items-center justify-between sticky top-0 bg-[#1a0533]/95 backdrop-blur-md z-10 -mx-4 md:-mx-6 lg:-mx-4 px-4 md:px-6 lg:px-4 py-2 border-b border-[#6205D5]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6205D5] to-[#7c4dff] flex items-center justify-center shadow-lg">
              <RefreshCw className={`w-5 h-5 text-white ${running ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gradient">Teste Automático</h2>
              <p className="text-sm text-[#b0a8ff]/70">Encontre a melhor conexão automaticamente</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="group p-3 rounded-xl bg-[#26074d]/60 hover:bg-[#6205D5]/20 transition-all duration-300 border border-[#6205D5]/20 hover:border-[#6205D5]/40 backdrop-blur-sm"
            title="Configurações"
          >
            <Settings className={`w-5 h-5 text-[#b0a8ff] group-hover:text-[#6205D5] transition-all duration-300 ${showSettings ? 'rotate-45' : ''}`} />
          </button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-500/20 via-red-400/15 to-red-500/20 border border-red-400/40 rounded-xl p-4 flex items-center gap-3 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-red-400 font-semibold text-base mb-1">Erro no Teste</div>
              <div className="text-red-300 text-sm">{error}</div>
            </div>
          </div>
        )}
        
        {/* Conteúdo principal */}
        <div className="flex flex-col gap-6">
          {showSettings ? renderSettings() : renderMainScreen()}
        </div>

        {/* Estilos personalizados para barras de rolagem */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1a0533;
            border-radius: 6px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #6205D5;
            border-radius: 6px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #7c4dff;
          }
        `}</style>
      </div>
    </Modal>
  );
}
