import { useEffect, useState } from 'react';
import { LanguageProvider } from '../../src/i18n/LanguageContext';
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

  useEffect(() => {
    const handleOpen = (e) => {
      window.__gfPendingModal = null;
      setOpenModal(e.detail);
    };
    window.addEventListener('gf:open-modal', handleOpen);

    if (window.__gfPendingModal) {
      setOpenModal(window.__gfPendingModal);
      window.__gfPendingModal = null;
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
        <SampleRequestForm
          source={sampleSource}
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
  sampleSource = 'home_hero',
  closeOnSampleSuccess = false,
}) {
  return (
    <LanguageProvider initialLang={lang}>
      <ModalHostInner
        sampleSource={sampleSource}
        closeOnSampleSuccess={closeOnSampleSuccess}
      />
    </LanguageProvider>
  );
}
