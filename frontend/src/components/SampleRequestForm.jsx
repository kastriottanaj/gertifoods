import { useState } from 'react';
import api from '../services/api';
import Honeypot from './Honeypot';
import { useLanguage } from '../i18n/LanguageContext';
import { completeLead } from '../lib/conversion';
import { newEventId, hasMarketingConsent } from '../lib/events';
import { getAttribution } from '../lib/attribution';
import { getRecaptchaToken } from '../lib/recaptcha';

const BUSINESS_TYPES = [
  'bakery',
  'restaurant',
  'hotel',
  'supermarket',
  'catering',
  'distributor',
  'other',
];

const INITIAL_FORM = {
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  city: '',
  business_type: 'bakery',
  products_interested: '',
  message: '',
  website: '', // honeypot — must stay empty for real users
};

// `initialProducts` seeds the "products interested" field. The tortilla landing
// page opens this modal from a specific variant card, so the lead arrives
// saying which variant it came from instead of leaving sales to guess. Empty
// by default, which is the behaviour every other caller already had.
//
// `compact` is for the timed lead popup, which draws its own heading beside the
// factory photo. It leaves out the form's own heading and the two optional text
// areas, so the card fits a laptop screen without scrolling. Every required
// field stays, and the two left out are optional on the server too, so the
// lead arrives in the same shape, only without those notes.
export default function SampleRequestForm({
  source = 'other',
  initialProducts = '',
  onSuccess,
  compact = false,
}) {
  const { t, lang } = useLanguage();
  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    products_interested: initialProducts,
  }));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const recaptcha_token = await getRecaptchaToken('sample_request_submit');
      // One id for one conversion, minted before the POST: Django sends its
      // own copy of this event through the Conversions API, and Meta treats
      // the two as the same conversion only if they carry the same id.
      const eventID = newEventId();
      await api.post('/leads/sample-request/', {
        ...form,
        source,
        recaptcha_token,
        event_id: eventID,
        ...getAttribution(),
        marketing_consent: hasMarketingConsent(),
      });
      setSuccess(true);
      // Before completeLead, deliberately: onSuccess is what writes the
      // sample_request_submitted flag that suppresses the lead popup,
      // and it must be on disk before the visitor navigates away — otherwise
      // the popup would be armed again the moment they came back.
      if (onSuccess) onSuccess();
      // fullName rather than first/last: this form asks for one contact name,
      // and advancedMatching() splits it. Hashed before storage, as above.
      completeLead({
        formName: 'sample_request',
        source,
        lang,
        eventID,
        pii: {
          email: form.email,
          phone: form.phone,
          fullName: form.contact_name,
        },
      });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const messages = Object.values(data).flat().join(' ');
        setError(messages || t('sample_form_error'));
      } else {
        setError(t('sample_form_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="sample-form-success">
        <h2>{t('sample_form_success_title')}</h2>
        <p>{t('sample_form_success_body')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="sample-form">
      {!compact && (
        <>
          <h2>{t('sample_form_title')}</h2>
          <p className="sample-form-subtitle">{t('sample_form_subtitle')}</p>
        </>
      )}

      <Honeypot value={form.website} onChange={handleChange} />

      <div className="form-row">
        <div className="form-group">
          <label>{t('sample_form_company')} *</label>
          <input
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>{t('sample_form_contact')} *</label>
          <input
            name="contact_name"
            value={form.contact_name}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>{t('sample_form_email')} *</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>{t('sample_form_phone')} *</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>{t('sample_form_city')}</label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>{t('sample_form_business_type')} *</label>
          <select
            name="business_type"
            value={form.business_type}
            onChange={handleChange}
            required
          >
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`sample_form_business_${type}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!compact && (
        <>
          <div className="form-group">
            <label>{t('sample_form_products')}</label>
            <textarea
              name="products_interested"
              value={form.products_interested}
              onChange={handleChange}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>{t('sample_form_message')}</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </>
      )}

      {error && <p className="error-message">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary btn-full"
      >
        {loading ? t('sample_form_loading') : t('sample_form_submit')}
      </button>
    </form>
  );
}
