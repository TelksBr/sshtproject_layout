
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from './Modal';
import { checkRenewalUser, getPlans, purchaseRenewal, formatPrice } from '../../utils/salesUtils';
import usePaymentPolling from '../../hooks/usePaymentPolling';
import { navigateToUrl } from '../../utils/nativeNavigation';
import { copyToClipboard } from '../../utils/nativeClipboard';
import { RefreshCw, CheckCircle, XCircle, DollarSign } from '../../utils/icons';
import { purchaseStorage, PendingPurchase } from '../../utils/purchaseStorageManager';
import { applyPaidCredentials } from '../../utils/applyPaidCredentials';


interface RenewalModalProps {
  onClose: () => void;
  initialUsername?: string;
}

type RenewalData = {
  user_type: 'ssh' | 'v2ray' | 'both';
  can_renew: boolean;
  current_expiration?: string;
  is_expired?: boolean;
  days_until_expiration?: number;
  ssh?: {
    username: string;
    limit: number;
  };
  v2ray?: {
    uuid: string;
    limit: number;
  };
  [key: string]: any;
};


function planDisplayName(name: string | undefined): string {
  return String(name || 'Plano')
    .replace(/\s*[-–]\s*R\$[:\s]*[\d.,]+\s*$/i, '')
    .trim();
}

const RenewalModal: React.FC<RenewalModalProps> = ({ onClose, initialUsername }) => {
  const [identifier, setIdentifier] = useState(initialUsername || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RenewalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewResult, setRenewResult] = useState<{success: boolean; message: string} | null>(null);
  const [currentStep, setCurrentStep] = useState<'check' | 'payment' | 'success'>('check');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [qrCodeReady, setQrCodeReady] = useState(false);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<any>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const appliedPaymentRef = useRef<string | null>(null);

  // Polling para verificar pagamento
  const {
    credentials: hookCredentials,
    isPolling,
    error: pollingError,
    attempts,
    maxAttempts,
    resetPolling
  } = usePaymentPolling(paymentData?.payment_id || null);

  useEffect(() => {
    if (!hookCredentials || (hookCredentials.status !== 'completed' && hookCredentials.status !== 'approved')) {
      return;
    }

    const paymentKey = String(hookCredentials.payment_id || paymentData?.payment_id || '');
    if (paymentKey && appliedPaymentRef.current === paymentKey) return;
    appliedPaymentRef.current = paymentKey || 'applied';

    setCredentials(hookCredentials);
    applyPaidCredentials(hookCredentials, 'renewal', `Renovação ${identifier || ''}`.trim()).catch(() => undefined);

    if (currentStep === 'payment') {
      setCurrentStep('success');
    }
  }, [hookCredentials, currentStep, paymentData?.payment_id, identifier]);

  useEffect(() => {
    if (result && result.can_renew) {
      getPlans().then(setPlans).catch(() => setPlans([]));
    }
  }, [result]);

  // Auto-verificar quando username inicial for fornecido
  useEffect(() => {
    if (initialUsername && !result && !loading) {
      handleSubmit(new Event('submit') as any);
    }
  }, [initialUsername]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setRenewResult(null);
    setSelectedPlan('');
    try {
      const response = await checkRenewalUser(identifier);
      if (response.success && response.data) {
        setResult(response.data as RenewalData);
      } else {
        setError(response.message || 'Não foi possível verificar o usuário.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao verificar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!result || !selectedPlan) return;
    
    setRenewLoading(true);
    setRenewResult(null);
    setPaymentData(null);
    setQrCodeReady(false);
    setQrCodeError(null);
    setCredentials(null);
    try {
      const response = await purchaseRenewal(identifier, selectedPlan);
      if (response.success && response.data) {
        const data = response.data;
        setPaymentData(data);
        setCurrentStep('payment');
        resetPolling();

        const pendingPurchase: PendingPurchase = {
          order_id: String(data.order_id || data.invoice_id || data.payment_id),
          payment_id: String(data.payment_id),
          amount: data.amount || 0,
          created_at: new Date().toISOString(),
          expires_at: data.expires_in
            ? new Date(Date.now() + data.expires_in * 60 * 1000).toISOString()
            : new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          status: 'pending',
          customer_email: identifier,
          plan_name: plans.find((plan) => String(plan.id) === String(selectedPlan))?.name,
          qr_code: data.qr_code,
          ticket_url: data.ticket_url,
          kind: 'renewal',
        };
        purchaseStorage.savePendingPurchase(pendingPurchase);
      } else {
        setRenewResult({ success: false, message: response.message || 'Erro ao renovar login.' });
      }
    } catch (err: any) {
      setRenewResult({ success: false, message: err.message || 'Erro ao renovar login.' });
    } finally {
      setRenewLoading(false);
    }
  };


  // Callback ref: desenha QR direto no canvas quando ele aparece no DOM
  const drawQRCode = useCallback(async (canvas: HTMLCanvasElement | null) => {
    if (!canvas || !paymentData) return;
    (qrCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvas;

    const pixCode = paymentData.qr_code || paymentData.ticket_url || '';
    if (!pixCode) return;

    try {
      setQrCodeError(null);
      const QRCodeModule = await import('qrcode');
      const QRCode = QRCodeModule.default || QRCodeModule;

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
  }, [paymentData]);


  // Renderização condicional por step
  let content: React.ReactNode = null;
  if (currentStep === 'check') {
    content = (
      <>
        {!result && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4 animate-fade-in">
            <div className="flex flex-col gap-2">
              <label htmlFor="renew-identifier" className="text-white font-semibold text-base flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#b7abc9]" /> Usuário ou UUID para renovação:
              </label>
              <input
                id="renew-identifier"
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
                disabled={loading}
                placeholder="Username SSH ou UUID V2Ray"
                className="rounded-lg px-4 py-2 bg-[#0c0a12] border-2 border-[#8b5cf6]/40 text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] shadow-sm transition-all"
                style={{ width: '100%' }}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !identifier}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#8b5cf6] text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <span className="loader mr-2"></span>}
              {loading ? 'Verificando...' : 'Verificar Usuário'}
            </button>
            {error && <div className="text-red-400 text-sm mt-2 text-center animate-shake">{error}</div>}
          </form>
        )}

        {result && (
          <div className="flex flex-col items-center gap-5 p-6 animate-fade-in w-full">
            <div className="flex items-center gap-3 mb-2">
              {result.can_renew ? (
                <CheckCircle className="w-8 h-8 text-green-400 animate-bounce" />
              ) : (
                <XCircle className="w-8 h-8 text-red-400 animate-pulse" />
              )}
              <span className={`text-xl font-bold drop-shadow ${result.can_renew ? 'text-green-300' : 'text-red-300'}`}>{result.can_renew ? 'Usuário pode renovar!' : 'Usuário não pode renovar'}</span>
            </div>
            <div className="bg-[#0c0a12]/80 rounded-lg p-4 border border-[#8b5cf6]/30 shadow-inner w-full max-w-md">
              <div className="text-white text-base mb-2"><b>Tipo:</b> <span className="text-[#b7abc9]">{result.user_type === 'both' ? 'SSH + V2Ray' : result.user_type === 'ssh' ? 'SSH' : 'V2Ray'}</span></div>
              {result.ssh && (
                <div className="text-white text-base mb-2"><b>SSH:</b> <span className="text-[#b7abc9]">{result.ssh.username}</span> <span className="text-gray-400 text-sm">(limite: {result.ssh.limit})</span></div>
              )}
              {result.v2ray && (
                <div className="text-white text-base mb-2"><b>V2Ray:</b> <span className="text-[#b7abc9] text-sm font-mono">{result.v2ray.uuid.substring(0, 16)}...</span> <span className="text-gray-400 text-sm">(limite: {result.v2ray.limit})</span></div>
              )}
              {result.current_expiration && (
                <div className="text-white text-base mb-2"><b>Expiração atual:</b> <span className="text-[#b7abc9]">{new Date(result.current_expiration).toLocaleString()}</span></div>
              )}
              {typeof result.is_expired !== 'undefined' && (
                <div className="text-white text-base mb-2"><b>Status:</b> <span className={result.is_expired ? 'text-red-400' : 'text-green-400'}>{result.is_expired ? 'Expirado' : 'Ativo'}</span></div>
              )}
              {typeof result.days_until_expiration !== 'undefined' && (
                <div className="text-white text-base mb-2"><b>Dias até expirar:</b> <span className="text-[#b7abc9]">{result.days_until_expiration}</span></div>
              )}
            </div>
            {result.can_renew && plans.length > 0 && (
              <div className="w-full max-w-md flex flex-col gap-2 mt-2">
                <label className="text-white font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#b7abc9]" />
                  Selecione o plano para renovação
                </label>
                <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-0.5">
                  {plans.map((plan) => {
                    const selected = String(selectedPlan) === String(plan.id);
                    const days = plan.duration_days || plan.validate;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        disabled={renewLoading}
                        onClick={() => setSelectedPlan(String(plan.id))}
                        className="w-full text-left rounded-xl px-3 py-3 min-h-[56px] touch-manipulation disabled:opacity-60"
                        style={{
                          background: selected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                          border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ border: `2px solid ${selected ? 'var(--accent)' : 'var(--text-muted)'}` }}
                          >
                            {selected && (
                              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--accent)' }} />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                              {planDisplayName(plan.name)}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {plan.limit ? `${plan.limit} dispositivo${plan.limit > 1 ? 's' : ''}` : 'Plano'}
                              {days ? ` · ${days}d` : ''}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-green-400 shrink-0">
                            {formatPrice(Number(plan.price) || 0)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {result.can_renew && (
              <button
                onClick={handleRenew}
                disabled={!selectedPlan || renewLoading}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#8b5cf6] text-white font-bold py-2 px-8 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {renewLoading && <span className="loader mr-2"></span>}
                {renewLoading ? 'Renovando...' : 'Renovar Login'}
              </button>
            )}
            {renewResult && (
              <div className={`mt-2 text-center text-base font-semibold ${renewResult.success ? 'text-green-400' : 'text-red-400'}`}>{renewResult.message}</div>
            )}
            <button
              onClick={onClose}
              className="mt-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#8b5cf6] text-white font-bold py-2 px-8 rounded-lg shadow-lg transition-all duration-200"
            >Fechar</button>
          </div>
        )}
      </>
    );
  } else if (currentStep === 'payment' && paymentData) {
    content = (
      <div className="space-y-4 p-4 animate-fade-in">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Pagamento PIX</h3>
          <p className="text-gray-300">Complete o pagamento para renovar seu acesso</p>
        </div>
        <div className="bg-green-900/30 border border-green-600 p-3 rounded-lg text-center">
          <div className="text-green-300 text-sm">Valor a pagar:</div>
          <div className="text-green-400 text-2xl font-bold">
            {paymentData.amount ? paymentData.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}
          </div>
        </div>
        {/* Mensagens informativas de upgrade/downgrade */}
        {paymentData.ssh_message && (
          <div className="bg-blue-900/30 border border-blue-500 p-3 rounded-lg">
            <p className="text-blue-200 text-sm">🔐 <strong>SSH:</strong> {paymentData.ssh_message}</p>
          </div>
        )}
        {paymentData.v2ray_message && (
          <div className="bg-purple-900/30 border border-purple-500 p-3 rounded-lg">
            <p className="text-purple-200 text-sm">🌐 <strong>V2Ray:</strong> {paymentData.v2ray_message}</p>
          </div>
        )}
        {/* QR Code Visual — Canvas direto */}
        {(paymentData.qr_code || paymentData.ticket_url) ? (
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-lg border border-blue-600">
            <div className="text-center">
              <p className="text-white mb-4 font-semibold text-lg">📱 Escaneie o QR Code PIX</p>
              <div className="bg-white p-6 rounded-xl inline-block mb-4 shadow-lg">
                <canvas 
                  ref={drawQRCode}
                  style={{ width: 224, height: 224, display: qrCodeReady ? 'block' : 'none' }}
                />
                {!qrCodeReady && !qrCodeError && (
                  <div className="w-56 h-56 flex items-center justify-center bg-gray-100 rounded">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#8b5cf6] border-t-transparent"></div>
                  </div>
                )}
              </div>

              {qrCodeError && (
                <div className="text-xs text-red-300 bg-red-900/30 p-2 rounded mb-3">
                  {qrCodeError} — Use o código PIX abaixo
                </div>
              )}

              <div className="text-sm text-blue-100 bg-blue-800/50 p-3 rounded-lg">
                💡  Abra seu app de banco e escaneie o código acima
              </div>
            </div>
          </div>
        ) : null}
        {/* Código PIX Copia e Cola - Melhorado */}
        {paymentData.qr_code && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-gray-600">
            <p className="text-white mb-4 font-semibold text-lg">💳 Código PIX Copia e Cola</p>
            <div className="bg-gray-950 p-4 rounded-lg border border-gray-700 mb-4">
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Código PIX:</div>
              <div className="font-mono text-sm text-green-400 break-all leading-relaxed bg-gray-900 p-3 rounded border-l-4 border-green-500">
                {paymentData.qr_code}
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(paymentData.qr_code)}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg transition-all font-semibold shadow-lg transform hover:scale-105"
            >
              📋 Copiar Código PIX
            </button>
            <div className="text-sm text-gray-400 mt-3 bg-gray-800/50 p-3 rounded-lg">
              💡  Copie o código acima e cole no seu app de banco na opção "PIX Copia e Cola"
            </div>
          </div>
        )}
        {/* Link de Pagamento Alternativo do Mercado Pago */}
        {paymentData.ticket_url && (
          <div className="bg-gradient-to-br from-orange-900 to-orange-800 p-6 rounded-lg border border-orange-600">
            <p className="text-white mb-4 font-semibold text-lg">🔗 Pagar pelo Site do Mercado Pago</p>
            <div className="bg-orange-950 p-4 rounded-lg border border-orange-700 mb-4">
              <a href={paymentData.ticket_url} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline break-all">{paymentData.ticket_url}</a>
            </div>
            <button
              onClick={() => navigateToUrl(paymentData.ticket_url)}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-lg transition-all font-semibold shadow-lg transform hover:scale-105"
            >
              🌐 Abrir Site do Mercado Pago
            </button>
            <div className="text-sm text-orange-100 mt-3 bg-orange-800/50 p-3 rounded-lg">
              💡  Se preferir, clique acima para pagar diretamente no site do Mercado Pago
            </div>
          </div>
        )}
        {/* Informações do pagamento sempre presentes */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="space-y-2">
            <p className="text-white">
              <span className="font-semibold">💰 Valor:</span> {paymentData.amount ? paymentData.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}
            </p>
            <p className="text-white">
              <span className="font-semibold">🆔 Payment ID:</span> {paymentData.payment_id}
            </p>
            <p className="text-white">
              <span className="font-semibold">⏱️ Tempo limite:</span> {paymentData.expires_in || 15} minutos
            </p>
          </div>
        </div>
        {/* Status do polling otimizado */}
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 font-semibold">Status do Pagamento:</span>
            <div className="flex items-center gap-2">
              {isPolling && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              )}
              <span className={`font-semibold ${!credentials ? 'text-yellow-400' : 'text-green-400'}`}>
                {!credentials ? '⏳ Aguardando pagamento...' : '✅ Pagamento aprovado!'}
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
            <div className="font-semibold mb-2">� Como pagar:</div>
            <div className="space-y-1 text-xs">
              <div>1. 📱 Abra seu app do banco</div>
              <div>2. 🔍 Procure por "PIX" ou "Pagar com QR Code"</div>
              <div>3. 📷 Escaneie o QR Code ou cole o código PIX</div>
              <div>4. ✅ Confirme o pagamento</div>
              <div>5. ⚡ Aguarde alguns segundos para aprovação automática</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            ← Cancelar
          </button>
          <button
            onClick={() => {
              if (!isPolling && currentStep === 'payment') resetPolling();
            }}
            disabled={isPolling}
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white rounded-lg transition-colors"
          >
            🔄 {isPolling ? 'Verificando...' : 'Verificar Novamente'}
          </button>
        </div>
      </div>
    );
  }

  // Step de sucesso igual ao PurchaseModal
  else if (currentStep === 'success') {
    // Extrair credenciais normalizadas (suporte a ambos os formatos)
    const sshCred = credentials?.ssh_credentials || credentials?.credentials?.ssh;
    const v2rayCred = credentials?.v2ray_credentials || credentials?.credentials?.v2ray;

    content = (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Pagamento Aprovado!</h3>
          <p className="text-gray-300">Sua renovação foi concluída e as credenciais estão prontas</p>
        </div>
        {credentials && (
          <div className="space-y-4">
            {/* SSH */}
            {sshCred && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span>🔐 Credenciais SSH</span>
                  <span className="px-2 py-1 bg-blue-600 text-xs rounded">SSH</span>
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Usuário:</span>
                    <span className="font-mono text-white">{sshCred.username}</span>
                  </div>
                  {sshCred.password && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Senha:</span>
                      <span className="font-mono text-white">{sshCred.password}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Limite:</span>
                    <span className="text-yellow-400">{sshCred.limit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Expira em:</span>
                    <span className="text-orange-400">{new Date(sshCred.expiration_date).toLocaleString()}</span>
                  </div>
                  {typeof sshCred.is_active !== 'undefined' && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Ativo:</span>
                      <span className="text-green-400">{sshCred.is_active ? 'Sim' : 'Não'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* V2Ray */}
            {v2rayCred && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span>🌐 Credenciais V2Ray</span>
                  <span className="px-2 py-1 bg-purple-600 text-xs rounded">V2RAY</span>
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">UUID:</span>
                    <span className="font-mono text-white text-xs break-all">{v2rayCred.uuid}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Limite:</span>
                    <span className="text-yellow-400">{v2rayCred.limit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Expira em:</span>
                    <span className="text-orange-400">{new Date(v2rayCred.expiration_date).toLocaleString()}</span>
                  </div>
                  {typeof v2rayCred.is_active !== 'undefined' && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Ativo:</span>
                      <span className="text-green-400">{v2rayCred.is_active ? 'Sim' : 'Não'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
        >
          Concluir
        </button>
      </div>
    );
  }
  return (
    <Modal onClose={onClose} title="Renovação de Login" icon={RefreshCw}>
      {content}
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none; } }
        .animate-shake { animation: shake 0.3s; }
        @keyframes shake { 10%, 90% { transform: translateX(-2px); } 20%, 80% { transform: translateX(4px); } 30%, 50%, 70% { transform: translateX(-8px); } 40%, 60% { transform: translateX(8px); } }
        .loader { border: 3px solid #b7abc9; border-top: 3px solid #8b5cf6; border-radius: 50%; width: 18px; height: 18px; animation: spin 0.7s linear infinite; display: inline-block; }
        @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
      `}</style>
    </Modal>
  );
};

export default RenewalModal;
