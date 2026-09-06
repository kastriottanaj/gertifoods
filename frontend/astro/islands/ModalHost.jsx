import { useEffect, useState } from 'react';
import IslandLanguage from './IslandLanguage.jsx';
import { useLanguage } from '../../src/i18n/LanguageContext';
import Modal from '../../src/components/Modal';
import SampleRequestForm from '../../src/components/SampleRequestForm';
import CatalogRequestForm from '../../src/components/CatalogRequestForm';

// Holds the sample-request and catalog modals for a page.
//
// In Home.jsx these were two pieces of useState driving five scattered trigger
// buttons. Those buttons are now static HTML, so they can't call setState —
// instead they dispatch a 'gf:open-modal' event and this island listens.
// Everything inside (Modal, SampleRequestForm, CatalogRequestForm) is the
// original React component, unchanged.
//
// The queue handles the race where someone clicks before this island has
// hydrated: the inline trigger script parks the request on window and the
// listener picks it up on mount, so an early click opens the modal late rather
// than being swallowed.
function ModalHostInner({ sampleSource, closeOnSampleSuccess }) {
  const { t } = useLanguage();
  const [openModal, setOpenModal] = useState(null);
  // Which product the opening trigger named, if any. The tortilla variant cards
  // pass one; every other trigger on the site sends a bare string and leaves
  // this empty.
  const [prefill, setPrefill] = useState('');

  useEffect(() => {
    // A trigger sends either a bare modal name ('sample') — which is what
    // Home.astro and Products.astro have always sent — or { modal, products }.
    // Accepting both is what keeps this change invisible to those two pages.
    const apply = (detail) => {
      if (detail && typeof detail === 'object') {
        setOpenModal(detail.modal);
        setPrefill(detail.products || '');
      } else {
        setOpenModal(detail);
        setPrefill('');
      }
    };

    const handleOpen = (e) => {
      window.__gfPendingModal = null;
      apply(e.detail);
    };
    window.addEventListener('gf:open-modal', handleOpen);

    if (window.__gfPendingModal) {
      // Treat the queued value like the event it stands in for. Scheduling the
      // state update also avoids a synchronous state cascade during hydration.
      const pendingModal = window.__gfPendingModal;
      window.__gfPendingModal = null;
      queueMicrotask(() => apply(pendingModal));
    }

    return () => window.removeEventListener('gf:open-modal', handleOpen);
  }, []);

  const close = () => setOpenModal(null);

  return (
    <>
      <Modal
        isOpen={openModal === 'sample'}
        onClose={close}
        title={t('sample_form_title')}
      >
        {/* Keyed on the prefill so re-opening from a different variant card
            remounts the form and re-seeds the field, rather than keeping the
            value from the previous open. */}
        <SampleRequestForm
          key={prefill}
          source={sampleSource}
          initialProducts={prefill}
          onSuccess={() => {
            sessionStorage.setItem('sample_request_submitted', '1');
            // Products.jsx closed the modal on success; Home.jsx left it open
            // showing the form's own success state. Preserve both.
            if (closeOnSampleSuccess) close();
          }}
        />
      </Modal>

      <Modal
        isOpen={openModal === 'catalog'}
        onClose={close}
        title={t('catalog_modal_title')}
      >
        <CatalogRequestForm
          onSuccess={() => sessionStorage.setItem('catalog_request_submitted', '1')}
        />
      </Modal>
    </>
  );
}

export default function ModalHost({
  lang,
  messages,
  sampleSource = 'home_hero',
  closeOnSampleSuccess = false,
}) {
  return (
    <IslandLanguage lang={lang} messages={messages}>
      <ModalHostInner
        sampleSource={sampleSource}
        closeOnSampleSuccess={closeOnSampleSuccess}
      />
    </IslandLanguage>
  );
}
