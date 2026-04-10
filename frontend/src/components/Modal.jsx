import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';

// Minimal accessible modal: portal, Esc-to-close, backdrop click,
// body scroll lock, focuses first focusable element on open and
// returns focus to the trigger on close.
//
// Deliberately NOT a full focus trap (no Tab/Shift+Tab cycling).
// Add that if/when this becomes a critical accessibility issue —
// it's ~30 lines of keyboard handling that's easier to test against
// a real screen reader. Comment marks the spot below.
export default function Modal({ isOpen, onClose, title, children }) {
  const { t } = useLanguage();
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      // TODO: full focus trap goes here — intercept Tab/Shift+Tab
      // and cycle focus through focusable descendants of dialogRef.
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    const focusable = dialogRef.current?.querySelector(
      'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title || ''}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label={t('modal_close')}
        >
          &times;
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}
