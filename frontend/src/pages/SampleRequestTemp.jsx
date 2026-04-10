// TEMPORARY route — used to verify SampleRequestForm + Modal in
// isolation before they get wired into the home hero. Delete this
// file and the matching route in App.jsx once the modal integration
// in Home.jsx lands.
import { useState } from 'react';
import SampleRequestForm from '../components/SampleRequestForm';
import Modal from '../components/Modal';
import SEO from '../components/SEO';

export default function SampleRequestTemp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="auth-page">
      <SEO title="Sample Request (test)" description="" />
      <div className="auth-card auth-card-wide" style={{ textAlign: 'center' }}>
        <h1>Modal + Form Test</h1>
        <p>Temporary route to verify the Modal + SampleRequestForm integration before wiring into the Home hero.</p>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => setOpen(true)}
        >
          Open Sample Request Form
        </button>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Request Free Samples"
      >
        <SampleRequestForm source="other" />
      </Modal>
    </div>
  );
}
