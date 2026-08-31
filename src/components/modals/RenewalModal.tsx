
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
  const [copiedPix, setCopiedPix] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const appliedPaymentRef = useRef<string | null>(null);

  // Polling para verificar pagamento
  const {
    credentials: hookCredentials,
    isPolling,
    error: pollingError,
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

  // Callback ref: desenha QR direto no canvas quando ele aparece no DOM (retorna void para satisfazer React.Ref)
  const drawQRCode = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas || !paymentData) return;
    (qrCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvas;

    const pixCode = paymentData.qr_code || paymentData.ticket_url || '';
    if (!pixCode) return;

    (async () => {
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
    })();
  }, [paymentData]);

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





  // Renderização condicional por step
  let content: React.ReactNode = null;
  if (currentStep === 'check') {
    content = (
      <>
        {!result && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4 animate-fade-in">
            <div className="flex flex-col gap-2">
              <label htmlFor="renew-identifier" className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <RefreshCw className="w-4 h-4 text-[var(--accent)]" /> Usuário ou UUID para renovação:
              </label>
              <input
                id="renew-identifier"
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
                disabled={loading}
                placeholder="Username SSH ou UUID V2Ray"
                className="rounded-xl px-4 py-2 text-sm outline-none shadow-sm transition-all allow-select"
                style={{ width: '100%', background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !identifier}
              className="flex items-center justify-center gap-2 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)' }}
            >
              {loading && <span className="loader mr-2"></span>}
              {loading ? 'Verificando...' : 'Verificar Usuário'}
            </button>
            {error && <div className="text-rose-400 text-sm mt-2 text-center animate-shake font-medium">{error}</div>}
          </form>
        )}

        {result && (
          <div className="flex flex-col items-center gap-5 p-4 animate-fade-in w-full">
            <div className="flex items-center gap-3 mb-2">
              {result.can_renew ? (
                <CheckCircle className="w-8 h-8 text-emerald-400 animate-bounce" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-400 animate-pulse" />
              )}
              <span className={`text-xl font-bold drop-shadow ${result.can_renew ? 'text-emerald-400' : 'text-rose-400'}`}>{result.can_renew ? 'Usuário pode renovar!' : 'Usuário não pode renovar'}</span>
            </div>
            <div className="rounded-xl p-4 shadow-inner w-full max-w-md space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-base" style={{ color: 'var(--text)' }}><b>Tipo:</b> <span style={{ color: 'var(--text-muted)' }}>{result.user_type === 'both' ? 'SSH + V2Ray' : result.user_type === 'ssh' ? 'SSH' : 'V2Ray'}</span></div>
              {result.ssh && (
                <div className="text-base" style={{ color: 'var(--text)' }}><b>SSH:</b> <span style={{ color: 'var(--text-muted)' }}>{result.ssh.username}</span> <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(limite: {result.ssh.limit})</span></div>
              )}
              {result.v2ray && (
                <div className="text-base" style={{ color: 'var(--text)' }}><b>V2Ray:</b> <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{result.v2ray.uuid.substring(0, 16)}...</span> <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(limite: {result.v2ray.limit})</span></div>
              )}
              {result.current_expiration && (
                <div className="text-base" style={{ color: 'var(--text)' }}><b>Expiração atual:</b> <span style={{ color: 'var(--text-muted)' }}>{new Date(result.current_expiration).toLocaleString()}</span></div>
              )}
              {typeof result.is_expired !== 'undefined' && (
                <div className="text-base" style={{ color: 'var(--text)' }}><b>Status:</b> <span className={result.is_expired ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{result.is_expired ? 'Expirado' : 'Ativo'}</span></div>
              )}
              {typeof result.days_until_expiration !== 'undefined' && (
                <div className="text-base" style={{ color: 'var(--text)' }}><b>Dias até expirar:</b> <span style={{ color: 'var(--text-muted)' }}>{result.days_until_expiration}</span></div>
              )}
            </div>
            {result.can_renew && plans.length > 0 && (
              <div className="w-full max-w-md flex flex-col gap-2 mt-2">
                <label className="font-semibold flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
                  <DollarSign className="w-4 h-4 text-[var(--accent)]" />
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
      <div className="space-y-4 p-2 sm:p-4 animate-fade-in max-w-lg mx-auto">
        {/* Card Principal de Resumo do Pagamento */}
        <div className="rounded-2xl p-4 sm:p-5 text-center shadow-sm space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            PAGAMENTO PIX INSTANTÂNEO
          </div>
          
          <div>
            <span className="text-xs uppercase tracking-wider block font-semibold" style={{ color: 'var(--text-muted)' }}>Valor Total</span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono" style={{ color: 'var(--text)' }}>
              {paymentData.amount ? paymentData.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t text-xs font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <span>ID: <strong style={{ color: 'var(--text)' }}>{paymentData.payment_id}</strong></span>
            <span>•</span>
            <span>Expira em: <strong className="text-amber-500">{paymentData.expires_in || 15}m</strong></span>
          </div>

          {/* Mensagens de serviço */}
          {(paymentData.ssh_message || paymentData.v2ray_message) && (
            <div className="pt-2 flex flex-wrap gap-2 justify-center text-xs">
              {paymentData.ssh_message && (
                <span className="px-2.5 py-1 rounded-lg font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                  🔐 {paymentData.ssh_message}
                </span>
              )}
              {paymentData.v2ray_message && (
                <span className="px-2.5 py-1 rounded-lg font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                  🌐 {paymentData.v2ray_message}
                </span>
              )}
            </div>
          )}
        </div>

        {/* QR Code Container */}
        {(paymentData.qr_code || paymentData.ticket_url) && (
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
        {paymentData.qr_code && (
          <div className="rounded-2xl p-4 sm:p-5 shadow-sm space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>💳 PIX Copia e Cola</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Toque para copiar</span>
            </div>

            <div className="p-3 rounded-xl font-mono text-xs break-all max-h-20 overflow-y-auto custom-scrollbar select-all leading-relaxed" style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              {paymentData.qr_code}
            </div>

            <button
              type="button"
              onClick={() => {
                copyToClipboard(paymentData.qr_code).then((ok) => {
                  if (ok) {
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 2500);
                  }
                });
              }}
              className="w-full min-h-[48px] px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] touch-manipulation"
              style={{ background: copiedPix ? '#059669' : 'var(--accent)' }}
            >
              {copiedPix ? '✅ Código PIX Copiado com Sucesso!' : '📋 Copiar Código PIX'}
            </button>
          </div>
        )}

        {/* Link Alternativo do Mercado Pago */}
        {paymentData.ticket_url && (
          <button
            type="button"
            onClick={() => navigateToUrl(paymentData.ticket_url)}
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
            Verificação automática ativa • As credenciais serão aplicadas instantaneamente
          </p>
        </div>

        {pollingError && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium text-center">
            ❌ {pollingError}
          </div>
        )}

        {/* Botões de Ação de Rodapé */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] rounded-xl text-xs font-semibold transition-all touch-manipulation active:scale-[0.98]"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isPolling && currentStep === 'payment') resetPolling();
            }}
            disabled={isPolling}
            className="flex-1 min-h-[44px] rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50 touch-manipulation active:scale-[0.98]"
            style={{ background: 'var(--accent)' }}
          >
            {isPolling ? 'Verificando...' : 'Verificar Novamente'}
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
