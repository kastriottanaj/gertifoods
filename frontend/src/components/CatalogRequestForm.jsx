import { useState } from 'react';
import api from '../services/api';
import Honeypot from './Honeypot';
import { useLanguage } from '../i18n/LanguageContext';
import { trackLead } from '../lib/conversion';
import { getRecaptchaToken } from '../lib/recaptcha';

const INITIAL_FORM = {
  company_name: '',
  email: '',
  website: '', // honeypot — must stay empty for real users
};

export default function CatalogRequestForm({ onSuccess }) {
  const { t, lang } = useLanguage();
  const [form, setForm] = useState(INITIAL_FORM);
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
      await api.post('/leads/sample-request/', {
        ...form,
        source: 'catalog_request',
        recaptcha_token,
      });
      setSuccess(true);
      if (onSuccess) onSuccess();
      // trackLead, not completeLead: this form's payoff is the catalog email
      // Django sends on submit, and redirecting the tab to the thank-you page
      // would pull the visitor away from the success message telling them to
      // go check their inbox. GA4 still gets the same generate_lead event as
      // the other two forms.
      //
      // There used to be a window.open() for an instant download here. It
      // pointed at /media/catalog/Katallogu_2026.pdf, a file that has never
      // existed in any environment, so it only ever opened a 404 — and being
      // after an await, it was outside the user-gesture window and liable to be
      // popup-blocked regardless. The delivery this form actually promises, in
      // all three languages, is the email ("the full catalog was just sent to
      // your email"), which leads/emails.py has been sending all along.
      trackLead({ formName: 'catalog_request', source: 'catalog_modal', lang });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const messages = Object.values(data).flat().join(' ');
        setError(messages || t('catalog_form_error'));
      } else {
        setError(t('catalog_form_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="hero-form-success">
        <h3>{t('catalog_form_success_title')}</h3>
        <p>{t('catalog_form_success_body')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="hero-form" noValidate>
      <p className="hero-form-subtext">{t('catalog_form_subtext')}</p>

      <Honeypot value={form.website} onChange={handleChange} />

      <label className="hero-form-field">
        <span>{t('catalog_form_company')} *</span>
        <input
          name="company_name"
          value={form.company_name}
          onChange={handleChange}
          required
          autoComplete="organization"
        />
      </label>

      <label className="hero-form-field">
        <span>{t('catalog_form_email')} *</span>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />
      </label>

      {error && <p className="hero-form-error">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="hero-form-submit"
      >
        {loading ? t('catalog_form_loading') : t('catalog_form_submit')}
      </button>
    </form>
  );
}
