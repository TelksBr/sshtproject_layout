import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { Modal } from './Modal';
import { Plan, PaymentStep, PurchaseRequest, OrderResponse, CredentialsResponse } from '../../types/sales';
import { getPlans, createPurchase, formatPrice, formatDate } from '../../utils/salesUtils';
import { validateEmail } from '../../utils/emailValidation';

import usePaymentPolling from '../../hooks/usePaymentPolling';
import { purchaseStorage, PendingPurchase } from '../../utils/purchaseStorageManager';
import { applyPaidCredentials } from '../../utils/applyPaidCredentials';
import { ShoppingCart } from '../../utils/icons';
import { copyToClipboard } from '../../utils/nativeClipboard';
import { navigateToUrl, reloadApp } from '../../utils/nativeNavigation';

interface PurchaseModalProps {
  onClose: () => void;
  onOpenCredentials?: () => void;
}

export function PurchaseModal({ onClose, onOpenCredentials }: PurchaseModalProps) {
  // Estados principais
  const [currentStep, setCurrentStep] = useState<PaymentStep>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  
  // Estados do processo de pagamento
  const [purchaseData, setPurchaseData] = useState<OrderResponse | null>(null);
  const [credentials, setCredentials] = useState<CredentialsResponse | null>(null);
  const [qrCodeReady, setQrCodeReady] = useState(false);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const appliedPaymentRef = useRef<string | null>(null);

  // Hook de polling simplificado para verificar credenciais
  const { 
    credentials: hookCredentials, 
    isPolling, 
    error: pollingError,
    resetPolling
  } = usePaymentPolling(purchaseData?.payment_id ? String(purchaseData.payment_id) : null);

  useEffect(() => {
    if (!hookCredentials || (hookCredentials.status !== 'completed' && hookCredentials.status !== 'approved')) {
      return;
    }

    const paymentKey = String(hookCredentials.payment_id || purchaseData?.payment_id || '');
    if (paymentKey && appliedPaymentRef.current === paymentKey) return;
    appliedPaymentRef.current = paymentKey || 'applied';

    setCredentials(hookCredentials);

    const label = selectedPlan?.name
      ? `Compra ${selectedPlan.name}`
      : 'Compra Recente';

    applyPaidCredentials(hookCredentials, 'sales', label).catch(() => undefined);

    if (currentStep === 'payment') {
      setCurrentStep('success');
    }
  }, [hookCredentials, currentStep, selectedPlan, purchaseData?.payment_id]);

  // Carregar planos ao montar o componente
  useEffect(() => {
    loadPlans();
  }, []);

  function handleCopyToClipboard(text: string, type: string = 'texto') {
    copyToClipboard(text).then((success) => {
      if (success) {
        setCopiedPix(true);
        setError(`✅ ${type} copiado com sucesso!`);
        setTimeout(() => {
          setCopiedPix(false);
          setError('');
        }, 2500);
      } else {
        setError(`❌ Erro ao copiar ${type}. Tente selecionar e copiar manualmente.`);
        setTimeout(() => setError(''), 3000);
      }
    });
  }

  // Callback ref: assim que o canvas estiver no DOM, desenha o QR nele (retorna void para satisfazer React.Ref)
  const drawQRCode = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas || !purchaseData) return;
    // Guardar ref para limpar depois se necessário
    (qrCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvas;

    const pixCode = purchaseData.qr_code || purchaseData.ticket_url || '';
    if (!pixCode) return;

    (async () => {
      try {
        setQrCodeError(null);
        const QRCodeModule = await import('qrcode');
        const QRCode = QRCodeModule.default || QRCodeModule;

        // Desenha direto no <canvas> — método mais confiável, sem intermediários
        await QRCode.toCanvas(canvas, pixCode, {
          width: 256,
          margin: 4,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'M',
        });
        setQrCodeReady(true);
      } catch (err) {
        console.error('[QRCode] toCanvas falhou:', err);
        setQrCodeError(`Erro ao gerar QR Code: ${err}`);
      }
    })();
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
        order_id: response.order_id,
        payment_id: String(response.payment_id),
        amount: response.amount,
        created_at: new Date().toISOString(),
        expires_at: response.expires_in 
          ? new Date(Date.now() + response.expires_in * 60 * 1000).toISOString()
          : new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Default 15 min
        status: 'pending',
        customer_email: email.trim(),
        plan_name: selectedPlan.name,
        qr_code: response.qr_code,
        ticket_url: response.ticket_url,
        kind: 'purchase',
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
    appliedPaymentRef.current = null;
    
    resetPolling();
    
    onClose();
  }

  // Cleanup quando o componente é desmontado
  useEffect(() => {
    return () => {
      resetPolling();
    };
  }, [resetPolling]);

  // Renderizar conteúdo baseado no step atual
  function renderStepContent() {
    switch (currentStep) {
      case 'plans':
        return (
          <div className="w-full space-y-3 sm:space-y-4">
            {/* Cabeçalho */}
            <div className="text-center">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-0.5 sm:mb-1" style={{ color: 'var(--text)' }}>
                Escolha seu Plano
              </h3>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                Selecione a opção que melhor se adequa a você
              </p>
            </div>

            {/* Lista de planos */}
            {isLoading ? (
              <div className="flex justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--accent)] border-t-transparent"></div>
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
                      active:scale-95 hover:scale-105
                      transition-all duration-200
                      touch-manipulation
                      overflow-hidden
                      min-h-[140px] sm:min-h-[160px]
                      flex flex-col
                    "
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {/* Gradiente de fundo ao passar */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    {/* Conteúdo */}
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Nome e descrição */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm sm:text-base line-clamp-2" style={{ color: 'var(--text)' }}>
                          {plan.name}
                        </h4>
                        <p className="text-xs sm:text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
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
                                text-[10px] sm:text-xs font-semibold
                                rounded-md
                              "
                              style={{
                                background: 'var(--accent-dim)',
                                color: 'var(--accent)',
                              }}
                            >
                              {protocol.toUpperCase()}
                            </span>
                          ))
                        ) : (
                          <span
                            className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-md"
                            style={{
                              background: 'var(--accent-dim)',
                              color: 'var(--accent)',
                            }}
                          >
                            SSH/V2RAY
                          </span>
                        )}
                      </div>

                      {/* Preço e duração */}
                      <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-2 mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[10px] sm:text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                            Por {(plan.duration_days || plan.validate || 30)}d
                          </span>
                          <span className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-500">
                            {formatPrice(plan.price)}
                          </span>
                        </div>
                        <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform" style={{ color: 'var(--accent)' }}>
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
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-0.5 sm:mb-1" style={{ color: 'var(--text)' }}>
                Seus Dados
              </h3>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                Preencha para receber as credenciais
              </p>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: 'var(--text-muted)' }}>
                Nome completo
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="
                  w-full min-h-[44px] sm:min-h-[48px]
                  px-3 sm:px-4 py-2
                  rounded-xl text-sm sm:text-base
                  outline-none transition-all allow-select
                "
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
                placeholder="João Silva"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: 'var(--text-muted)' }}>
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
                  rounded-xl text-sm sm:text-base
                  outline-none transition-all allow-select
                "
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
                placeholder="seu@email.com"
              />
              {emailError && (
                <p className="text-rose-400 text-xs sm:text-sm mt-1.5 font-medium">{emailError}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
              <button
                onClick={() => setCurrentStep('plans')}
                className="
                  flex-1 min-h-[44px] sm:min-h-[48px]
                  px-3 sm:px-4
                  text-sm sm:text-base font-medium
                  rounded-xl transition-all active:scale-95
                "
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                Voltar
              </button>
              <button
                onClick={handleEmailSubmit}
                className="
                  flex-1 min-h-[44px] sm:min-h-[48px]
                  px-3 sm:px-4
                  text-white text-sm sm:text-base font-medium
                  rounded-xl transition-all active:scale-95
                "
                style={{ background: 'var(--accent)' }}
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
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-0.5 sm:mb-1" style={{ color: 'var(--text)' }}>
                Confirmar Compra
              </h3>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                Revise os dados antes de finalizar
              </p>
            </div>

            {/* Resumo do plano */}
            {selectedPlan && (
              <div className="p-3 sm:p-4 rounded-xl space-y-2 sm:space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h4 className="font-semibold text-sm sm:text-base" style={{ color: 'var(--text)' }}>{selectedPlan.name}</h4>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Preço:</span>
                    <span className="text-emerald-500 font-semibold">{formatPrice(selectedPlan.price)}</span>
                  </div>
                  <div className="border-t pt-1.5 sm:pt-2 mt-1.5 sm:mt-2" style={{ borderColor: 'var(--border)' }}>
                    <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Duração:</span>
                        <div className="font-medium" style={{ color: 'var(--text)' }}>{selectedPlan.duration_days || selectedPlan.validate || 30}d</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Protocolo:</span>
                        <div className="font-medium" style={{ color: 'var(--text)' }}>
                          {selectedPlan.protocols && selectedPlan.protocols.length > 0 
                            ? selectedPlan.protocols[0].toUpperCase()
                            : 'SSH/V2RAY'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-1.5 sm:pt-2 mt-1.5 sm:mt-2 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex justify-between">
                      <span className="text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>Nome:</span>
                      <span className="text-xs sm:text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>Email:</span>
                      <span className="text-xs sm:text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{email}</span>
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
                  bg-[#1a1624]/80 hover:bg-[#1a1624] border-2 border-[#8b5cf6]/30 hover:border-[#8b5cf6]/60
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
          <div className="w-full space-y-3 sm:space-y-4 max-w-lg mx-auto">
            {/* Card Principal de Resumo do Pagamento */}
            {purchaseData && (
              <>
                <div className="rounded-2xl p-4 sm:p-5 text-center shadow-sm space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    PAGAMENTO PIX INSTANTÂNEO
                  </div>
                  
                  <div>
                    <span className="text-xs uppercase tracking-wider block font-semibold" style={{ color: 'var(--text-muted)' }}>Valor Total</span>
                    <div className="text-3xl sm:text-4xl font-extrabold font-mono" style={{ color: 'var(--text)' }}>
                      {formatPrice(purchaseData.amount)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t text-xs font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <span>ID: <strong style={{ color: 'var(--text)' }}>{purchaseData.payment_id}</strong></span>
                    <span>•</span>
                    <span>Expira em: <strong className="text-amber-500">{purchaseData.expires_in || 15}m</strong></span>
                  </div>

                  {(purchaseData as any)?.username && (
                    <div className="pt-1">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                        👤 Usuário: {(purchaseData as any).username}
                      </span>
                    </div>
                  )}
                </div>

                {/* QR Code Container */}
                {(purchaseData.qr_code || purchaseData.ticket_url) && (
                  <div className="rounded-2xl p-4 sm:p-5 text-center shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <p className="font-semibold text-sm mb-3" style={{ color: 'var(--text)' }}>📱 QR Code para Leitura</p>
                    <div className="bg-white p-4 rounded-2xl inline-block shadow-md border border-gray-200">
                      <canvas 
                        ref={drawQRCode}
                        style={{ width: 192, height: 192, display: qrCodeReady ? 'block' : 'none' }}
                      />
                      {!qrCodeReady && !qrCodeError && (
                        <div className="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-xl">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--accent)] border-t-transparent" />
                        </div>
                      )}
                    </div>

                    {qrCodeError && (
                      <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 mt-2">
                        {qrCodeError}
                      </div>
                    )}
                  </div>
                )}

                {/* PIX Copia e Cola - Ação Principal Mobile */}
                {purchaseData.qr_code && (
                  <div className="rounded-2xl p-4 sm:p-5 shadow-sm space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>💳 PIX Copia e Cola</span>
                      <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Toque para copiar</span>
                    </div>

                    <div className="p-3 rounded-xl font-mono text-xs break-all max-h-20 overflow-y-auto custom-scrollbar select-all leading-relaxed" style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                      {purchaseData.qr_code}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const pixCode = purchaseData.qr_code || '';
                        if (!pixCode) {
                          setError('Código PIX não disponível. Tente atualizar a página.');
                          return;
                        }
                        handleCopyToClipboard(pixCode, 'Código PIX');
                      }}
                      className={`w-full min-h-[48px] px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] touch-manipulation ${
                        copiedPix ? 'bg-emerald-600' : ''
                      }`}
                      style={{ background: copiedPix ? '#059669' : 'var(--accent)' }}
                    >
                      {copiedPix ? '✅ Código PIX Copiado!' : '📋 Copiar Código PIX'}
                    </button>
                  </div>
                )}

                {/* Link Alternativo do Mercado Pago */}
                {purchaseData.ticket_url && (
                  <button
                    type="button"
                    onClick={() => navigateToUrl(purchaseData.ticket_url || '')}
                    className="w-full min-h-[44px] px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all border active:scale-[0.98] touch-manipulation"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  >
                    🌐 Pagar no site do Mercado Pago
                  </button>
                )}

                {/* Status de Verificação em Tempo Real */}
                <div className="rounded-2xl p-3 sm:p-4 text-center space-y-1.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold">
                    {isPolling && <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />}
                    <span style={{ color: credentials ? '#10b981' : 'var(--text)' }}>
                      {!credentials ? '🔄 Aguardando confirmação do pagamento...' : '✅ Pagamento Aprovado!'}
                    </span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Verificação automática ativa • As credenciais serão liberadas instantaneamente
                  </p>
                </div>

                {pollingError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium text-center">
                    ❌ {pollingError}
                  </div>
                )}
              </>
            )}

            {/* Credenciais recebidas */}
            {credentials && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                <div className="text-emerald-500 font-bold text-xs sm:text-sm mb-1">✅ Pagamento Confirmado!</div>
                <div className="text-[10px] sm:text-xs text-emerald-600 font-medium">
                  Suas credenciais foram ativadas com sucesso.
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep('plans')}
                className="flex-1 min-h-[44px] rounded-xl text-xs font-semibold transition-all touch-manipulation active:scale-[0.98]"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                ← Voltar aos Planos
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isPolling && currentStep === 'payment') {
                    reloadApp();
                  }
                }}
                disabled={isPolling}
                className="
                  flex-1 min-h-[44px] sm:min-h-[48px]
                  px-3 sm:px-4
                  bg-[#8b5cf6] hover:bg-[#8b5cf6] disabled:bg-[#8b5cf6]/50 disabled:opacity-60
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
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 min-h-[44px] sm:min-h-[48px] px-3 rounded-xl btn-secondary text-sm font-semibold"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  resetPolling();
                  if (onOpenCredentials) onOpenCredentials();
                  else handleClose();
                }}
                className="flex-1 min-h-[44px] sm:min-h-[48px] px-3 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'var(--accent)' }}
              >
                Ver credenciais
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  const steps: PaymentStep[] = ['plans', 'email', 'confirm', 'payment', 'success'];
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <Modal onClose={handleClose} title="Comprar Plano" icon={ShoppingCart}>
      <div className="p-2 sm:p-4 lg:p-6">
        {/* Indicador de progresso - compacto no mobile */}
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <div className="flex items-center gap-1 sm:gap-0">
            {steps.map((step, index) => {
              const isCurrent = currentStep === step;
              const isPast = index < currentStepIndex;
              return (
                <Fragment key={step}>
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
                      isCurrent
                        ? 'bg-[var(--accent)] text-white ring-2 ring-[var(--accent)]/50'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'text-[var(--text-muted)]'
                    }`}
                    style={{
                      background: isCurrent ? 'var(--accent)' : isPast ? '#059669' : 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {index + 1}
                  </div>
                  {index < 4 && (
                    <div
                      className="hidden sm:block w-6 lg:w-8 h-0.5 mx-0.5"
                      style={{
                        background: isPast ? '#059669' : 'var(--border)',
                      }}
                    />
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* Conteúdo do step atual */}
        {renderStepContent()}

        {/* Display de Mensagens de Erro ou Sucesso */}
        {error && (
          <div
            className={`mt-4 p-3 rounded-xl border text-sm font-semibold text-center transition-all ${
              error.startsWith('✅')
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
            }`}
          >
            <p>{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
