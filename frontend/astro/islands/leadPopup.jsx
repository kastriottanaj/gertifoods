import { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import IslandLanguage from './IslandLanguage.jsx';
import { useLanguage } from '../../src/i18n/LanguageContext';
import Modal from '../../src/components/Modal';
import SampleRequestForm from '../../src/components/SampleRequestForm';
// The factory in Prizren, from the company's own photo. Imported, so it is
// content-hashed (/_astro/…) and a replacement can never be served stale.
import factoryPhoto from '../../src/assets/gerti-foods-factory-prizren.webp';
// As a string, injected by mount(). A plain `import './leadPopup.css'` makes
// Astro hoist the file into every page as a stylesheet link, so every visitor
// would download it whether or not the popup ever opened. Injected here, it
// arrives inside this chunk and is in place before the first paint of the card.
// The CSP allows it: style-src includes 'unsafe-inline'.
import popupCss from './leadPopup.css?inline';

// The timed lead popup: the factory photo beside a short sample-request form.
//
// This module is never referenced statically. BaseLayout.astro decides when to
// show it (consent granted, ten seconds, not snoozed, visitor not busy) with a
// few lines of plain JavaScript, and import()s this only at that moment, so a
// visitor who never sees the popup downloads none of it.
//
// Messages are passed in rather than imported. Importing LanguageProvider here
// would put the 107 KB translation table back in the client build: it would be
// reachable from src/i18n/LanguageContext.jsx, which every form imports
// useLanguage() from, so Rollup could not drop it.

// How long to hold the popup back while the photo decodes. Long enough that it
// almost always opens complete, short enough that a slow connection still gets
// the form promptly; the photo then fades in when it arrives.
const PHOTO_WAIT_MS = 1500;

function LeadPopup() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(true);
  // Stable, because Modal's effect depends on it: a new function each render
  // would re-run the effect and pull focus back to the close button.
  const close = useCallback(() => setOpen(false), []);

  return (
    <Modal isOpen={open} onClose={close} title={t('lead_popup_title')} className="lead-popup">
      {/* Decorative: the caption beside it says what it shows. */}
      <div className="lead-popup-photo">
        <img
          src={factoryPhoto.src}
          width={factoryPhoto.width}
          height={factoryPhoto.height}
          alt=""
          decoding="async"
        />
        <div className="lead-popup-caption">
          <span className="lead-popup-badge">ISO 22000</span>
          <strong>{t('lead_popup_photo_title')}</strong>
        </div>
      </div>

      <div className="lead-popup-body">
        <p className="lead-popup-eyebrow">{t('lead_popup_eyebrow')}</p>
        <h2 className="lead-popup-title">{t('lead_popup_title')}</h2>
        <p className="lead-popup-subtitle">{t('lead_popup_subtitle')}</p>
        {/* No onSuccess: completeLead() records the conversion for every form,
            which is what keeps this popup away afterwards. 'exit_popup' is the
            source Django and GA4 already know this popup by. */}
        <SampleRequestForm source="exit_popup" compact />
        <p className="lead-popup-privacy">{t('lead_popup_privacy')}</p>
      </div>
    </Modal>
  );
}

function photoReady() {
  const img = new Image();
  img.src = factoryPhoto.src;
  return Promise.race([
    img.decode().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, PHOTO_WAIT_MS)),
  ]);
}

/** Mounts the popup. Called once, by the popup timer in BaseLayout. */
export default async function mount(lang, messages) {
  await photoReady();

  const style = document.createElement('style');
  style.textContent = popupCss;
  document.head.appendChild(style);

  // Modal portals into document.body, so this element is only an anchor for the
  // React root.
  const host = document.createElement('div');
  host.setAttribute('data-lead-popup-root', '');
  document.body.appendChild(host);

  createRoot(host).render(
    <IslandLanguage lang={lang} messages={messages}>
      <LeadPopup />
    </IslandLanguage>
  );
}
