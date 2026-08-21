import { useState } from 'react';
import { Book, ChevronLeft, Play } from '../../utils/icons';
import { Modal } from './Modal';
import { openExternalUrl } from '../../utils/appFunctions';
import { tutorials, youtubeThumbUrl, youtubeWatchUrl } from '../../data/tutorials';
import type { Tutorial } from '../../types/Tutorial';

export function Tutorials({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<Tutorial | null>(null);

  return (
    <Modal
      onClose={onClose}
      title={selected ? selected.title : 'Tutoriais'}
      icon={selected ? undefined : Book}
      onBack={selected ? () => setSelected(null) : undefined}
    >
      {selected ? (
        <TutorialDetail tutorial={selected} />
      ) : (
        <div className="p-3 sm:p-4 space-y-2">
          {tutorials.map((tutorial) => {
            const Icon = tutorial.icon;
            return (
              <button
                key={tutorial.id}
                type="button"
                onClick={() => setSelected(tutorial)}
                className="w-full min-h-[44px] p-3 rounded-xl text-left flex items-center gap-3 touch-manipulation"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--accent-dim)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {tutorial.title}
                  </h3>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {tutorial.description}
                  </p>
                </div>
                <ChevronLeft
                  className="w-4 h-4 rotate-180 flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                />
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function TutorialDetail({ tutorial }: { tutorial: Tutorial }) {
  const [thumbBroken, setThumbBroken] = useState(false);
  const hasVideo = Boolean(tutorial.youtubeId);
  const showThumb = hasVideo && !thumbBroken && tutorial.youtubeId;

  return (
    <div className="p-3 sm:p-4 space-y-4">
      {tutorial.description && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {tutorial.description}
        </p>
      )}

      {hasVideo && tutorial.youtubeId && (
        <div className="space-y-3">
          {showThumb && (
            <button
              type="button"
              onClick={() => openExternalUrl(youtubeWatchUrl(tutorial.youtubeId!))}
              className="relative w-full aspect-video rounded-xl overflow-hidden touch-manipulation"
              style={{ background: 'var(--bg-elevated)' }}
              aria-label="Assistir no YouTube"
            >
              <img
                src={youtubeThumbUrl(tutorial.youtubeId)}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setThumbBroken(true)}
              />
              <span
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.35)' }}
              >
                <span
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent)' }}
                >
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </span>
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => openExternalUrl(youtubeWatchUrl(tutorial.youtubeId!))}
            className="w-full min-h-[44px] rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 touch-manipulation"
            style={{ background: 'var(--accent)' }}
          >
            <Play className="w-4 h-4" />
            Assistir no YouTube
          </button>
        </div>
      )}

      {tutorial.steps && tutorial.steps.length > 0 && (
        <ol className="space-y-2">
          {tutorial.steps.map((step, index) => (
            <li
              key={`${step.title}-${index}`}
              className="flex gap-3 p-3 rounded-xl"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
              }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white"
                style={{ background: 'var(--accent)' }}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {step.title}
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {tutorial.links && tutorial.links.length > 0 && (
        <div className="flex flex-col gap-2">
          {tutorial.links.map((link) => (
            <button
              key={link.url}
              type="button"
              onClick={() => openExternalUrl(link.url)}
              className="w-full min-h-[44px] rounded-xl text-sm font-semibold touch-manipulation"
              style={{
                background: 'var(--accent-dim)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
