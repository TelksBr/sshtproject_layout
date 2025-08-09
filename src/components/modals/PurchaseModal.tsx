import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Plan, PaymentStep, PurchaseRequest, PurchaseResponse, CredentialsResponse } from '../../types/sales';
import { getPlans, createPurchase, formatPrice, formatDate } from '../../utils/salesUtils';
import { validateEmail } from '../../utils/emailValidation';
import { generateQRCodeDataURL, isValidPixCode } from '../../utils/qrCodeGenerator';
import usePaymentPolling from '../../hooks/usePaymentPolling';
import { ShoppingCart } from 'lucide-react';

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
      if (currentStep === 'payment') {
        setCurrentStep('success');
      }
    }
  }, [hookCredentials, currentStep]);

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

  function copyToClipboard(text: string, type: string = 'texto') {

    // Função robusta para copiar - compatível com todos os navegadores
    const copyText = async () => {
      // Tentar primeiro com navigator.clipboard (moderno)
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (err) {
        }
      } else {
      }
      
      // Fallback para navegadores mais antigos ou contextos não-seguros
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
        } else {
        }
        
        return successful;
      } catch (err) {
        return false;
      }
    };

    copyText().then((success) => {
      if (success) {
        // Feedback visual de sucesso
        const originalError = error;
        setError('');
        setTimeout(() => {
          setError(`✅ ${type} copiado com sucesso!`);
          setTimeout(() => {
            setError(originalError);
          }, 2000);
        }, 100);
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
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Escolha seu Plano</h3>
              <p className="text-gray-300">Selecione o plano que melhor atende suas necessidades</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => handlePlanSelect(plan)}
                    className="p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-gray-800/50 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white">{plan.name}</h4>
                        <p className="text-sm text-gray-300 mt-1">{plan.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {plan.protocols && plan.protocols.length > 0 ? (
                            plan.protocols.map((protocol) => (
                              <span key={protocol} className="px-2 py-1 bg-blue-600 text-xs rounded">
                                {protocol.toUpperCase()}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-1 bg-gray-600 text-xs rounded">
                              SSH/V2RAY
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          {formatPrice(plan.price)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {plan.duration_days || plan.validate || 30} dias
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'email':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Seus Dados</h3>
              <p className="text-gray-300">Preencha seus dados para receber as credenciais</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="seu@email.com"
              />
              {emailError && (
                <p className="text-red-400 text-sm mt-1">{emailError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('plans')}
                className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleEmailSubmit}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Confirmar Compra</h3>
              <p className="text-gray-300">Revise os dados antes de finalizar</p>
            </div>

            {selectedPlan && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">{selectedPlan.name}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Preço:</span>
                    <span className="text-green-400 font-semibold">{formatPrice(selectedPlan.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Duração:</span>
                    <span className="text-white">{selectedPlan.duration_days || selectedPlan.validate || 30} dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Nome:</span>
                    <span className="text-white">{customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Email:</span>
                    <span className="text-white">{email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Protocolos:</span>
                    <span className="text-white">
                      {selectedPlan.protocols && selectedPlan.protocols.length > 0 
                        ? selectedPlan.protocols.join(', ') 
                        : 'SSH/V2RAY'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('email')}
                className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handlePurchaseConfirm}
                disabled={isLoading}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-500 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Finalizar Compra'
                )}
              </button>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Pagamento PIX</h3>
              <p className="text-gray-300">Complete o pagamento para receber suas credenciais</p>
            </div>

            {purchaseData && (
              <div className="space-y-4">
                {/* Valor do pagamento */}
                <div className="bg-green-900/30 border border-green-600 p-3 rounded-lg text-center">
                  <div className="text-green-300 text-sm">Valor a pagar:</div>
                  <div className="text-green-400 text-2xl font-bold">
                    {formatPrice(purchaseData.amount)}
                  </div>
                </div>

                {/* QR Code Visual Gerado Dinamicamente */}
                {generatedQRCode ? (
                  <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-lg border border-blue-600">
                    <div className="text-center">
                      <p className="text-white mb-4 font-semibold text-lg">📱 Escaneie o QR Code PIX</p>
                      
                      <div className="bg-white p-6 rounded-xl inline-block mb-4 shadow-lg">
                        <img 
                          src={generatedQRCode}
                          alt="QR Code PIX"
                          className="w-56 h-56 mx-auto block"
                          onLoad={() => {
                            // QR Code carregado
                          }}
                          onError={() => {
                            // Erro ao carregar QR Code visual
                          }}
                        />
                      </div>

                      <div className="text-sm text-blue-100 bg-blue-800/50 p-3 rounded-lg">
                        💡 <strong>Dica:</strong> Abra seu app de banco e escaneie o código acima
                      </div>
                    </div>
                  </div>
                ) : qrCodeError ? (
                  <div className="bg-gradient-to-br from-red-900 to-red-800 p-6 rounded-lg border border-red-600">
                    <div className="text-center">
                      <p className="text-white mb-4 font-semibold text-lg">❌ Erro no QR Code</p>
                      
                      <div className="bg-red-950 p-4 rounded-lg border border-red-700 mb-4">
                        <div className="text-red-300 text-sm">{qrCodeError}</div>
                      </div>

                      <div className="text-sm text-red-100 bg-red-800/50 p-3 rounded-lg">
                        💡 <strong>Use o código PIX abaixo:</strong> Copie e cole no seu app
                      </div>
                    </div>
                  </div>
                ) : (purchaseData.qr_code || purchaseData.ticket_url) ? (
                  <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-lg border border-blue-600">
                    <div className="text-center">
                      <p className="text-white mb-4 font-semibold text-lg">📱 QR Code PIX</p>
                      
                      <div className="bg-white p-6 rounded-xl inline-block mb-4 shadow-lg">
                        <div className="w-56 h-56 flex items-center justify-center bg-gray-100 text-gray-800 text-sm p-4 rounded">
                          <div className="text-center">
                            <div className="text-4xl mb-3 animate-spin">⚙️</div>
                            <div className="font-semibold">Gerando QR Code</div>
                            <div className="text-xs mt-2 text-gray-600">Aguarde...</div>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-blue-100 bg-blue-800/50 p-3 rounded-lg">
                        💡 <strong>Aguarde:</strong> O QR Code está sendo gerado
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* SEPARADOR VISUAL */}
                {purchaseData.qr_code && purchaseData.ticket_url && (
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-gray-600"></div>
                    <span className="text-gray-400 font-semibold bg-gray-800 px-4 py-2 rounded-full text-sm">
                      OU
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-600 to-gray-600"></div>
                  </div>
                )}

                {/* Código PIX Copia e Cola - Melhorado */}
                {purchaseData.qr_code && (
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-gray-600">
                    <p className="text-white mb-4 font-semibold text-lg">💳 Código PIX Copia e Cola</p>
                    
                    <div className="bg-gray-950 p-4 rounded-lg border border-gray-700 mb-4">
                      <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Código PIX:</div>
                      <div className="font-mono text-sm text-green-400 break-all leading-relaxed bg-gray-900 p-3 rounded border-l-4 border-green-500">
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
                        copyToClipboard(pixCode, 'Código PIX');
                      }}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg transition-all font-semibold shadow-lg transform hover:scale-105"
                    >
                      📋 Copiar Código PIX
                    </button>
                    
                    <div className="text-sm text-gray-400 mt-3 bg-gray-800/50 p-3 rounded-lg">
                      💡 <strong>Como usar:</strong> Copie o código acima e cole no seu app de banco na opção "PIX Copia e Cola"
                    </div>
                  </div>
                )}

                {/* Link de Pagamento Alternativo do Mercado Pago */}
                {purchaseData.ticket_url && (
                  <div className="bg-gradient-to-br from-orange-900 to-orange-800 p-6 rounded-lg border border-orange-600">
                    <p className="text-white mb-4 font-semibold text-lg">🔗 Pagar pelo Site do Mercado Pago</p>
                    
                    <div className="bg-orange-950 p-4 rounded-lg border border-orange-700 mb-4">
                      <div className="text-xs text-orange-400 mb-2 uppercase tracking-wider">Link de Pagamento:</div>
                      <div className="font-mono text-sm text-orange-300 break-all leading-relaxed bg-orange-900 p-3 rounded border-l-4 border-orange-500">
                        {purchaseData.ticket_url}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        window.open(purchaseData.ticket_url, '_blank');
                      }}
                      className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-lg transition-all font-semibold shadow-lg transform hover:scale-105"
                    >
                      🌐 Abrir Site do Mercado Pago
                    </button>
                    
                    <div className="text-sm text-orange-100 mt-3 bg-orange-800/50 p-3 rounded-lg">
                      💡 <strong>Alternativa:</strong> Se preferir, clique acima para pagar diretamente no site do Mercado Pago
                    </div>
                  </div>
                )}

                {/* Informações do pagamento sempre presentes */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="space-y-2">
                    <p className="text-white">
                      <span className="font-semibold">💰 Valor:</span> {formatPrice(purchaseData.amount)}
                    </p>
                    <p className="text-white">
                      <span className="font-semibold">🆔 Payment ID:</span> {purchaseData.payment_id}
                    </p>
                    <p className="text-white">
                      <span className="font-semibold">⏱️ Tempo limite:</span> {purchaseData.expires_in || 15} minutos
                    </p>
                  </div>
                </div>

                {/* Informações opcionais - só mostrar se existirem */}
                {purchaseData.username && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-white mb-2">
                      <span className="font-semibold">👤 Usuário:</span> {purchaseData.username}
                    </p>
                  </div>
                )}

                {/* Expiração atual se disponível */}
                {purchaseData.current_expiration && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-white mb-2">
                      <span className="font-semibold">⏰ Expira em:</span> {formatDate(purchaseData.current_expiration)}
                    </p>
                  </div>
                )}

                {/* Status do polling otimizado */}
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 font-semibold">Status do Pagamento:</span>
                    <div className="flex items-center gap-2">
                      {isPolling && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      )}
                      <span className={`font-semibold ${
                        !credentials ? 'text-yellow-400' : 
                        'text-green-400'
                      }`}>
                        {!credentials ? '⏳ Aguardando pagamento...' : 
                         '✅ Pagamento aprovado!'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Verificação automática {attempts}/{maxAttempts} • A cada 5 segundos
                  </div>
                  <div className="text-xs text-blue-300 mt-1">
                    💡 Após o pagamento, as credenciais aparecerão automaticamente
                  </div>
                </div>

                {pollingError && (
                  <div className="bg-red-900/30 border border-red-600 p-3 rounded-lg">
                    <p className="text-red-300 text-sm">❌ {pollingError}</p>
                  </div>
                )}

                {/* Instruções de pagamento */}
                <div className="bg-blue-900/30 border border-blue-600 p-3 rounded-lg">
                  <div className="text-blue-300 text-sm">
                    <div className="font-semibold mb-2">📋 Como pagar:</div>
                    <div className="space-y-1 text-xs">
                      <div>1. 📱 Abra seu app do banco</div>
                      <div>2. 🔍 Procure por "PIX" ou "Pagar com QR Code"</div>
                      <div>3. 📷 Escaneie o QR Code ou cole o código PIX</div>
                      <div>4. ✅ Confirme o pagamento</div>
                      <div>5. ⚡ Aguarde alguns segundos para aprovação automática</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Credenciais já disponíveis - Preview */}
            {credentials && (
              <div className="bg-green-900/30 border border-green-600 p-3 rounded-lg">
                <div className="text-green-300 text-sm mb-2">✅ Credenciais recebidas!</div>
                <div className="text-xs text-green-400">
                  Status: {credentials.status}
                </div>
                {credentials.ssh_credentials && (
                  <div className="text-xs text-green-400">
                    SSH: {credentials.ssh_credentials.username}
                  </div>
                )}
                {credentials.v2ray_credentials && (
                  <div className="text-xs text-green-400">
                    V2Ray: {credentials.v2ray_credentials.uuid.substring(0, 8)}...
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('plans')}
                className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                ← Cancelar
              </button>
              <button
                onClick={() => {
                  // Reativar polling se parou por algum motivo
                  if (!isPolling && currentStep === 'payment') {
                    window.location.reload(); // Solução simples para reativar
                  }
                }}
                disabled={isPolling}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white rounded-lg transition-colors"
              >
                🔄 {isPolling ? 'Verificando...' : 'Verificar Novamente'}
              </button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Pagamento Aprovado!</h3>
              <p className="text-gray-300">Suas credenciais estão prontas</p>
            </div>

            {credentials && (
              <div className="space-y-4">
                {/* Informações do Plano */}
                {credentials.plan && (
                  <div className="bg-green-900/30 border border-green-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <span>📦 Plano Adquirido</span>
                      <span className="px-2 py-1 bg-green-600 text-xs rounded">ATIVO</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Plano:</span>
                        <span className="text-white font-semibold">{credentials.plan.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Preço:</span>
                        <span className="text-green-400 font-semibold">{formatPrice(credentials.plan.price)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Validade:</span>
                        <span className="text-white">{credentials.plan.validate_days} dias</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Credenciais SSH */}
                {credentials.ssh_credentials && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <span>🔐 Credenciais SSH</span>
                      <span className="px-2 py-1 bg-blue-600 text-xs rounded">SSH</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Usuário:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white">{credentials.ssh_credentials?.username || 'N/A'}</span>
                          <button
                            onClick={() => copyToClipboard(credentials.ssh_credentials?.username || '', 'Usuário SSH')}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Senha:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white">{credentials.ssh_credentials?.password || 'N/A'}</span>
                          <button
                            onClick={() => copyToClipboard(credentials.ssh_credentials?.password || '', 'Senha SSH')}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Limite de Conexões:</span>
                        <span className="text-yellow-400">{credentials.ssh_credentials?.limit || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Expira em:</span>
                        <span className="text-orange-400">{credentials.ssh_credentials?.expiration_date ? formatDate(credentials.ssh_credentials.expiration_date) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Criado em:</span>
                        <span className="text-gray-400">{credentials.ssh_credentials?.created_at ? formatDate(credentials.ssh_credentials.created_at) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Credenciais V2Ray */}
                {credentials.v2ray_credentials && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <span>🌐 Credenciais V2Ray</span>
                      <span className="px-2 py-1 bg-purple-600 text-xs rounded">V2RAY</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">UUID:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white text-xs break-all">{credentials.v2ray_credentials?.uuid || 'N/A'}</span>
                          <button
                            onClick={() => copyToClipboard(credentials.v2ray_credentials?.uuid || '', 'UUID V2Ray')}
                            className="text-blue-400 hover:text-blue-300 flex-shrink-0"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Limite de Conexões:</span>
                        <span className="text-yellow-400">{credentials.v2ray_credentials?.limit || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Expira em:</span>
                        <span className="text-orange-400">{credentials.v2ray_credentials?.expiration_date ? formatDate(credentials.v2ray_credentials.expiration_date) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Criado em:</span>
                        <span className="text-gray-400">{credentials.v2ray_credentials?.created_at ? formatDate(credentials.v2ray_credentials.created_at) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Credenciais Legadas (fallback para compatibilidade) */}
                {credentials.ssh && !credentials.ssh_credentials && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <span>🔐 SSH (Formato Legado)</span>
                      <span className="px-2 py-1 bg-blue-600 text-xs rounded">SSH</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Host:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white">{credentials.ssh?.host || 'N/A'}</span>
                          <button
                            onClick={() => copyToClipboard(credentials.ssh?.host || '', 'Host SSH')}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Porta:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white">{credentials.ssh?.port || 'N/A'}</span>
                          <button
                            onClick={() => copyToClipboard(credentials.ssh?.port?.toString() || '', 'Porta SSH')}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Usuário:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white">{credentials.ssh?.username || 'N/A'}</span>
                          <button
                            onClick={() => copyToClipboard(credentials.ssh?.username || '', 'Usuário SSH')}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Senha:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white">{credentials.ssh?.password || 'N/A'}</span>
                          <button
                            onClick={() => copyToClipboard(credentials.ssh?.password || '', 'Senha SSH')}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Expira:</span>
                        <span className="text-orange-400">{credentials.ssh?.expires_at ? formatDate(credentials.ssh.expires_at) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {credentials.v2ray && !credentials.v2ray_credentials && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <span>🌐 V2Ray (Formato Legado)</span>
                      <span className="px-2 py-1 bg-purple-600 text-xs rounded">V2RAY</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">UUID:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white text-xs">{credentials.v2ray?.uuid || 'N/A'}</span>
                          <button
                            onClick={() => copyToClipboard(credentials.v2ray?.uuid || '', 'UUID V2Ray')}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Expira:</span>
                        <span className="text-orange-400">{credentials.v2ray?.expires_at ? formatDate(credentials.v2ray.expires_at) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-900/30 border border-blue-600 p-3 rounded-lg">
                  <p className="text-blue-300 text-sm text-center">
                    ✉️ As credenciais também foram enviadas para seu email: <strong>{email}</strong>
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
            >
              Concluir
            </button>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <Modal onClose={handleClose} title="Comprar Plano" icon={ShoppingCart}>
      <div className="p-6">
        {/* Indicador de progresso */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            {['plans', 'email', 'confirm', 'payment', 'success'].map((step, index) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step 
                    ? 'bg-blue-600 text-white' 
                    : index < ['plans', 'email', 'confirm', 'payment', 'success'].indexOf(currentStep)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {index + 1}
                </div>
                {index < 4 && (
                  <div className={`w-8 h-0.5 ${
                    index < ['plans', 'email', 'confirm', 'payment', 'success'].indexOf(currentStep)
                      ? 'bg-green-600'
                      : 'bg-gray-600'
                  }`} />
                )}
              </React.Fragment>
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
