import { useEffect, useRef } from 'react';
import { Clock3, Play, LoaderCircle, X } from 'lucide-react';
import { useSdkAds } from '../hooks/useSdkAds';
import { useTranslation } from '../i18n';
import { formatAdsTime, canCancelAd } from '../utils/adsPresentation';
import { useAutoConnectContext } from '../context/AutoConnectContext';

const portuguese = {
  running: 'Tempo restante', paused: 'Tempo disponível', empty: 'Sem tempo disponível',
  watch: 'Ganhar mais tempo', watchShort: 'Ver anúncio',
  help: 'Assista ao vídeo até o fim para receber tempo. A recompensa é confirmada pelo aplicativo.',
  loading: 'Carregando…', showing: 'Exibindo…', earned: 'Recompensa recebida! Seu tempo foi atualizado.',
  loadingTitle: 'Carregando anúncio', loadingBody: 'Aguarde enquanto preparamos o vídeo.',
  closed: 'Anúncio encerrado sem recompensa. Assista até o fim para ganhar tempo.',
  failed: 'Não foi possível exibir um anúncio agora. Tente novamente em instantes.',
  cancelled: 'Espera cancelada. Você pode tentar novamente.',
  cancel: 'Cancelar espera', warning: 'Seu tempo está acabando', expired: 'Seu tempo terminou',
  warningBody: 'Ganhe mais tempo assistindo a um anúncio recompensado e continue conectado.',
  expiredBody: 'Assista a um anúncio para ganhar tempo. Depois, use o botão Conectar para iniciar uma nova sessão.',
  later: 'Agora não', close: 'Fechar aviso', unavailable: 'Atualize o aplicativo para usar os anúncios e o contador nesta tela.',
  disabled: 'Os anúncios estão desativados para este aplicativo.',
};
const spanish: typeof portuguese = {
  running: 'Tiempo restante', paused: 'Tiempo disponible', empty: 'Sin tiempo disponible',
  watch: 'Ganar más tiempo', watchShort: 'Ver anuncio',
  help: 'Mira el video hasta el final para recibir tiempo. La aplicación confirma la recompensa.',
  loading: 'Cargando…', showing: 'Mostrando…', earned: '¡Recompensa recibida! Tu tiempo se actualizó.',
  loadingTitle: 'Cargando anuncio', loadingBody: 'Espera mientras preparamos el video.',
  closed: 'Anuncio cerrado sin recompensa. Míralo hasta el final para ganar tiempo.',
  failed: 'No se pudo mostrar un anuncio. Inténtalo de nuevo en unos instantes.',
  cancelled: 'Espera cancelada. Puedes intentarlo de nuevo.',
  cancel: 'Cancelar espera', warning: 'Tu tiempo se está agotando', expired: 'Tu tiempo terminó',
  warningBody: 'Gana más tiempo viendo un anuncio con recompensa y sigue conectado.',
  expiredBody: 'Mira un anuncio para ganar tiempo. Después, usa Conectar para iniciar una nueva sesión.',
  later: 'Ahora no', close: 'Cerrar aviso', unavailable: 'Actualiza la aplicación para usar los anuncios y el contador en esta pantalla.',
  disabled: 'Los anuncios están desactivados para esta aplicación.',
};

export function FreeAdsPanel({ blocked }: { blocked: boolean }) {
  const autoConnect = useAutoConnectContext();
  blocked = blocked || autoConnect.open;
  const { locale } = useTranslation();
  const text = locale === 'es' ? spanish : portuguese;
  const { state, notice, commandFailed, showRewarded, cancelRewarded, dismiss } = useSdkAds();
  const dialogRef = useRef<HTMLDivElement>(null);
  const showNotice = Boolean(notice && !blocked && !state?.rewarded.busy);
  const showLoading = Boolean(state?.enabled && state.rewarded.busy &&
    ['LOADING', 'READY', 'OPENING'].includes(state.rewarded.state) &&
    !state.nativeUi.rewardedLoading && !blocked);
  const showDialog = showNotice || showLoading;

  useEffect(() => {
    if (!showDialog) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previous?.focus();
  }, [showDialog]);

  const busy = state?.rewarded.busy ?? false;
  const loading = state?.rewarded.state === 'LOADING' || state?.rewarded.state === 'READY';
  const nativeLoading = loading && state?.nativeUi.rewardedLoading;
  const closeDialog = () => {
    if (showLoading) { if (state && canCancelAd(state)) cancelRewarded(); }
    else dismiss();
  };
  const status = state?.rewarded;
  const message = commandFailed || status?.state === 'FAILED' ? text.failed
    : status?.state === 'REWARDED' || (status?.state === 'CLOSED' && status.rewardEarned) ? text.earned
    : status?.state === 'CLOSED' ? text.closed
    : status?.state === 'CANCELLED' ? text.cancelled : null;

  return <>
    <section className="free-ads-card" aria-label="SSHTProject Free">
      {!state || !state.enabled ? <p className="free-ads-help" role="status">{!state ? text.unavailable : text.disabled}</p> : <>
        <div className="free-ads-time-row">
          <div className="free-ads-time"><Clock3 size={18} aria-hidden="true" /><div><h2 className="free-ads-label">{state.remainingSeconds <= 0 ? text.empty : state.timerRunning ? text.running : text.paused}</h2><span className="free-ads-timer">{formatAdsTime(state.remainingSeconds)}</span></div></div>
          <button type="button" className="free-ads-earn" onClick={showRewarded} disabled={busy || blocked} aria-label={busy ? loading ? text.loading : text.showing : `${text.watch} (+${formatAdsTime(state.rewardSeconds)})`} aria-describedby="free-ads-reward-help">
            {busy ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            <span>{busy ? loading ? text.loading : text.showing : text.watchShort}{!busy && <small>+{formatAdsTime(state.rewardSeconds)}</small>}</span>
          </button>
        </div>
        {canCancelAd(state) && !nativeLoading && <button type="button" className="free-ads-cancel" onClick={cancelRewarded}>{text.cancel}</button>}
        <p className="sr-only" id="free-ads-reward-help">{text.help}</p>
        {message && <p className="free-ads-feedback" role="status">{message}</p>}
      </>}
    </section>
    {showDialog && <div className="free-ads-overlay" onClick={event => { if (event.target === event.currentTarget && !showLoading) closeDialog(); }}>
      <div ref={dialogRef} tabIndex={-1} className="free-ads-dialog" role="dialog" aria-modal="true" aria-labelledby="free-ads-title" aria-describedby="free-ads-description"
        onKeyDown={event => {
          if (event.key === 'Escape') closeDialog();
          if (event.key === 'Tab') {
            const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
            if (!buttons?.length) { event.preventDefault(); dialogRef.current?.focus(); return; }
            const first = buttons[0], last = buttons[buttons.length - 1];
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          }
        }}>
        {!showLoading && <button type="button" className="free-ads-close" aria-label={text.close} onClick={closeDialog}><X size={20} /></button>}
        {showLoading ? <LoaderCircle size={28} className="free-ads-dialog-icon animate-spin" aria-hidden="true" /> : <Clock3 size={32} className="free-ads-dialog-icon" aria-hidden="true" />}
        <h2 id="free-ads-title">{showLoading ? text.loadingTitle : notice === 'expired' ? text.expired : text.warning}</h2>
        <p id="free-ads-description" className="free-ads-help" role={showLoading ? 'status' : undefined}>{showLoading ? text.loadingBody : notice === 'expired' ? text.expiredBody : text.warningBody}</p>
        {showLoading ? state && canCancelAd(state) && <button type="button" className="free-ads-secondary" onClick={cancelRewarded}>{text.cancel}</button> : <>
        <button type="button" className="free-ads-action" onClick={showRewarded}><Play size={18} aria-hidden="true" />{text.watch}</button>
        <button type="button" className="free-ads-secondary" onClick={dismiss}>{text.later}</button>
        </>}
      </div>
    </div>}
  </>;
}
