import { useState, type ReactNode } from 'react';
import { Calendar, Clock, RefreshCw, User, AlertTriangle } from '../../utils/icons';
import RenewalModal from './RenewalModal';
import {
  isUserExpired,
  isUserNearExpiration,
  shouldOfferRenewal,
  type UserInfo,
} from '../../utils/checkUserUtils';

interface CheckUserDetailsProps {
  userInfo: UserInfo;
  headerAction?: ReactNode;
}

function daysLabel(info: UserInfo): string {
  const days = Number(info.expiration_days);
  if (isUserExpired(info)) {
    if (days < 0) return `Expirado há ${Math.abs(days)}d`;
    return 'Expirado';
  }
  if (days === 1) return '1 dia';
  return `${days} dias`;
}

function statusCopy(info: UserInfo): { label: string; detail?: string } {
  if (isUserExpired(info)) {
    return {
      label: 'Usuário expirado',
      detail: 'Renove o login para continuar usando o app.',
    };
  }
  if (isUserNearExpiration(info)) {
    const days = Number(info.expiration_days);
    return {
      label: days === 1 ? 'Expira amanhã' : `Expira em ${days} dias`,
      detail: 'Renove agora para não perder o acesso.',
    };
  }
  return { label: 'Ativo' };
}

export function CheckUserDetails({ userInfo, headerAction }: CheckUserDetailsProps) {
  const [showRenewal, setShowRenewal] = useState(false);
  const expired = isUserExpired(userInfo);
  const near = isUserNearExpiration(userInfo);
  const offerRenewal = shouldOfferRenewal(userInfo);
  const status = statusCopy(userInfo);
  const toneColor = expired ? '#fca5a5' : near ? '#fcd34d' : 'var(--text)';
  const toneBorder = expired ? 'rgba(248,113,113,0.35)' : near ? 'rgba(251,191,36,0.35)' : 'var(--border)';
  const toneBg = expired ? 'rgba(248,113,113,0.12)' : near ? 'rgba(251,191,36,0.12)' : 'var(--bg-elevated)';

  return (
    <>
      <div className="grid gap-4">
        <div className="p-4 rounded-lg glass-effect">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <User className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="font-medium truncate" style={{ color: 'var(--text)' }}>
                {userInfo.username}
              </span>
            </div>
            {headerAction}
          </div>

          {(expired || near) && (
          <div
            className="mb-4 px-3 py-2 rounded-lg text-sm font-semibold"
            style={{ background: toneBg, color: toneColor, border: `1px solid ${toneBorder}` }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{status.label}</span>
            </div>
            {status.detail && (
              <p className="mt-1 text-xs font-medium opacity-90">{status.detail}</p>
            )}
          </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-3 rounded-lg"
              style={{ background: 'var(--bg-elevated)', border: `1px solid ${toneBorder}` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Dias restantes</span>
              </div>
              <span className="text-xl font-bold" style={{ color: toneColor }}>
                {daysLabel(userInfo)}
              </span>
            </div>

            <div
              className="p-3 rounded-lg"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Expira em</span>
              </div>
              <span style={{ color: 'var(--text)' }}>{userInfo.expiration_date || '—'}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg glass-effect">
          <h3 className="font-medium mb-4" style={{ color: 'var(--text)' }}>Detalhes da conexão</h3>
          <div className="space-y-3">
            <div
              className="flex justify-between items-center p-3 rounded-lg"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Limite de dispositivos</span>
              <span style={{ color: 'var(--text)' }}>{userInfo.limit_connections}</span>
            </div>
            <div
              className="flex justify-between items-center p-3 rounded-lg"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Dispositivos conectados</span>
              <span style={{ color: 'var(--text)' }}>{userInfo.count_connections}</span>
            </div>
          </div>
        </div>

        {offerRenewal && (
          <button
            type="button"
            onClick={() => setShowRenewal(true)}
            className="w-full min-h-[44px] lg:min-h-[48px] rounded-xl font-semibold text-white flex items-center justify-center gap-2 touch-manipulation"
            style={{ background: 'var(--accent)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Renovar Login
          </button>
        )}
      </div>

      {showRenewal && (
        <RenewalModal
          onClose={() => setShowRenewal(false)}
          initialUsername={userInfo.username}
        />
      )}
    </>
  );
}
