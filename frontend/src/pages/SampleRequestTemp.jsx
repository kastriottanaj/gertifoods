// TEMPORARY route — used to verify SampleRequestForm in isolation before
// it gets wired into the home hero modal. Delete this file and the matching
// route in App.jsx once the modal integration lands.
import SampleRequestForm from '../components/SampleRequestForm';
import SEO from '../components/SEO';

export default function SampleRequestTemp() {
  return (
    <div className="auth-page">
      <SEO title="Sample Request" description="" />
      <div className="auth-card auth-card-wide">
        <SampleRequestForm source="other" />
      </div>
    </div>
  );
}
