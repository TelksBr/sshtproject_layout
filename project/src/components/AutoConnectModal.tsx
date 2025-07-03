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
      <div className="bg-gradient-to-r from-[#22094a] to-[#1a0533] border border-[#6205D5]/30 rounded-xl p-6 shadow-lg">
        <h3 className="text-base font-bold text-[#b0a8ff] mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#6205D5]" />
          Configurações Ativas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <div className="text-[#b0a8ff]/70 text-xs uppercase tracking-wide">Tipo:</div>
            <div className="text-[#b0a8ff] font-semibold text-base">
              {autoConnectConfig.configType === 'all' && '🌐 Todas'}
              {autoConnectConfig.configType === 'ssh' && '🔐 SSH/Proxy'}
              {autoConnectConfig.configType === 'v2ray' && '🚀 V2Ray'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-[#b0a8ff]/70 text-xs uppercase tracking-wide">Categorias:</div>
            <div className="text-[#b0a8ff] font-semibold text-base">
              {autoConnectConfig.selectedCategories.length === 0 
                ? '📂 Todas' 
                : `📂 ${autoConnectConfig.selectedCategories.length} selecionada(s)`
              }
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-[#b0a8ff]/70 text-xs uppercase tracking-wide">Timeout Conexão:</div>
            <div className="text-[#b0a8ff] font-semibold text-base">⏰ {(autoConnectConfig.connectionTimeout / 1000).toFixed(1)}s</div>
          </div>
          <div className="space-y-2">
            <div className="text-[#b0a8ff]/70 text-xs uppercase tracking-wide">Timeout Internet:</div>
            <div className="text-[#b0a8ff] font-semibold text-base">🌐 {(autoConnectConfig.fetchTimeout / 1000).toFixed(1)}s</div>
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
      <div className="bg-[#1a0533]/50 border border-[#6205D5]/20 rounded-xl p-6 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-base font-medium">
            <span className="text-[#b0a8ff]">Progresso do Teste</span>
            <span className="text-[#6205D5] font-bold">{testedConfigs}/{totalConfigs}</span>
          </div>
          <div className="w-full bg-[#26074d] rounded-full h-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-[#6205D5] to-[#7c4dff] h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-sm text-[#b0a8ff]/80 text-center font-medium">
            {progressPercentage.toFixed(1)}% concluído
          </div>
        </div>

        {/* Current Test Info */}
        {running && currentConfigName && (
          <div className="bg-gradient-to-r from-[#26074d]/80 to-[#1a0533]/80 border border-[#6205D5]/40 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="animate-pulse">
                <Clock className="w-5 h-5 text-[#6205D5]" />
              </div>
              <span className="text-[#b0a8ff] font-semibold text-base">Testando agora:</span>
            </div>
            <div className="text-white font-mono text-base bg-[#0f0221] rounded-lg p-3 border border-[#6205D5]/30">
              {currentConfigName}
            </div>
            {currentTestDuration > 0 && (
              <div className="text-sm text-[#6205D5] mt-3 font-medium">
                Tempo decorrido: {formatDuration(currentTestDuration)}
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {successConfigName && (
          <div className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-400/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <div className="text-green-400 text-base font-bold">Conectado com sucesso!</div>
                <div className="text-green-300 font-mono text-sm mt-1">{successConfigName}</div>
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
      <div className="bg-[#1a0533]/50 border border-[#6205D5]/20 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#b0a8ff] flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#6205D5]" />
            Histórico de Testes
          </h3>
          <span className="text-xs text-[#b0a8ff]/60 bg-[#26074d] px-3 py-1 rounded-full font-medium">
            {logs.length} eventos
          </span>
        </div>
        <div className="bg-[#0f0221] border border-[#6205D5]/30 rounded-lg max-h-60 overflow-y-auto custom-scrollbar">
          {logs.length > 0 ? (
            <div className="p-4 space-y-3">
              {logs.slice(-10).map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg bg-[#1a0533]/50 hover:bg-[#26074d]/30 transition-all duration-200 border border-transparent hover:border-[#6205D5]/20">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(log.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[#b0a8ff] font-medium text-base truncate">
                        {log.configName}
                      </span>
                      <span className="text-[#b0a8ff]/50 text-xs flex-shrink-0 font-mono">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {log.message && (
                      <div className="text-[#b0a8ff]/70 text-sm mt-1">{log.message}</div>
                    )}
                    {log.duration && (
                      <div className="text-[#6205D5] text-sm mt-2 font-mono bg-[#26074d]/30 rounded px-2 py-1 inline-block">
                        {formatDuration(log.duration)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[#b0a8ff]/60">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <div className="text-base font-medium mb-2">Nenhum log disponível</div>
              <div className="text-sm">Os logs aparecerão quando o teste iniciar</div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#6205D5]/20">
        {!running ? (
          <button
            onClick={onStart}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-[#6205D5] to-[#7c4dff] hover:from-[#7c4dff] hover:to-[#9575ff] text-white rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Wifi className="w-6 h-6" />
            {isCompleted ? '🔄 Testar Novamente' : '🚀 Iniciar Teste Automático'}
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <XCircle className="w-6 h-6" />
            🛑 Parar Teste
          </button>
        )}
        <button
          onClick={onClose}
          disabled={running}
          className="py-4 px-6 bg-[#26074d] hover:bg-[#3a0a7a] disabled:bg-gray-700 disabled:cursor-not-allowed text-[#b0a8ff] hover:text-white disabled:text-gray-400 rounded-xl border border-[#6205D5]/30 hover:border-[#6205D5]/60 font-semibold text-base transition-all duration-200"
        >
          {running ? '⏳ Aguarde...' : 'Fechar'}
        </button>
      </div>
    </div>
  );

  return (
    <Modal onClose={onClose} title="Teste Automático" icon={RefreshCw}>
      <div className="p-4 sm:p-6 w-full flex flex-col gap-6">
        {/* Botão de configurações no canto superior direito */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-[#26074d] hover:bg-[#6205D5] transition-colors group"
            title="Configurações"
          >
            <Settings className="w-5 h-5 text-[#b0a8ff] group-hover:text-white" />
          </button>
        </div>
        
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
