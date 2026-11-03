import { message as tr, useMessages } from '../../i18n/messages';
import { useState, type ReactNode } from 'react';
import { Calendar, Clock, RefreshCw, User, AlertTriangle } from '../../utils/icons';
import RenewalModal from './RenewalModal';
import {
  formatBrazilDateTime,
  getValidityRemaining,
  isUserExpired,
  isUserNearExpiration,
  shouldOfferRenewal,
  type UserInfo,
} from '../../utils/checkUserUtils';

interface CheckUserDetailsProps {
  userInfo: UserInfo;
  headerAction?: ReactNode;
}

function remainingCaption(unit: ReturnType<typeof getValidityRemaining>['unit']): string {
  if (unit === 'hours' || unit === 'minutes') return tr("mea1e1d6250");
  return tr("mbdf91e943d");
}

function statusCopy(info: UserInfo): { label: string; detail?: string } {
  const remaining = getValidityRemaining(info);
  if (isUserExpired(info)) {
    return {
      label: tr("m4cb26b2eda"),
      detail: tr("m5b0fa44c0c"),
    };
  }
  if (isUserNearExpiration(info)) {
    if (remaining.unit === 'minutes' || remaining.unit === 'hours') {
      return {
        label: tr("m1eaf9a914c", { p0: remaining.label }),
        detail: tr("mcd1fbb2d1f"),
      };
    }
    return {
      label: remaining.days === 1 ? tr("ma63cfc5282") : tr("m3586c9559b", { p0: remaining.days }),
      detail: tr("mcd1fbb2d1f"),
    };
  }
  return { label: tr("m499ee302f6") };
}

export function CheckUserDetails({ userInfo, headerAction }: CheckUserDetailsProps) {
  useMessages();
  const [showRenewal, setShowRenewal] = useState(false);
  const expired = isUserExpired(userInfo);
  const near = isUserNearExpiration(userInfo);
  const offerRenewal = shouldOfferRenewal(userInfo);
  const status = statusCopy(userInfo);
  const remaining = getValidityRemaining(userInfo);
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
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {remainingCaption(remaining.unit)}
                </span>
              </div>
              <span className="text-xl font-bold" style={{ color: toneColor }}>
                {remaining.label}
              </span>
            </div>

            <div
              className="p-3 rounded-lg"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{tr("me5b7cdb2f5")}</span>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {formatBrazilDateTime(userInfo.expiration_date)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg glass-effect">
          <h3 className="font-medium mb-4" style={{ color: 'var(--text)' }}>{tr("mc8f6193321")}</h3>
          <div className="space-y-3">
            <div
              className="flex justify-between items-center p-3 rounded-lg"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{tr("me065cadeea")}</span>
              <span style={{ color: 'var(--text)' }}>{userInfo.limit_connections}</span>
            </div>
            <div
              className="flex justify-between items-center p-3 rounded-lg"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{tr("m3cb9174c8b")}</span>
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
            {tr("m3a6661e36e")}</button>
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
