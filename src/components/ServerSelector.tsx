import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, CalendarClock, Wifi, AlertCircle, ChevronLeft, Search, Plane } from 'lucide-react';
import { getAllConfigs, checkUserStatus, getAirplaneState, toggleAirplaneMode, checkForUpdates, setActiveConfig } from '../utils/appFunctions';
import { Modal } from './modals/Modal';
import { useAutoConnect } from '../hooks/useAutoConnect';
import { AutoConnectModal } from './AutoConnectModal';
import { ConfigCategory, ConfigItem } from '../types/config';
import { useActiveConfig } from '../context/ActiveConfigContext';

export function ServerSelector() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configs, setConfigs] = useState<ConfigCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ConfigCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [airplaneMode, setAirplaneMode] = useState(false);

  const { activeConfig, setActiveConfigId, refreshActiveConfig } = useActiveConfig();

  // Lógica e estado do AutoConnect movidos para o hook useAutoConnect
  const autoConnect = useAutoConnect();

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    if (showConfigModal) {
      loadConfigs();
    }
  }, [showConfigModal]);

  useEffect(() => {
    const updateAirplaneState = () => {
      setAirplaneMode(getAirplaneState());
    };

    // Verificação inicial
    updateAirplaneState();

    // Monitor de estado
    const interval = setInterval(updateAirplaneState, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadConfigs = () => {
    setLoading(true);
    setError(null);
    try {
      const allConfigs = getAllConfigs();
      setConfigs(allConfigs);
      
      refreshActiveConfig(); // Atualiza a configuração ativa a partir do contexto
    } catch (e) {
      setError('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  // Adiciona estado de loading para feedback visual ao selecionar config
  const [pendingConfigId, setPendingConfigId] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleConfigSelect = (config: ConfigItem) => {
    setPendingConfigId(config.id);
    setIsPending(true);
    setActiveConfigId(config.id);
    setActiveConfig(config.id);
    
    // Polling: tenta atualizar o contexto até a config ativa mudar ou timeout
    let tentativas = 0;
    const maxTentativas = 8; // até 1.6s
    const poll = () => {
      refreshActiveConfig();
      setTimeout(() => {
        tentativas++;
        if (activeConfig?.id && activeConfig.id === config.id) {
          // O useEffect já vai fechar o modal
        } else if (tentativas < maxTentativas) {
          poll();
        } else {
          setIsPending(false);
        }
      }, 200);
    };
    poll();
  };

  // Fecha o modal apenas quando o contexto refletir a config selecionada
  useEffect(() => {
    if (pendingConfigId && activeConfig?.id && activeConfig.id === pendingConfigId) {
      setShowConfigModal(false);
      setSelectedCategory(null);
      setPendingConfigId(null);
      setIsPending(false);
    }
  }, [activeConfig, pendingConfigId]);

  const handleCategorySelect = (category: ConfigCategory) => {
    setSelectedCategory(category);
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  const handleUpdate = () => {
    checkForUpdates();
    loadConfigs(); // Reload configs after update
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setSelectedCategory(null); // Reset selected category on search
  };

  const toggleAirplaneModeHandler = async () => {
    const newState = !airplaneMode;
    const updatedState = await toggleAirplaneMode(newState);
    setAirplaneMode(updatedState); // Atualiza o estado com o valor retornado
  };

  useEffect(() => {
    const checkAirplaneState = () => {
      try {
        const state = getAirplaneState();
        if (state !== airplaneMode) {
          setAirplaneMode(state);
        }
      } catch (error) {
        // Handle error silently
      }
    };

    // Verifica estado inicial
    checkAirplaneState();

    // Monitora mudanças
    const interval = setInterval(checkAirplaneState, 1000);
    return () => clearInterval(interval);
  }, [airplaneMode]);

  const filteredConfigs = configs
    .filter(category =>
      (category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())))
      && category.items.length > 0 // <-- só exibe categorias com configs
    );

  const activeCategory = configs.find(category => 
    category.items.some(item => item.id === activeConfig?.id)
  );

  // Substitui o botão de AutoConnect para abrir o modal externo
  return (
    <>
      <section className="flex gap-1.5">
        <button
          className="flex-1 min-w-0 max-w-full h-10 flex items-center justify-between px-3 rounded-lg glass-effect overflow-hidden group hover:bg-[#6205D5]/5 transition-all duration-200"
          type="button"
          onClick={() => setShowConfigModal(true)}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <Settings className="w-4 h-4 text-[#6205D5] flex-shrink-0 group-hover:text-[#7c4dff] transition-colors" />
            {/* Indicador de configuração ativa */}
            {activeConfig && (
              <div className="w-2 h-2 rounded-full bg-[#6205D5] animate-pulse shadow-lg shadow-[#6205D5]/60" />
            )}
          </div>
          
          <div className="flex-1 min-w-0 text-center px-1">
            {activeConfig ? (
              <div className="space-y-0.5">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[#b0a8ff] text-xs font-medium block truncate max-w-full">
                    {activeConfig.name}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-[#6205D5] animate-pulse flex-shrink-0" />
                </div>
                <span className="text-[#b0a8ff]/50 text-[10px] block truncate max-w-full">
                  {activeCategory?.name || 'Sem categoria'}
                </span>
              </div>
            ) : (
              <span className="text-[#b0a8ff] text-xs font-medium truncate block max-w-full">
                ESCOLHA UMA CONFIGURAÇÃO
              </span>
            )}
          </div>
          
          {/* Seta indicativa */}
          <div className="flex-shrink-0 text-[#6205D5]/40 group-hover:text-[#6205D5] transition-colors">
            <ChevronLeft className="w-3 h-3 rotate-180" />
          </div>
        </button>

        <button
          className="w-10 h-10 flex items-center justify-center rounded-lg glass-effect"
          type="button"
          onClick={handleUpdate}
        >
          <RefreshCw className={`w-4 h-4 text-[#6205D5] ${loading ? 'animate-spin' : ''}`} />
        </button>

        <button
          className="w-10 h-10 flex items-center justify-center rounded-lg glass-effect"
          type="button"
          onClick={checkUserStatus}
        >
          <CalendarClock className="w-4 h-4 text-[#6205D5]" />
        </button>

        <button
          className={`
            w-10 h-10 flex items-center justify-center rounded-lg glass-effect
            ${airplaneMode ? 'bg-[#6205D5]/30' : ''}
          `}
          type="button"
          onClick={toggleAirplaneModeHandler}
        >
          <Plane 
            className={`
              w-4 h-4 transition-all
              ${airplaneMode ? 'text-white' : 'text-[#6205D5]'}
              ${airplaneMode ? 'rotate-45' : ''}
            `}
          />
        </button>

  {/* Botão de teste automático (AutoConnect) removido */}
      </section>

      {error && (
        <p className="text-red-400 text-xs text-center mt-2">{error}</p>
      )}

      {showConfigModal && (
        <Modal 
          onClose={() => {
            setShowConfigModal(false);
            setSelectedCategory(null);
            setIsPending(false);
          }}
          title={selectedCategory ? selectedCategory.name : activeConfig ? activeConfig.name : 'Configurações'}
          icon={Settings}
        >
          <div className="flex-1 p-3 relative">
            {isPending && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
                <RefreshCw className="w-8 h-8 text-[#6205D5] animate-spin" />
              </div>
            )}
            
            {/* Header customizado para navegação e status */}
            <div className="flex items-center gap-2 mb-4">
              {selectedCategory && (
                <button
                  onClick={handleBack}
                  className="p-1.5 -ml-1.5 rounded-full transition-colors hover:bg-[#6205D5]/20"
                >
                  <ChevronLeft className="w-5 h-5 text-[#b0a8ff]" />
                </button>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {/* Indicador de status quando há config ativa */}
                  {activeConfig && !selectedCategory && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#6205D5]/20 border border-[#6205D5]/40">
                      <div className="w-2 h-2 rounded-full bg-[#6205D5] animate-pulse" />
                      <span className="text-[10px] text-[#6205D5] font-bold">ATIVA</span>
                    </div>
                  )}
                </div>
                
                {selectedCategory ? (
                  <p className="text-xs text-[#b0a8ff]/70">
                    {selectedCategory.items.length} configurações disponíveis
                  </p>
                ) : activeConfig ? (
                  <p className="text-xs text-[#b0a8ff]/70">
                    Config atual: <span className="text-[#6205D5] font-medium">{activeConfig.name}</span> 
                    {activeCategory && ` • ${activeCategory.name}`}
                  </p>
                ) : (
                  <p className="text-xs text-[#b0a8ff]/70">
                    Selecione uma configuração para conectar
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={handleSearch}
                className="flex-1 p-2 rounded-lg glass-effect"
              />
              <Search className="w-5 h-5 text-[#b0a8ff]" />
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 text-[#6205D5] animate-spin" />
              </div>
            ) : filteredConfigs.length > 0 ? (
              <div className="space-y-2 transition-all duration-300">
                {!selectedCategory ? (
                  filteredConfigs
                    .map((category) => {
                      const isActiveCategory = category.items.some(item => item.id === activeConfig?.id);
                      return (
                        <button
                          key={category.id}
                          onClick={() => handleCategorySelect(category)}
                          className={`w-full p-3 rounded-lg transition-all duration-200 relative ${
                            isActiveCategory 
                              ? 'glass-effect border-2 border-[#6205D5]/60 bg-[#6205D5]/10' 
                              : 'glass-effect hover:bg-[#6205D5]/5'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {/* Indicador visual da categoria ativa */}
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200 ${
                                isActiveCategory 
                                  ? 'bg-[#6205D5] shadow-lg shadow-[#6205D5]/40 animate-pulse' 
                                  : 'bg-[#6205D5]/20'
                              }`} />
                              
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <h3 className={`font-medium text-sm transition-colors ${
                                    isActiveCategory ? 'text-white' : 'text-[#b0a8ff]'
                                  }`}>
                                    {category.name}
                                  </h3>
                                  {isActiveCategory && (
                                    <div className="px-2 py-0.5 rounded-full bg-[#6205D5] text-white text-[10px] font-bold animate-pulse">
                                      ATIVA
                                    </div>
                                  )}
                                </div>
                                <p className={`text-xs mt-0.5 transition-colors ${
                                  isActiveCategory ? 'text-[#b0a8ff]' : 'text-[#b0a8ff]/70'
                                }`}>
                                  {category.items.length} configurações disponíveis
                                </p>
                              </div>
                            </div>
                            
                            {/* Seta indicativa */}
                            <div className={`ml-2 transition-all duration-200 ${
                              isActiveCategory ? 'text-[#6205D5]' : 'text-[#b0a8ff]/40'
                            }`}>
                              <ChevronLeft className="w-4 h-4 rotate-180" />
                            </div>
                          </div>
                          
                          {/* Linha de destaque para categoria ativa */}
                          {isActiveCategory && (
                            <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#6205D5] to-[#7c4dff] rounded-l-lg" />
                          )}
                        </button>
                      );
                    })
                ) : (
                  <div className="grid gap-1.5 transition-all duration-300">
                    {selectedCategory.items.map((config) => {
                      const isActiveConfig = String(activeConfig?.id) === String(config.id);
                      return (
                        <button
                          key={config.id}
                          onClick={() => handleConfigSelect(config)}
                          className={`
                            w-full p-3 rounded-lg transition-all duration-200 relative overflow-hidden
                            ${isActiveConfig 
                              ? 'border-2 border-[#6205D5] bg-gradient-to-r from-[#6205D5]/20 to-[#26074d]/40 shadow-lg shadow-[#6205D5]/20' 
                              : 'glass-effect hover:bg-[#6205D5]/5 hover:border-[#6205D5]/30 border border-transparent'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 relative z-10">
                            {/* Indicador visual da config ativa */}
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200 ${
                              isActiveConfig 
                                ? 'bg-[#6205D5] shadow-lg shadow-[#6205D5]/60 animate-pulse ring-2 ring-white/30' 
                                : 'bg-[#6205D5]/20 hover:bg-[#6205D5]/40'
                            }`} />

                            {/* Ícone da configuração */}
                            {config.icon && (
                              <img 
                                src={config.icon} 
                                alt="" 
                                className={`w-6 h-6 rounded-lg object-cover transition-all duration-200 ${
                                  isActiveConfig 
                                    ? 'ring-2 ring-[#6205D5]/60 shadow-md' 
                                    : 'bg-[#26074d]'
                                }`}
                              />
                            )}
                            
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`text-sm font-medium truncate transition-colors ${
                                  isActiveConfig ? 'text-white' : 'text-[#b0a8ff]'
                                }`}>
                                  {config.name}
                                </h3>
                                {isActiveConfig && (
                                  <div className="px-2 py-0.5 rounded-full bg-[#6205D5] text-white text-[9px] font-bold animate-pulse flex-shrink-0">
                                    EM USO
                                  </div>
                                )}
                              </div>
                              <p className={`text-[11px] truncate transition-colors ${
                                isActiveConfig ? 'text-[#b0a8ff]' : 'text-[#b0a8ff]/70'
                              }`}>
                                {config.description}
                              </p>
                            </div>
                            
                            {/* Badge do modo */}
                            <div className={`text-[10px] px-2 py-1 rounded-full border transition-all flex-shrink-0 ${
                              isActiveConfig 
                                ? 'bg-[#6205D5] text-white border-[#6205D5]/60 shadow-md' 
                                : 'text-[#b0a8ff]/50 bg-[#100322]/30 border-[#6205D5]/10'
                            }`}>
                              {config.mode?.toUpperCase()}
                            </div>
                          </div>
                          
                          {/* Linha de destaque e efeito de brilho para config ativa */}
                          {isActiveConfig && (
                            <>
                              <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#6205D5] to-[#7c4dff] rounded-l-lg" />
                              <div className="absolute inset-0 bg-gradient-to-r from-[#6205D5]/5 via-transparent to-[#6205D5]/5 animate-pulse" />
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg glass-effect text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#26074d]/50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-[#b0a8ff]" />
                </div>
                <h3 className="text-base font-medium text-[#b0a8ff] mb-2">
                  Nenhuma Configuração Encontrada
                </h3>
                <p className="text-sm text-[#b0a8ff]/70 mb-4">
                  Para baixar as configurações mais recentes, é necessário ter uma conexão estável com a internet.
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[#b0a8ff]/50">
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs">Verifique sua conexão e tente novamente</span>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      <AutoConnectModal
        open={autoConnect.open}
        onClose={autoConnect.closeModal}
        currentConfigName={autoConnect.currentName}
        totalConfigs={autoConnect.total}
        testedConfigs={autoConnect.tested}
        successConfigName={autoConnect.success}
        running={autoConnect.running}
        onStart={autoConnect.startAutoConnect}
        onCancel={autoConnect.cancelTest}
        error={autoConnect.error}
        logs={autoConnect.logs}
        currentTestDuration={autoConnect.currentTestDuration}
        autoConnectConfig={autoConnect.autoConnectConfig}
        setAutoConnectConfig={autoConnect.setAutoConnectConfig}
        showSettings={autoConnect.showSettings}
        setShowSettings={autoConnect.setShowSettings}
      />
    </>
  );
}