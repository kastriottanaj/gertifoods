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
      // trackLead, not completeLead: this form's payoff is the catalog PDF it
      // opens on the next line, and redirecting the tab to the thank-you page
      // would pull the visitor away from the download they just asked for. GA4
      // still gets the same generate_lead event as the other two forms.
      trackLead({ formName: 'catalog_request', source: 'catalog_modal', lang });
      window.open(`${import.meta.env.VITE_API_URL}/media/catalog/Katallogu_2026.pdf`, '_blank');
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
