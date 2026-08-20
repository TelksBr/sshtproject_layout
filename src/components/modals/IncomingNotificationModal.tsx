import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from '../../utils/icons';
import { Modal } from './Modal';
import { useAppNotifications } from '../../context/AppNotificationsContext';
import { sanitizeNotificationHtml, stripLogHtml, normalizeNotificationMediaUrl, handleNotificationHtmlClick } from '../../utils/appFunctions';
import type { AppNotification } from '../../utils/appNotifications';

export function IncomingNotificationHost() {
  const { incoming, dismissIncoming } = useAppNotifications();
  if (!incoming || typeof document === 'undefined') return null;

  return createPortal(
    <IncomingNotificationModal notification={incoming} onClose={dismissIncoming} />,
    document.body
  );
}

function IncomingNotificationModal({
  notification,
  onClose,
}: {
  notification: AppNotification;
  onClose: () => void;
}) {
  const [brokenImage, setBrokenImage] = useState(false);
  const titleText = stripLogHtml(notification.title) || 'Notificação';
  const messageHtml = sanitizeNotificationHtml(notification.message);
  const titleHtml = sanitizeNotificationHtml(notification.title);
  const imageUrl = normalizeNotificationMediaUrl(notification.image);
  const showImage = Boolean(imageUrl) && !brokenImage;

  return (
    <Modal onClose={onClose} title={titleText} icon={Bell} overlayClassName="z-[80]">
      <div className="flex flex-col">
        <div className="p-4 sm:p-5 space-y-4">
          {showImage && (
            <img
              src={imageUrl}
              alt=""
              className="w-full max-h-56 object-contain rounded-xl"
              style={{ background: 'var(--bg-elevated)' }}
              onError={() => setBrokenImage(true)}
            />
          )}

          {messageHtml ? (
            <div
              className="notification-html text-sm leading-relaxed"
              onClick={handleNotificationHtmlClick}
              dangerouslySetInnerHTML={{ __html: messageHtml }}
            />
          ) : (
            <div
              className="notification-html text-sm leading-relaxed"
              onClick={handleNotificationHtmlClick}
              dangerouslySetInnerHTML={{ __html: titleHtml || titleText }}
            />
          )}
        </div>

        <div className="p-4 sm:p-5 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] rounded-xl text-white text-sm font-semibold touch-manipulation"
            style={{ background: 'var(--accent)' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
