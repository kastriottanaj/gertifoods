import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import IslandLanguage from './IslandLanguage.jsx';
import { useLanguage } from '../../src/i18n/LanguageContext';
import Modal from '../../src/components/Modal';
import SampleRequestForm from '../../src/components/SampleRequestForm';

// The heavy half of the old ExitIntentPopup.jsx: the modal and the sample
// request form.
//
// This module is never referenced statically. BaseLayout.astro watches for exit
// intent with a few lines of plain JavaScript and import()s this only once the
// cursor actually leaves the top of the viewport — so a visitor who never
// triggers the popup downloads none of it, and the content pages stay at
// roughly 7 KB of JavaScript.
//
// Messages are passed in rather than imported. Importing LanguageProvider here
// was the last thing keeping the 107 KB translation table in the client build:
// it kept the table reachable from src/i18n/LanguageContext.jsx, which every
// form imports useLanguage() from, so Rollup could not drop it.
//
// The detection half (viewport gate, sessionStorage gates, arm delay, top-edge
// threshold) lives in BaseLayout.astro.
const SUBMITTED_KEY = 'sample_request_submitted';
const DISMISSED_KEY = 'exit_popup_dismissed';

function ExitIntentModal() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    try {
      // Suppresses the popup for the rest of this tab session only — same
      // contract as the original component.
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const handleSubmitSuccess = () => {
    try {
      sessionStorage.setItem(SUBMITTED_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title={t('sample_form_title')}>
      <SampleRequestForm source="exit_popup" onSuccess={handleSubmitSuccess} />
    </Modal>
  );
}

/** Mounts the popup. Called once, by the exit-intent watcher in BaseLayout. */
export default function mount(lang, messages) {
  // Modal portals into document.body, so this element is only an anchor for the
  // React root.
  const host = document.createElement('div');
  host.setAttribute('data-exit-intent-root', '');
  document.body.appendChild(host);

  createRoot(host).render(
    <IslandLanguage lang={lang} messages={messages}>
      <ExitIntentModal />
    </IslandLanguage>
  );
}
