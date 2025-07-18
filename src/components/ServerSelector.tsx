import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, CalendarClock, Wifi, AlertCircle, ChevronLeft, Search, Plane, Zap } from 'lucide-react';
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

  const handleTagFilter = (tag: string) => {
    setSearchTerm(`[${tag}]`);
    setSelectedCategory(null); // Reset selected category on tag filter
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

  const uniqueTags = Array.from(new Set(configs.flatMap(category => 
    category.name.match(/\[([^\]]+)\]/g)?.map(tag => tag.replace(/[\[\]]/g, '')) || []
  )));

  // Substitui o botão de AutoConnect para abrir o modal externo
  return (
    <>
      <section className="flex gap-1.5">
        <button
          className="flex-1 min-w-0 max-w-full h-10 flex items-center justify-between px-3 rounded-lg glass-effect overflow-hidden"
          type="button"
          onClick={() => setShowConfigModal(true)}
        >
          <Settings className="w-4 h-4 text-[#6205D5] flex-shrink-0" />
          <div className="flex-1 min-w-0 text-center px-1">
            {activeConfig ? (
              <div className="space-y-0.5">
                <span className="text-[#b0a8ff] text-xs font-medium block truncate max-w-full">
                  {activeConfig.name}
                </span>
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

        {/* Botão de teste automático (AutoConnect) */}
        <button
          className="w-10 h-10 flex items-center justify-center rounded-lg glass-effect"
          type="button"
          onClick={() => {
            autoConnect.openModal();
          }}
          title="Teste Automático"
        >
          <Zap className="w-4 h-4 text-[#6205D5]" />
        </button>
      </section>

      {error && (
        <p className="text-red-400 text-xs text-center mt-2">{error}</p>
      )}

      {showConfigModal && (
        <Modal onClose={() => {
          setShowConfigModal(false);
          setSelectedCategory(null);
          setIsPending(false);
        }}>
          <div className="flex-1 p-3 relative">
            {isPending && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
                <RefreshCw className="w-8 h-8 text-[#6205D5] animate-spin" />
              </div>
            )}
            <header className="flex items-center gap-2 mb-4">
              {selectedCategory && (
                <button
                  onClick={handleBack}
                  className="p-1.5 -ml-1.5 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-[#b0a8ff]" />
                </button>
              )}
              <div className="w-10 h-10 rounded-full bg-[#26074d] flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#b0a8ff]" />
              </div>
              <div>
                <h1 className="text-lg font-medium text-[#b0a8ff]">
                  {selectedCategory ? selectedCategory.name : 'Configurações'}
                </h1>
                {selectedCategory && (
                  <p className="text-xs text-[#b0a8ff]/70">
                    {selectedCategory.items.length} configurações disponíveis
                  </p>
                )}
              </div>
            </header>

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

            <div className="flex gap-2 mb-4">
              {uniqueTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagFilter(tag)}
                  className="px-3 py-1 rounded-full bg-[#6205D5]/20 text-[#b0a8ff] text-xs"
                >
                  {tag}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 text-[#6205D5] animate-spin" />
              </div>
            ) : filteredConfigs.length > 0 ? (
              <div className="space-y-2 transition-all duration-300">
                {!selectedCategory ? (
                  filteredConfigs
                    .map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category)}
                        className="w-full p-3 rounded-lg glass-effect transition-all duration-200"
                      >
                        <div className="flex items-center justify-center">
                          <div className="flex-1">
                            <div className="flex items-center justify-center">
                              <h3 className="font-medium text-sm text-[#b0a8ff] text-center">
                                {category.name}
                              </h3>
                            </div>
                            <p className="text-xs text-[#b0a8ff]/70 mt-0.5 text-center">
                              {category.items.length} configurações disponíveis
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                ) : (
                  <div className="grid gap-1.5 transition-all duration-300">
                    {selectedCategory.items.map((config) => (
                      <button
                        key={config.id}
                        onClick={() => handleConfigSelect(config)}
                        className={`
                          w-full p-2.5 rounded-lg glass-effect transition-all duration-200
                          ${String(activeConfig?.id) === String(config.id) ? 'border-2 border-[#6205D5] bg-[#26074d]/40' : ''}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          {config.icon && (
                            <img 
                              src={config.icon} 
                              alt="" 
                              className="w-6 h-6 rounded-lg object-cover bg-[#26074d]"
                            />
                          )}
                          <div className="flex-1 text-center">
                            <h3 className="text-sm font-medium text-[#b0a8ff] text-center">
                              {config.name}
                            </h3>
                            <p className="text-[11px] text-[#b0a8ff]/70 text-center">
                              {config.description}
                            </p>
                          </div>
                          <div className="text-[10px] text-[#b0a8ff]/50 px-1.5 py-0.5 rounded-full bg-[#100322]/30 border border-[#6205D5]/10">
                            {config.mode}
                          </div>
                        </div>
                      </button>
                    ))}
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