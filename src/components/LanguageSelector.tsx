import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Search } from '../utils/icons';
import { useTranslation, type LocaleType } from '../i18n';
import { LANGUAGES } from '../i18n/registry';
import { Modal } from './modals/Modal';

const options = Object.entries(LANGUAGES) as [LocaleType, (typeof LANGUAGES)[LocaleType]][];
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function LanguageSelector() {
  const { t, locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const current = LANGUAGES[locale];
  const filtered = options.filter(([code, language]) => normalize(`${language.name} ${code}`).includes(normalize(query.trim())));

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key !== 'Tab') return;
      const elements = dialogRef.current?.querySelectorAll<HTMLElement>('button, input');
      if (!elements?.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setQuery(''); setOpen(true); }}
        aria-label={`${t('sidebar.selectLanguage')}: ${current.name}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t('sidebar.selectLanguage')}
        className="flex items-center gap-1.5 px-2 min-h-[44px] rounded-xl flex-shrink-0 touch-manipulation active:opacity-70"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        <Globe className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <span className="text-[11px] font-semibold">{current.shortName}</span>
      </button>
      {open && createPortal(
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t('sidebar.selectLanguage')}>
          <Modal onClose={() => setOpen(false)} title={t('sidebar.selectLanguage')} icon={Globe}>
            <div className="p-3 sm:p-5 space-y-4">
              <label className="flex items-center gap-2 px-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  aria-label={t('languageSelector.search')}
                  placeholder={t('languageSelector.search')}
                  className="w-full min-w-0 min-h-[44px] bg-transparent outline-none text-sm"
                  style={{ color: 'var(--text)' }}
                />
              </label>
              <div role="group" aria-label={t('sidebar.language')} className="max-h-[50vh] overflow-y-auto space-y-2">
                {filtered.map(([code, language]) => (
                  <button
                    key={code}
                    type="button"
                    lang={code}
                    aria-pressed={locale === code}
                    onClick={() => { setLocale(code); setOpen(false); }}
                    className="w-full flex items-center justify-between gap-3 text-left min-h-[52px] px-4 rounded-xl border touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                    style={{
                      background: locale === code ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      borderColor: locale === code ? 'var(--accent)' : 'var(--border)',
                      color: 'var(--text)',
                    }}
                  >
                    <span className="text-sm font-medium">{language.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{language.shortName}</span>
                  </button>
                ))}
                {filtered.length === 0 && <p role="status" className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('languageSelector.noResults')}</p>}
              </div>
            </div>
          </Modal>
        </div>,
        document.body,
      )}
    </>
  );
}
