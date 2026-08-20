import { useState } from 'react';
import { Bell, Trash2, X } from '../../utils/icons';
import { Modal } from './Modal';
import { useAppNotifications } from '../../context/AppNotificationsContext';
import { formatNotificationTime } from '../../utils/appNotifications';
import { sanitizeNotificationHtml, normalizeNotificationMediaUrl, handleNotificationHtmlClick } from '../../utils/appFunctions';

interface NotificationsModalProps {
  onClose: () => void;
}

export function NotificationsModal({ onClose }: NotificationsModalProps) {
  const { items, remove, clearAll, openNotification } = useAppNotifications();

  return (
    <Modal
      onClose={onClose}
      title="Notificações"
      icon={Bell}
      headerActions={
        items.length > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl touch-manipulation"
            style={{ background: 'var(--bg-elevated)' }}
            aria-label="Limpar notificações"
          >
            <Trash2 className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        ) : null
      }
    >
      <div className="p-3 sm:p-4">
        {items.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhuma notificação recebida.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <NotificationCard
                key={item.id}
                title={item.title}
                message={item.message}
                image={item.image}
                time={formatNotificationTime(item.receivedAt)}
                unread={!item.read}
                onOpen={() => openNotification(item)}
                onRemove={() => remove(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function NotificationCard({
  title,
  message,
  image,
  time,
  unread,
  onOpen,
  onRemove,
}: {
  title: string;
  message: string;
  image?: string;
  time: string;
  unread: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const [brokenImage, setBrokenImage] = useState(false);
  const imageUrl = normalizeNotificationMediaUrl(image);
  const showImage = Boolean(imageUrl) && !brokenImage;

  return (
    <article
      className="relative rounded-xl p-3"
      style={{
        background: 'var(--bg-elevated)',
        border: unread ? '1px solid var(--accent)' : '1px solid var(--border)',
      }}
    >
      <button
        type="button"
        onClick={(event) => {
          if (handleNotificationHtmlClick(event)) return;
          onOpen();
        }}
        className="w-full text-left touch-manipulation"
        aria-label="Abrir notificação"
      >
        <div className="flex gap-3 pr-8">
          {showImage && (
            <img
              src={imageUrl}
              alt=""
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              onError={() => setBrokenImage(true)}
            />
          )}
          <div className="min-w-0 flex-1">
            <h3
              className="notification-html notification-html--compact text-sm font-semibold"
              style={{ color: 'var(--text)' }}
              dangerouslySetInnerHTML={{ __html: sanitizeNotificationHtml(title) }}
            />
            {message && (
              <div
                className="notification-html notification-html--compact text-xs mt-1 break-words"
                dangerouslySetInnerHTML={{ __html: sanitizeNotificationHtml(message) }}
              />
            )}
            <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
              {time}
            </p>
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg touch-manipulation"
        aria-label="Remover notificação"
      >
        <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
      </button>
    </article>
  );
}
