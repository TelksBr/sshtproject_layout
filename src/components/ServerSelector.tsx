import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import { Settings, RefreshCw, CalendarClock, Wifi, AlertCircle, ChevronLeft, Search, Plane, Zap } from '../utils/icons';
import { getAllConfigs, checkUserStatus, getAirplaneState, toggleAirplaneMode, checkForUpdates, setActiveConfig } from '../utils/appFunctions';
import { Modal } from './modals/Modal';
import { ConfigCategory, ConfigItem } from '../types/config';
import { useActiveConfig } from '../context/ActiveConfigContext';
import { useAutoConnectContext } from '../context/AutoConnectContext';

export function ServerSelector() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configs, setConfigs] = useState<ConfigCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ConfigCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [airplaneMode, setAirplaneMode] = useState(() => {
    try { return getAirplaneState(); } catch { return false; }
  });

  const { activeConfig, setActiveConfigId, refreshActiveConfig } = useActiveConfig();
  const { homeEnabled, setHomeEnabled } = useAutoConnectContext();

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    if (showConfigModal) {
      loadConfigs();
    }
  }, [showConfigModal]);

  // Airplane mode: polling apenas quando o componente está montado, intervalo de 3s
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const state = getAirplaneState();
        setAirplaneMode(prev => prev !== state ? state : prev);
      } catch { /* silencioso */ }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadConfigs = useCallback(() => {
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
  }, [refreshActiveConfig]);

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
      setSearchInput('');
      setSearchTerm('');
    }
  }, [activeConfig, pendingConfigId]);

  const handleCategorySelect = (category: ConfigCategory) => {
    setSelectedCategory(category);
  };

  const handleBack = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  const handleUpdate = useCallback(() => {
    checkForUpdates();
    loadConfigs(); // Reload configs after update
  }, []);

  // Input de pesquisa: estado local para resposta imediata, debounce para filtragem
  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value); // Atualiza o input imediatamente (sem lag)
    
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchTerm(value); // Filtragem com debounce de 200ms
      setSelectedCategory(null);
    }, 200);
  }, []);

  // Cleanup do timer ao desmontar
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const toggleAirplaneModeHandler = async () => {
    const newState = !airplaneMode;
    const updatedState = await toggleAirplaneMode(newState);
    setAirplaneMode(updatedState); // Atualiza o estado com o valor retornado
  };

  const openConfigModal = useCallback(() => {
    setShowConfigModal(true);
  }, []);



  const filteredConfigs = configs
    .filter(category =>
      (category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())))
      && category.items.length > 0 // <-- só exibe categorias com configs
    );

  // Quando há pesquisa, cria lista plana de configs que correspondem ao termo
  const flatFilteredItems: (ConfigItem & { categoryName: string })[] = searchTerm
    ? configs.flatMap(category =>
        category.items
          .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(item => ({ ...item, categoryName: category.name }))
      )
    : [];

  const activeCategory = configs.find(category =>
    category.items.some(item => item.id === activeConfig?.id)
  );

  // Substitui o botão de AutoConnect para abrir o modal externo
  return (
    <>
      <section className="flex gap-1.5 server-selector-row">
        <div className="flex-1 min-w-0 max-w-full min-h-[44px] xl:min-h-[52px] 2xl:min-h-[60px] flex items-stretch rounded-xl glass-effect overflow-hidden">
          <button
            className="flex-shrink-0 min-w-[44px] flex items-center justify-center touch-manipulation"
            type="button"
            onClick={() => setHomeEnabled(!homeEnabled)}
            aria-pressed={homeEnabled}
            aria-label={homeEnabled ? 'Desativar Auto Conect' : 'Ativar Auto Conect'}
            style={homeEnabled ? { background: 'var(--accent-dim)' } : undefined}
          >
            <Zap
              className="w-4 h-4"
              style={{ color: homeEnabled ? 'var(--text)' : 'var(--accent)' }}
            />
          </button>

          <button
            className="flex-1 min-w-0 flex items-center justify-between px-2 xl:px-3 touch-manipulation"
            type="button"
            onClick={homeEnabled ? () => setHomeEnabled(false) : openConfigModal}
          >
            {homeEnabled ? (
              <div className="flex-1 min-w-0 text-center px-1">
                <span className="text-xs font-medium block truncate max-w-full" style={{ color: 'var(--text)' }}>
                  AUTO CONECT
                </span>
                <span className="text-[10px] block truncate max-w-full" style={{ color: 'var(--text-muted)' }}>
                  Todas as categorias
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Settings className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                  {activeConfig && (
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-center px-1">
                  {activeConfig ? (
                    <div className="space-y-0.5">
                      <span className="text-xs font-medium block truncate max-w-full" style={{ color: 'var(--text)' }}>
                        {activeConfig.name}
                      </span>
                      <span className="text-[10px] block truncate max-w-full" style={{ color: 'var(--text-muted)' }}>
                        {activeCategory?.name || 'Sem categoria'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-medium truncate block max-w-full" style={{ color: 'var(--text-muted)' }}>
                      ESCOLHA UMA CONFIGURAÇÃO
                    </span>
                  )}
                </div>

                <div className="flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  <ChevronLeft className="w-3 h-3 rotate-180" />
                </div>
              </>
            )}
          </button>
        </div>

        <button
          className="min-w-[44px] min-h-[44px] w-11 h-11 xl:w-12 xl:h-12 2xl:w-14 2xl:h-14 flex items-center justify-center rounded-xl glass-effect touch-manipulation flex-shrink-0"
          type="button"
          onClick={handleUpdate}
          aria-label="Atualizar configurações"
        >
          <RefreshCw className={`w-4 h-4 xl:w-5 xl:h-5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--accent)' }} />
        </button>

        <button
          className="min-w-[44px] min-h-[44px] w-11 h-11 xl:w-12 xl:h-12 2xl:w-14 2xl:h-14 flex items-center justify-center rounded-xl glass-effect touch-manipulation flex-shrink-0"
          type="button"
          onClick={checkUserStatus}
          aria-label="Check user"
        >
          <CalendarClock className="w-4 h-4 xl:w-5 xl:h-5" style={{ color: 'var(--accent)' }} />
        </button>

        <button
          className="min-w-[44px] min-h-[44px] w-11 h-11 xl:w-12 xl:h-12 2xl:w-14 2xl:h-14 flex items-center justify-center rounded-xl glass-effect touch-manipulation flex-shrink-0"
          type="button"
          onClick={toggleAirplaneModeHandler}
          aria-label="Modo avião"
          style={airplaneMode ? { background: 'var(--accent-dim)' } : undefined}
        >
          <Plane 
            className={`w-4 h-4 xl:w-5 xl:h-5 ${airplaneMode ? 'rotate-45' : ''}`}
            style={{ color: airplaneMode ? 'var(--text)' : 'var(--accent)' }}
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
            setSearchInput('');
            setSearchTerm('');
          }}
          title={selectedCategory ? selectedCategory.name : activeConfig ? activeConfig.name : 'Configurações'}
          icon={Settings}
        >
          <div className="flex-1 p-3 relative">
            {isPending && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
                <RefreshCw className="w-8 h-8 text-[#8b5cf6] animate-spin" />
              </div>
            )}
            
            {/* Header customizado para navegação e status */}
            <div className="flex items-center gap-2 mb-4">
              {selectedCategory && (
                <button
                  onClick={handleBack}
                  className="p-1.5 -ml-1.5 rounded-full transition-colors hover:bg-[#8b5cf6]/20"
                >
                  <ChevronLeft className="w-5 h-5 text-[#b7abc9]" />
                </button>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {/* Indicador de status quando há config ativa */}
                  {activeConfig && !selectedCategory && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40">
                      <div className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse" />
                      <span className="text-[10px] text-[#8b5cf6] font-bold">ATIVA</span>
                    </div>
                  )}
                </div>
                
                {selectedCategory ? (
                  <p className="text-xs text-[#b7abc9]/70">
                    {selectedCategory.items.length} configurações disponíveis
                  </p>
                ) : activeConfig ? (
                  <p className="text-xs text-[#b7abc9]/70">
                    Config atual: <span className="text-[#8b5cf6] font-medium">{activeConfig.name}</span> 
                    {activeCategory && ` • ${activeCategory.name}`}
                  </p>
                ) : (
                  <p className="text-xs text-[#b7abc9]/70">
                    Selecione uma configuração para conectar
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchInput}
                onChange={handleSearch}
                className="flex-1 p-2 rounded-lg glass-effect"
              />
              <Search className="w-5 h-5 text-[#b7abc9]" />
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 text-[#8b5cf6] animate-spin" />
              </div>
            ) : searchTerm && flatFilteredItems.length > 0 ? (
              <div className="grid gap-1.5">
                {flatFilteredItems.map((config) => {
                  const isActiveConfig = String(activeConfig?.id) === String(config.id);
                  return (
                    <button
                      key={config.id}
                      onClick={() => handleConfigSelect(config)}
                      className={`
                        w-full p-3 rounded-lg transition-colors duration-200 relative overflow-hidden
                        ${isActiveConfig 
                          ? 'border border-[#8b5cf6] bg-[#8b5cf6]/15'
                          : 'glass-effect'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          isActiveConfig 
                            ? 'bg-[#8b5cf6]'
                            : 'bg-[#8b5cf6]/20'
                        }`} />

                        {config.icon && (
                          <img 
                            src={config.icon} 
                            alt="" 
                            className={`w-6 h-6 rounded-lg object-cover ${
                              isActiveConfig 
                                ? 'ring-2 ring-[#8b5cf6]/60 shadow-md' 
                                : 'bg-[#1a1624]'
                            }`}
                          />
                        )}
                        
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-sm font-medium truncate transition-colors ${
                              isActiveConfig ? 'text-white' : 'text-[#b7abc9]'
                            }`}>
                              {config.name}
                            </h3>
                            {isActiveConfig && (
                              <div className="px-2 py-0.5 rounded-full bg-[#8b5cf6] text-white text-[9px] font-bold flex-shrink-0">
                                EM USO
                              </div>
                            )}
                          </div>
                          <p className={`text-[11px] truncate transition-colors ${
                            isActiveConfig ? 'text-[#b7abc9]' : 'text-[#b7abc9]/70'
                          }`}>
                            {config.description}
                          </p>
                          <p className="text-[10px] text-[#b7abc9]/40 mt-0.5 truncate">
                            {config.categoryName}
                          </p>
                        </div>
                        
                        <div className={`text-[10px] px-2 py-1 rounded-full border transition-colors flex-shrink-0 ${
                          isActiveConfig 
                            ? 'bg-[#8b5cf6] text-white border-[#8b5cf6]/60 shadow-md' 
                            : 'text-[#b7abc9]/50 bg-[#14111c]/30 border-[#8b5cf6]/10'
                        }`}>
                          {config.mode?.toUpperCase()}
                        </div>
                      </div>
                      
                      {isActiveConfig && (
                        <div className="absolute left-0 top-0 w-1 h-full bg-[#8b5cf6] rounded-l-lg" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : filteredConfigs.length > 0 ? (
              <div className="space-y-2">
                {!selectedCategory ? (
                  filteredConfigs
                    .map((category) => {
                      const isActiveCategory = category.items.some(item => item.id === activeConfig?.id);
                      return (
                        <button
                          key={category.id}
                          onClick={() => handleCategorySelect(category)}
                          className={`w-full p-3 rounded-lg transition-colors duration-200 relative ${
                            isActiveCategory 
                              ? 'glass-effect border border-[#8b5cf6]/50 bg-[#8b5cf6]/10'
                              : 'glass-effect'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {/* Indicador visual da categoria ativa */}
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                isActiveCategory 
                                  ? 'bg-[#8b5cf6]'
                                  : 'bg-[#8b5cf6]/20'
                              }`} />
                              
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <h3 className={`font-medium text-sm transition-colors ${
                                    isActiveCategory ? 'text-white' : 'text-[#b7abc9]'
                                  }`}>
                                    {category.name}
                                  </h3>
                                  {isActiveCategory && (
                                    <div className="px-2 py-0.5 rounded-full bg-[#8b5cf6] text-white text-[10px] font-bold">
                                      ATIVA
                                    </div>
                                  )}
                                </div>
                                <p className={`text-xs mt-0.5 transition-colors ${
                                  isActiveCategory ? 'text-[#b7abc9]' : 'text-[#b7abc9]/70'
                                }`}>
                                  {category.items.length} configurações disponíveis
                                </p>
                              </div>
                            </div>
                            
                            {/* Seta indicativa */}
                            <div className={`ml-2 transition-colors duration-200 ${
                              isActiveCategory ? 'text-[#8b5cf6]' : 'text-[#b7abc9]/40'
                            }`}>
                              <ChevronLeft className="w-4 h-4 rotate-180" />
                            </div>
                          </div>
                          
                          {/* Linha de destaque para categoria ativa */}
                          {isActiveCategory && (
                            <div className="absolute left-0 top-0 w-1 h-full bg-[#8b5cf6] rounded-l-lg" />
                          )}
                        </button>
                      );
                    })
                ) : (
                  <div className="grid gap-1.5">
                    {selectedCategory.items.map((config) => {
                      const isActiveConfig = String(activeConfig?.id) === String(config.id);
                      return (
                        <button
                          key={config.id}
                          onClick={() => handleConfigSelect(config)}
                          className={`
                            w-full p-3 rounded-lg transition-colors duration-200 relative overflow-hidden
                            ${isActiveConfig 
                              ? 'border border-[#8b5cf6] bg-[#8b5cf6]/15'
                              : 'glass-effect'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 relative z-10">
                            {/* Indicador visual da config ativa */}
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              isActiveConfig 
                                ? 'bg-[#8b5cf6]'
                                : 'bg-[#8b5cf6]/20'
                            }`} />

                            {/* Ícone da configuração */}
                            {config.icon && (
                              <img 
                                src={config.icon} 
                                alt="" 
                                className={`w-6 h-6 rounded-lg object-cover ${
                                  isActiveConfig 
                                    ? 'ring-2 ring-[#8b5cf6]/60 shadow-md' 
                                    : 'bg-[#1a1624]'
                                }`}
                              />
                            )}
                            
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`text-sm font-medium truncate transition-colors ${
                                  isActiveConfig ? 'text-white' : 'text-[#b7abc9]'
                                }`}>
                                  {config.name}
                                </h3>
                                {isActiveConfig && (
                                  <div className="px-2 py-0.5 rounded-full bg-[#8b5cf6] text-white text-[9px] font-bold flex-shrink-0">
                                    EM USO
                                  </div>
                                )}
                              </div>
                              <p className={`text-[11px] truncate transition-colors ${
                                isActiveConfig ? 'text-[#b7abc9]' : 'text-[#b7abc9]/70'
                              }`}>
                                {config.description}
                              </p>
                            </div>
                            
                            {/* Badge do modo */}
                            <div className={`text-[10px] px-2 py-1 rounded-full border transition-colors flex-shrink-0 ${
                              isActiveConfig 
                                ? 'bg-[#8b5cf6] text-white border-[#8b5cf6]/60 shadow-md' 
                                : 'text-[#b7abc9]/50 bg-[#14111c]/30 border-[#8b5cf6]/10'
                            }`}>
                              {config.mode?.toUpperCase()}
                            </div>
                          </div>
                          
                          {/* Linha de destaque e efeito de brilho para config ativa */}
                          {isActiveConfig && (
                            <div className="absolute left-0 top-0 w-1 h-full bg-[#8b5cf6] rounded-l-lg" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg glass-effect text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#1a1624]/50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-[#b7abc9]" />
                </div>
                <h3 className="text-base font-medium text-[#b7abc9] mb-2">
                  Nenhuma Configuração Encontrada
                </h3>
                <p className="text-sm text-[#b7abc9]/70 mb-4">
                  Para baixar as configurações mais recentes, é necessário ter uma conexão estável com a internet.
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[#b7abc9]/50">
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs">Verifique sua conexão e tente novamente</span>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

export default memo(ServerSelector);