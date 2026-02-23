import { useState, useEffect, Fragment } from 'react';
import { Modal } from './Modal';
import { Plan, PaymentStep, PurchaseRequest, PurchaseResponse, CredentialsResponse } from '../../types/sales';
import { getPlans, createPurchase, formatPrice, formatDate } from '../../utils/salesUtils';
import { validateEmail } from '../../utils/emailValidation';
import { generateQRCodeDataURL, isValidPixCode } from '../../utils/qrCodeGenerator';
import usePaymentPolling from '../../hooks/usePaymentPolling';
import { purchaseStorage, PendingPurchase } from '../../utils/purchaseStorageManager';
import { ShoppingCart } from '../../utils/icons';
import { copyToClipboard } from '../../utils/nativeClipboard';
import { navigateToUrl, reloadApp } from '../../utils/nativeNavigation';

interface PurchaseModalProps {
  onClose: () => void;
}

export function PurchaseModal({ onClose }: PurchaseModalProps) {
  // Estados principais
  const [currentStep, setCurrentStep] = useState<PaymentStep>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados do processo de pagamento
  const [purchaseData, setPurchaseData] = useState<PurchaseResponse | null>(null);
  const [credentials, setCredentials] = useState<CredentialsResponse | null>(null);
  const [generatedQRCode, setGeneratedQRCode] = useState<string | null>(null);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);

  // Hook de polling simplificado para verificar credenciais
  const { 
    credentials: hookCredentials, 
    isPolling, 
    error: pollingError,
    attempts,
    maxAttempts,
    resetPolling
  } = usePaymentPolling(purchaseData?.payment_id || null);

  // Sincronizar credenciais do hook com estado local
  useEffect(() => {
    // Só processa se realmente tiver credenciais E status completed
    if (hookCredentials && hookCredentials.status === 'completed') {
      setCredentials(hookCredentials);
      
      // 💾 Salvar credenciais quando modal está aberto
      // purchaseStorage.saveCredentials verifica duplicação automaticamente
      const label = selectedPlan?.name 
        ? `Compra ${selectedPlan.name}` 
        : 'Compra Recente';
      
      purchaseStorage.saveCredentials(hookCredentials, label);
      
      if (currentStep === 'payment') {
        setCurrentStep('success');
      }
    }
  }, [hookCredentials, currentStep, selectedPlan]);

  // Carregar planos ao montar o componente
  useEffect(() => {
    loadPlans();
  }, []);

  // Gerar QR Code quando os dados de compra chegarem
  useEffect(() => {
    async function generateQRCode() {
      if (!purchaseData?.qr_code && !purchaseData?.ticket_url) return;

      try {
        // Preferir qr_code se disponível, senão usar ticket_url
        const pixCode = purchaseData.qr_code || purchaseData.ticket_url;

        if (!pixCode) {
          return;
        }

        setQrCodeError(null);

        // Verificar se é um código PIX válido
        if (isValidPixCode(pixCode)) {
          const qrCodeDataURL = await generateQRCodeDataURL(pixCode, {
            size: 256,
            margin: 4,
            colorDark: '#000000',
            colorLight: '#FFFFFF'
          });
          setGeneratedQRCode(qrCodeDataURL);
        } else {
          setQrCodeError('Código PIX inválido recebido da API');
        }
      } catch (error) {
        setQrCodeError(`Erro ao gerar QR Code: ${error}`);
      }
    }

    generateQRCode();
  }, [purchaseData]);

  async function loadPlans() {
    try {
      setIsLoading(true);
      setError('');
      const plansData = await getPlans();
      setPlans(plansData);
    } catch (err) {
      setError('Erro ao carregar planos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  function handlePlanSelect(plan: Plan) {
    setSelectedPlan(plan);
    setCurrentStep('email');
  }

  function handleEmailSubmit() {
    // Validar nome
    if (!customerName.trim()) {
      setEmailError('Nome é obrigatório');
      return;
    }
    
    // Validação de email robusta
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || 'Email inválido');
      return;
    }

    setEmailError('');
    setCurrentStep('confirm');
  }

  async function handlePurchaseConfirm() {
    if (!selectedPlan) return;

    try {
      setIsLoading(true);
      setError('');

      const purchaseRequest: PurchaseRequest = {
        plan_id: selectedPlan.id,
        customer_email: email.trim(),
        customer_name: customerName.trim() || 'Cliente'
      };

      const response = await createPurchase(purchaseRequest);
      setPurchaseData(response);
      
      // 💾 Salvar compra pendente no localStorage
      const pendingPurchase: PendingPurchase = {
        order_id: response.order_id || response.invoice_id,
        payment_id: response.payment_id,
        amount: response.amount,
        created_at: new Date().toISOString(),
        expires_at: response.expires_in 
          ? new Date(Date.now() + response.expires_in * 60 * 1000).toISOString()
          : new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Default 15 min
        status: 'pending',
        customer_email: email.trim(),
        plan_name: selectedPlan.name,
        qr_code: response.qr_code,
        ticket_url: response.ticket_url
      };
      
      purchaseStorage.savePendingPurchase(pendingPurchase);
      
      setCurrentStep('payment');
      
      // O polling será iniciado automaticamente pelo hook
    } catch (err) {
      const error = err as Error;
      setError(`Erro ao criar compra: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    // Cleanup completo para evitar vazamentos e polling residual
    setCurrentStep('plans');
    setSelectedPlan(null);
    setEmail('');
    setEmailError('');
    setError('');
    setPurchaseData(null);
    setCredentials(null);
    
    resetPolling();
    
    onClose();
  }

  // Cleanup quando o componente é desmontado
  useEffect(() => {
    return () => {
      resetPolling();
    };
  }, [resetPolling]);

  function handleCopyToClipboard(text: string, type: string = 'texto') {
    // Função para copiar via SDK ou APIs nativas do browser
    copyToClipboard(text).then((success) => {
      if (success) {
        setError(`✅ ${type} copiado com sucesso!`);
        setTimeout(() => {
          setError('');
        }, 2000);
      } else {
        setError(`❌ Erro ao copiar ${type}. Tente selecionar e copiar manualmente.`);
        setTimeout(() => setError(''), 3000);
      }
    });
  }

  // Renderizar conteúdo baseado no step atual
  function renderStepContent() {
    switch (currentStep) {
      case 'plans':
        return (
          <div className="w-full space-y-3 sm:space-y-4">
            {/* Cabeçalho */}
            <div className="text-center">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-0.5 sm:mb-1">
                Escolha seu Plano
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Selecione a opção que melhor se adequa a você
              </p>
            </div>

            {/* Lista de planos */}
            {isLoading ? (
              <div className="flex justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6205D5] border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handlePlanSelect(plan)}
                    className="
                      group relative
                      w-full text-left
                      p-3 sm:p-4
                      rounded-lg sm:rounded-xl
                      border-2 border-[#6205D5]/30 hover:border-[#6205D5]/70
                      bg-[#1a0533]/80 hover:bg-[#26074d]/95
                      active:scale-95 hover:scale-105
                      transition-all duration-200
                      touch-manipulation
                      overflow-hidden
                      min-h-[140px] sm:min-h-[160px]
                      flex flex-col
                    "
                  >
                    {/* Gradiente de fundo ao passar */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6205D5]/0 to-[#6205D5]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    {/* Conteúdo */}
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Nome e descrição */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm sm:text-base line-clamp-2">
                          {plan.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-2">
                          {plan.description}
                        </p>
                      </div>

                      {/* Protocolo */}
                      <div className="flex flex-wrap gap-1 mt-2 mb-2">
                        {plan.protocols && plan.protocols.length > 0 ? (
                          plan.protocols.slice(0, 2).map((protocol) => (
                            <span
                              key={protocol}
                              className="
                                px-1.5 py-0.5 sm:px-2 sm:py-1
                                bg-[#6205D5]/50 text-[#b0a8ff]
                                text-[10px] sm:text-xs font-medium
                                rounded-md
                              "
                            >
                              {protocol.toUpperCase()}
                            </span>
                          ))
                        ) : (
                          <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-[#6205D5]/50 text-[#b0a8ff] text-[10px] sm:text-xs font-medium rounded-md">
                            SSH/V2RAY
                          </span>
                        )}
                      </div>

                      {/* Preço e duração */}
                      <div className="flex items-baseline justify-between border-t border-[#6205D5]/20 pt-2 mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                            Por {(plan.duration_days || plan.validate || 30)}d
                          </span>
                          <span className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">
                            {formatPrice(plan.price)}
                          </span>
                        </div>
                        <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">
                          →
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'email':
        return (
          <div className="w-full space-y-3 sm:space-y-4">
            {/* Cabeçalho */}
            <div className="text-center">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-0.5 sm:mb-1">
                Seus Dados
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Preencha para receber as credenciais
              </p>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Nome completo
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="
                  w-full min-h-[44px] sm:min-h-[48px]
                  px-3 sm:px-4 py-2
                  bg-[#1a0533]/50 border-2 border-[#6205D5]/30
                  rounded-lg text-white text-sm sm:text-base
                  focus:outline-none focus:border-[#6205D5]/70 focus:bg-[#1a0533]/70
                  transition-all placeholder-gray-500
                "
                placeholder="João Silva"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
                className="
                  w-full min-h-[44px] sm:min-h-[48px]
                  px-3 sm:px-4 py-2
                  bg-[#1a0533]/50 border-2 border-[#6205D5]/30
                  rounded-lg text-white text-sm sm:text-base
                  focus:outline-none focus:border-[#6205D5]/70 focus:bg-[#1a0533]/70
                  transition-all placeholder-gray-500
                "
                placeholder="seu@email.com"
              />
              {emailError && (
                <p className="text-red-400 text-xs sm:text-sm mt-1.5 font-medium">{emailError}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
              <button
                onClick={() => setCurrentStep('plans')}
                className="
                  flex-1 min-h-[44px] sm:min-h-[48px]
                  px-3 sm:px-4
                  bg-[#26074d]/80 hover:bg-[#26074d] border-2 border-[#6205D5]/30 hover:border-[#6205D5]/60
                  text-white text-sm sm:text-base font-medium
                  rounded-lg transition-all active:scale-95
                "
              >
                Voltar
              </button>
              <button
                onClick={handleEmailSubmit}
                className="
                  flex-1 min-h-[44px] sm:min-h-[48px]
                  px-3 sm:px-4
                  bg-[#6205D5] hover:bg-[#7a19eb] text-white text-sm sm:text-base font-medium
                  rounded-lg transition-all active:scale-95
                "
              >
                Continuar
              </button>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="w-full space-y-3 sm:space-y-4">
            {/* Cabeçalho */}
            <div className="text-center">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-0.5 sm:mb-1">
                Confirmar Compra
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Revise os dados antes de finalizar
              </p>
            </div>

            {/* Resumo do plano */}
            {selectedPlan && (
              <div className="bg-[#1a0533]/50 border-2 border-[#6205D5]/30 p-3 sm:p-4 rounded-lg space-y-2 sm:space-y-3">
                <h4 className="font-semibold text-white text-sm sm:text-base">{selectedPlan.name}</h4>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Preço:</span>
                    <span className="text-green-400 font-semibold">{formatPrice(selectedPlan.price)}</span>
                  </div>
                  <div className="border-t border-[#6205D5]/20 pt-1.5 sm:pt-2 mt-1.5 sm:mt-2">
                    <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                      <div>
                        <span className="text-gray-500">Duração:</span>
                        <div className="text-white font-medium">{selectedPlan.duration_days || selectedPlan.validate || 30}d</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Protocolo:</span>
                        <div className="text-white font-medium">
                          {selectedPlan.protocols && selectedPlan.protocols.length > 0 
                            ? selectedPlan.protocols[0].toUpperCase()
                            : 'SSH/V2RAY'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-[#6205D5]/20 pt-1.5 sm:pt-2 mt-1.5 sm:mt-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-[10px] sm:text-xs">Nome:</span>
                      <span className="text-white text-xs sm:text-sm font-medium truncate">{customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-[10px] sm:text-xs">Email:</span>
                      <span className="text-white text-xs sm:text-sm font-medium truncate">{email}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
              <button
                onClick={() => setCurrentStep('email')}
                className="
                  flex-1 min-h-[44px] sm:min-h-[48px]
                  px-3 sm:px-4
                  bg-[#26074d]/80 hover:bg-[#26074d] border-2 border-[#6205D5]/30 hover:border-[#6205D5]/60
                  text-white text-sm sm:text-base font-medium
                  rounded-lg transition-all active:scale-95
                "
              >
                Voltar
              </button>
              <button
                onClick={handlePurchaseConfirm}
                disabled={isLoading}
                className="
                  flex-1 min-h-[44px] sm:min-h-[48px]
                  px-3 sm:px-4
                  bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:opacity-50
                  text-white text-sm sm:text-base font-medium
                  rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2
                "
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span className="hidden sm:inline">Processando...</span>
                  </>
                ) : (
                  'Finalizar Compra'
                )}
              </button>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="w-full space-y-3 sm:space-y-4">
            {/* Cabeçalho */}
            <div className="text-center">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-0.5 sm:mb-1">
                Pagamento PIX
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Complete o pagamento para ativar
              </p>
            </div>

            {purchaseData && (
              <div className="space-y-3 sm:space-y-4">
                {/* Valor do pagamento */}
                <div className="bg-green-900/30 border-2 border-green-600/50 p-2.5 sm:p-3 rounded-lg text-center">
                  <div className="text-green-300/80 text-xs sm:text-sm">Valor a pagar:</div>
                  <div className="text-green-400 text-xl sm:text-2xl lg:text-3xl font-bold">
                    {formatPrice(purchaseData.amount)}
                  </div>
                </div>

                {/* QR Code Visual Gerado Dinamicamente */}
                {generatedQRCode ? (
                  <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 p-3 sm:p-4 rounded-lg border-2 border-blue-600/30">
                    <div className="text-center">
                      <p className="text-white mb-2 sm:mb-3 font-semibold text-xs sm:text-sm">📱 Escaneie o QR Code PIX</p>
                      
                      <div className="bg-white p-2.5 sm:p-3 rounded-lg inline-block mb-2 sm:mb-3 shadow-lg">
                        <img 
                          src={generatedQRCode}
                          alt="QR Code PIX"
                          className="w-[min(70vw,200px)] sm:w-[min(60vw,240px)] h-[min(70vw,200px)] sm:h-[min(60vw,240px)] mx-auto block"
                          onLoad={() => {
                            // QR Code carregado
                          }}
                          onError={() => {
                            // Erro ao carregar QR Code visual
                          }}
                        />
                      </div>

                      <div className="text-xs sm:text-sm text-blue-100 bg-blue-900/50 p-2 sm:p-2.5 rounded">
                        💡 Abra seu banco e escaneie
                      </div>
                    </div>
                  </div>
                ) : qrCodeError ? (
                  <div className="bg-gradient-to-br from-red-900/50 to-red-800/50 p-3 sm:p-4 rounded-lg border-2 border-red-600/30">
                    <div className="text-center space-y-2">
                      <p className="text-white font-semibold text-xs sm:text-sm">❌ Erro ao gerar QR Code</p>
                      
                      <div className="bg-red-950/50 p-2 sm:p-2.5 rounded border border-red-700/30">
                        <div className="text-red-300 text-xs line-clamp-2">{qrCodeError}</div>
                      </div>

                      <div className="text-xs text-red-200 bg-red-900/30 p-2 rounded">
                        💡 Use o código PIX abaixo
                      </div>
                    </div>
                  </div>
                ) : (purchaseData.qr_code || purchaseData.ticket_url) ? (
                  <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 p-3 sm:p-4 rounded-lg border-2 border-blue-600/30">
                    <div className="text-center">
                      <p className="text-white mb-2 sm:mb-3 font-semibold text-xs sm:text-sm">📱 Gerando QR Code PIX</p>
                      
                      <div className="bg-white p-2.5 sm:p-3 rounded inline-block mb-2 sm:mb-3 shadow-lg">
                        <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center bg-gray-100 text-gray-600 text-xs p-2 rounded">
                          <div className="text-center">
                            <div className="text-2xl mb-1 animate-spin">⚙️</div>
                            <div className="font-semibold text-[10px] sm:text-xs">Gerando</div>
                            <div className="text-[9px] mt-1 text-gray-500">Aguarde...</div>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-blue-200 bg-blue-900/30 p-2 rounded">
                        ⏳ Processando sua solicitação
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* SEPARADOR VISUAL */}
                {purchaseData.qr_code && purchaseData.ticket_url && (
                  <div className="flex items-center gap-2 my-2 sm:my-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#6205D5]/30 to-transparent"></div>
                    <span className="text-gray-400 font-semibold text-xs sm:text-sm px-2">OU</span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#6205D5]/30 to-transparent"></div>
                  </div>
                )}

                {/* Código PIX Copia e Cola */}
                {purchaseData.qr_code && (
                  <div className="bg-gradient-to-br from-[#1a3a1a]/50 to-[#0a2a0a]/50 p-2.5 sm:p-3 rounded-lg border-2 border-green-600/30">
                    <p className="text-white mb-2 font-semibold text-xs sm:text-sm">💳 PIX Copia e Cola</p>
                    
                    <div className="bg-[#0a0a0a] p-2 sm:p-2.5 rounded border border-[#6205D5]/20 mb-2">
                      <div className="text-[10px] sm:text-xs text-gray-500 mb-1 uppercase tracking-wider">Código:</div>
                      <div className="font-mono text-[10px] sm:text-xs text-green-400 break-all leading-relaxed bg-[#0a0a0a] p-2 rounded border-l-2 border-green-500 max-h-16 overflow-auto custom-scrollbar">
                        {purchaseData.qr_code}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const pixCode = purchaseData.qr_code || '';
                        if (!pixCode) {
                          setError('Código PIX não disponível. Tente atualizar a página.');
                          return;
                        }
                        handleCopyToClipboard(pixCode, 'Código PIX');
                      }}
                      className="
                        w-full min-h-[44px] sm:min-h-[48px]
                        px-3 sm:px-4
                        bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400
                        text-white text-sm sm:text-base font-medium
                        rounded-lg transition-all active:scale-95
                      "
                    >
                      📋 Copiar Código
                    </button>
                  </div>
                )}

                {/* Link de Pagamento Alternativo */}
                {purchaseData.ticket_url && (
                  <div className="bg-gradient-to-br from-[#3a2400]/50 to-[#1a1200]/50 p-2.5 sm:p-3 rounded-lg border-2 border-orange-600/30">
                    <p className="text-white mb-2 font-semibold text-xs sm:text-sm">🔗 Mercado Pago</p>
                    
                    <div className="bg-[#0a0a0a] p-2 sm:p-2.5 rounded border border-[#6205D5]/20 mb-2">
                      <div className="text-[10px] sm:text-xs text-gray-500 mb-1 uppercase tracking-wider">Link:</div>
                      <div className="font-mono text-[10px] sm:text-xs text-orange-300 break-all leading-relaxed bg-[#0a0a0a] p-2 rounded border-l-2 border-orange-500 max-h-12 overflow-hidden">
                        {purchaseData.ticket_url.substring(0, 50)}...
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        navigateToUrl(purchaseData.ticket_url);
                      }}
                      className="
                        w-full min-h-[44px] sm:min-h-[48px]
                        px-3 sm:px-4
                        bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400
                        text-white text-sm sm:text-base font-medium
                        rounded-lg transition-all active:scale-95
                      "
                    >
                      🌐 Abrir Mercado Pago
                    </button>
                  </div>
                )}

                {/* Informações do pagamento */}
                <div className="bg-[#1a0533]/50 border-2 border-[#6205D5]/30 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">💰 Valor:</span>
                    <span className="text-green-400 font-semibold">{formatPrice(purchaseData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">🆔 ID:</span>
                    <span className="text-white font-mono text-[9px] sm:text-xs truncate">{purchaseData.payment_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">⏱️ Limite:</span>
                    <span className="text-white font-semibold">{purchaseData.expires_in || 15}m</span>
                  </div>
                </div>

                {/* Informações opcionais */}
                {purchaseData.username && (
                  <div className="bg-[#1a0533]/50 border-2 border-[#6205D5]/30 p-2.5 sm:p-3 rounded-lg">
                    <p className="text-white text-xs sm:text-sm">
                      <span className="text-gray-400">👤 Usuário:</span>
                      <span className="font-mono ml-1 text-green-400">{purchaseData.username}</span>
                    </p>
                  </div>
                )}

                {/* Status do polling */}
                <div className="bg-[#1a0533]/50 border-2 border-[#6205D5]/30 p-2.5 sm:p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-gray-400 text-xs sm:text-sm font-semibold">Status:</span>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {isPolling && (
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-[#6205D5] border-t-transparent"></div>
                      )}
                      <span className={`font-semibold text-xs sm:text-sm ${
                        !credentials ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {!credentials ? '⏳ Aguardando...' : '✅ Aprovado!'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">
                    {attempts}/{maxAttempts} • a cada 5s
                  </div>
                </div>

                {pollingError && (
                  <div className="bg-red-900/30 border-2 border-red-600/30 p-2 sm:p-2.5 rounded-lg">
                    <p className="text-red-300 text-xs sm:text-sm">❌ {pollingError}</p>
                  </div>
                )}

                {/* Instruções compactas */}
                <div className="bg-blue-900/30 border-2 border-blue-600/30 p-2.5 sm:p-3 rounded-lg">
                  <div className="text-blue-200 text-xs sm:text-sm space-y-0.5 sm:space-y-1">
                    <div className="font-semibold">📋 Como pagar:</div>
                    <div className="text-[10px] sm:text-xs text-blue-300/80 space-y-0.5">
                      <div>1️⃣ Abra seu banco</div>
                      <div>2️⃣ Procure PIX/QR Code</div>
                      <div>3️⃣ Escaneie ou copie</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Credenciais recebidas */}
            {credentials && (
              <div className="bg-green-900/30 border-2 border-green-600/30 p-2.5 sm:p-3 rounded-lg">
                <div className="text-green-300 text-xs sm:text-sm mb-1">✅ Credenciais ativadas!</div>
                <div className="text-[10px] sm:text-xs text-green-400/80 space-y-0.5">
                  <div>Status: {credentials.status}</div>
                  {credentials.ssh_credentials && (
                    <div>SSH: {credentials.ssh_credentials.username}</div>
                  )}
                  {credentials.v2ray_credentials && (
                    <div>V2Ray: {credentials.v2ray_credentials.uuid.substring(0, 8)}...</div>
                  )}
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
              <button
                onClick={() => setCurrentStep('plans')}
                className="
                  flex-1 min-h-[44px] sm:min-h-[48px]
                  px-3 sm:px-4
                  bg-[#26074d]/80 hover:bg-[#26074d] border-2 border-[#6205D5]/30 hover:border-[#6205D5]/60
                  text-white text-sm sm:text-base font-medium
                  rounded-lg transition-all active:scale-95
                "
              >
                ← Voltar
              </button>
              <button
                onClick={() => {
                  if (!isPolling && currentStep === 'payment') {
                    reloadApp();
                  }
                }}
                disabled={isPolling}
                className="
                  flex-1 min-h-[44px] sm:min-h-[48px]
                  px-3 sm:px-4
                  bg-[#6205D5] hover:bg-[#7a19eb] disabled:bg-[#6205D5]/50 disabled:opacity-60
                  text-white text-sm sm:text-base font-medium
                  rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2
                "
              >
                <span>🔄</span>
                <span className="hidden sm:inline">{isPolling ? 'Verificando...' : 'Verificar'}</span>
                <span className="sm:hidden">{isPolling ? '...' : 'OK'}</span>
              </button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="w-full space-y-3 sm:space-y-4">
            {/* Cabeçalho de sucesso */}
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600/80 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-0.5 sm:mb-1">
                Pagamento Aprovado!
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Suas credenciais estão prontas
              </p>
            </div>

            {credentials && (
              <div className="space-y-2.5 sm:space-y-3">
                {/* Plano */}
                {credentials.plan && (
                  <div className="bg-green-900/20 border-2 border-green-600/30 p-2.5 sm:p-3 rounded-lg">
                    <h4 className="font-semibold text-white text-xs sm:text-sm mb-1.5 flex items-center gap-1">
                      <span>📦</span>
                      <span>Plano</span>
                      <span className="px-1.5 py-0.5 bg-green-600/50 text-[10px] rounded">ATIVO</span>
                    </h4>
                    <div className="space-y-1 text-[10px] sm:text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Plano:</span>
                        <span className="text-white font-medium">{credentials.plan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Preço:</span>
                        <span className="text-green-400 font-semibold">{formatPrice(credentials.plan.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Validade:</span>
                        <span className="text-white">{credentials.plan.validate_days}d</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SSH */}
                {credentials.ssh_credentials && (
                  <div className="bg-blue-900/20 border-2 border-blue-600/30 p-2.5 sm:p-3 rounded-lg">
                    <h4 className="font-semibold text-white text-xs sm:text-sm mb-1.5 flex items-center gap-1">
                      <span>🔐</span>
                      <span>SSH</span>
                      <span className="px-1.5 py-0.5 bg-blue-600/50 text-[10px] rounded">ATIVO</span>
                    </h4>
                    <div className="space-y-1 text-[10px] sm:text-xs">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-gray-400 flex-shrink-0">User:</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="font-mono text-white text-[9px] sm:text-xs truncate">{credentials.ssh_credentials?.username || 'N/A'}</span>
                          <button
                            onClick={() => handleCopyToClipboard(credentials.ssh_credentials?.username || '', 'Usuário SSH')}
                            className="text-blue-300 hover:text-blue-200 flex-shrink-0"
                            title="Copiar"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-gray-400 flex-shrink-0">Pass:</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="font-mono text-white text-[9px] sm:text-xs truncate">{credentials.ssh_credentials?.password || 'N/A'}</span>
                          <button
                            onClick={() => handleCopyToClipboard(credentials.ssh_credentials?.password || '', 'Senha SSH')}
                            className="text-blue-300 hover:text-blue-200 flex-shrink-0"
                            title="Copiar"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Conexões:</span>
                        <span className="text-yellow-400">{credentials.ssh_credentials?.limit || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Expira:</span>
                        <span className="text-orange-300">{credentials.ssh_credentials?.expiration_date ? formatDate(credentials.ssh_credentials.expiration_date) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* V2RAY */}
                {credentials.v2ray_credentials && (
                  <div className="bg-purple-900/20 border-2 border-purple-600/30 p-2.5 sm:p-3 rounded-lg">
                    <h4 className="font-semibold text-white text-xs sm:text-sm mb-1.5 flex items-center gap-1">
                      <span>🌐</span>
                      <span>V2Ray</span>
                      <span className="px-1.5 py-0.5 bg-purple-600/50 text-[10px] rounded">ATIVO</span>
                    </h4>
                    <div className="space-y-1 text-[10px] sm:text-xs">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-gray-400 flex-shrink-0">UUID:</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="font-mono text-white text-[8px] sm:text-[9px] truncate">{credentials.v2ray_credentials?.uuid?.substring(0, 16) || 'N/A'}...</span>
                          <button
                            onClick={() => handleCopyToClipboard(credentials.v2ray_credentials?.uuid || '', 'UUID V2Ray')}
                            className="text-purple-300 hover:text-purple-200 flex-shrink-0"
                            title="Copiar UUID completo"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Conexões:</span>
                        <span className="text-yellow-400">{credentials.v2ray_credentials?.limit || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Expira:</span>
                        <span className="text-orange-300">{credentials.v2ray_credentials?.expiration_date ? formatDate(credentials.v2ray_credentials.expiration_date) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SSH Legado */}
                {credentials.ssh && !credentials.ssh_credentials && (
                  <div className="bg-blue-900/20 border-2 border-blue-600/30 p-2.5 sm:p-3 rounded-lg">
                    <h4 className="font-semibold text-white text-xs sm:text-sm mb-1.5 flex items-center gap-1">
                      <span>🔐</span>
                      <span>SSH Legado</span>
                    </h4>
                    <div className="space-y-1 text-[10px] sm:text-xs">
                      {credentials.ssh?.host && (
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-gray-400">Host:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-white text-[9px] truncate">{credentials.ssh.host}</span>
                            <button onClick={() => handleCopyToClipboard(credentials.ssh?.host || '', 'Host')} className="text-blue-300 hover:text-blue-200">📋</button>
                          </div>
                        </div>
                      )}
                      {credentials.ssh?.port && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Porta:</span>
                          <span className="font-mono text-white">{credentials.ssh.port}</span>
                        </div>
                      )}
                      {credentials.ssh?.username && (
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-gray-400">User:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-white text-[9px] truncate">{credentials.ssh.username}</span>
                            <button onClick={() => handleCopyToClipboard(credentials.ssh?.username || '', 'User')} className="text-blue-300 hover:text-blue-200">📋</button>
                          </div>
                        </div>
                      )}
                      {credentials.ssh?.password && (
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-gray-400">Pass:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-white text-[9px] truncate">{credentials.ssh.password}</span>
                            <button onClick={() => handleCopyToClipboard(credentials.ssh?.password || '', 'Pass')} className="text-blue-300 hover:text-blue-200">📋</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* V2Ray Legado */}
                {credentials.v2ray && !credentials.v2ray_credentials && (
                  <div className="bg-purple-900/20 border-2 border-purple-600/30 p-2.5 sm:p-3 rounded-lg">
                    <h4 className="font-semibold text-white text-xs sm:text-sm mb-1.5 flex items-center gap-1">
                      <span>🌐</span>
                      <span>V2Ray Legado</span>
                    </h4>
                    <div className="space-y-1 text-[10px] sm:text-xs">
                      {credentials.v2ray?.uuid && (
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-gray-400">UUID:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-white text-[8px] truncate">{credentials.v2ray.uuid.substring(0, 16)}...</span>
                            <button onClick={() => handleCopyToClipboard(credentials.v2ray?.uuid || '', 'UUID')} className="text-purple-300 hover:text-purple-200">📋</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="bg-blue-900/20 border-2 border-blue-600/30 p-2.5 sm:p-3 rounded-lg text-center">
                  <p className="text-blue-200 text-[10px] sm:text-xs">
                    ✉️ Credenciais enviadas para:<br/>
                    <strong className="text-white truncate">{email}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Botão Concluir */}
            <button
              onClick={handleClose}
              className="
                w-full min-h-[44px] sm:min-h-[48px]
                px-3 sm:px-4
                bg-green-600 hover:bg-green-500 text-white text-sm sm:text-base font-medium
                rounded-lg transition-all active:scale-95
              "
            >
              ✅ Concluir
            </button>
          </div>
        );

      default:
        return null;
    }
  }

  const steps = ['plans', 'email', 'confirm', 'payment', 'success'] as const;
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <Modal onClose={handleClose} title="Comprar Plano" icon={ShoppingCart}>
      <div className="p-2 sm:p-4 lg:p-6">
        {/* Indicador de progresso - compacto no mobile */}
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <div className="flex items-center gap-1 sm:gap-0">
            {steps.map((step, index) => (
              <Fragment key={step}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
                  currentStep === step 
                    ? 'bg-[#6205D5] text-white ring-2 ring-[#6205D5]/50' 
                    : index < currentStepIndex
                    ? 'bg-green-600/80 text-white'
                    : 'bg-[#26074d] text-gray-400 border border-[#6205D5]/20'
                }`}>
                  {index + 1}
                </div>
                {index < 4 && (
                  <div className={`hidden sm:block w-6 lg:w-8 h-0.5 mx-0.5 ${
                    index < currentStepIndex ? 'bg-green-600' : 'bg-[#26074d]'
                  }`} />
                )}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Conteúdo do step atual */}
        {renderStepContent()}

        {/* Error display */}
        {error && (
          <div className="mt-4 bg-red-900/30 border border-red-600 p-3 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
