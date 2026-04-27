import { useEffect, useState } from 'react';
import Modal from './Modal';
import SampleRequestForm from './SampleRequestForm';
import { useLanguage } from '../i18n/LanguageContext';

// sessionStorage keys — shared across the app:
//   SUBMITTED is set by ANY successful sample-request submission
//     (hero modal or exit popup). If set, the exit popup never shows.
//   DISMISSED is set when the user closes the exit popup without
//     submitting. Suppresses for the rest of this tab session only.
const SUBMITTED_KEY = 'sample_request_submitted';
const DISMISSED_KEY = 'exit_popup_dismissed';

// Don't arm the exit-intent listener until the user has been on the
// page for this long. Avoids catching immediate bouncers who were
// never going to convert anyway.
const ARM_DELAY_MS = 5000;

// Desktop only — mobile has no cursor, and aggressive mobile
// substitutes (back-button traps etc.) feel manipulative.
const MIN_VIEWPORT_WIDTH = 768;

// Forgiveness margin for the top-of-viewport exit detection.
// Cursor velocity can carry it past clientY=0 before the event
// fires, so a small threshold catches more real exit attempts.
const TOP_EDGE_THRESHOLD_PX = 50;

export default function ExitIntentPopup() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);

  // Mount-time gate + arm delay.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < MIN_VIEWPORT_WIDTH) return;
    if (sessionStorage.getItem(SUBMITTED_KEY)) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const armTimer = setTimeout(() => setArmed(true), ARM_DELAY_MS);
    return () => clearTimeout(armTimer);
  }, []);

  // Listen for top-edge mouseout once armed.
  useEffect(() => {
    if (!armed) return;

    const handleMouseOut = (e) => {
      // relatedTarget is null when the cursor leaves the document entirely
      // (not just moving between child elements). clientY threshold
      // restricts to top-edge exits — leaving via the sides is not exit-intent.
      if (!e.relatedTarget && e.clientY <= TOP_EDGE_THRESHOLD_PX) {
        setOpen(true);
        setArmed(false);
      }
    };

    document.addEventListener('mouseout', handleMouseOut);
    return () => document.removeEventListener('mouseout', handleMouseOut);
  }, [armed]);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem(DISMISSED_KEY, '1');
  };

  const handleSubmitSuccess = () => {
    sessionStorage.setItem(SUBMITTED_KEY, '1');
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={t('sample_form_title')}
    >
      <SampleRequestForm source="exit_popup" onSuccess={handleSubmitSuccess} />
    </Modal>
  );
}
