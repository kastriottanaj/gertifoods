import { useState } from 'react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const INITIAL_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  message: '',
};

export default function HeroLeadForm({ source = 'home_hero' }) {
  const { t } = useLanguage();
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
      await api.post('/leads/lead/', { ...form, source });
      setSuccess(true);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const messages = Object.values(data).flat().join(' ');
        setError(messages || t('hero_form_error'));
      } else {
        setError(t('hero_form_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="hero-form-success">
        <h3>{t('hero_form_success_title')}</h3>
        <p>{t('hero_form_success_body')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="hero-form" noValidate>
      <h2 className="hero-form-headline">{t('hero_form_headline')}</h2>
      <p className="hero-form-subtext">{t('hero_form_subtext')}</p>

      <div className="hero-form-row">
        <label className="hero-form-field">
          <span>{t('hero_form_first_name')} *</span>
          <input
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            required
            autoComplete="given-name"
          />
        </label>
        <label className="hero-form-field">
          <span>{t('hero_form_last_name')} *</span>
          <input
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            required
            autoComplete="family-name"
          />
        </label>
      </div>

      <label className="hero-form-field">
        <span>{t('hero_form_email')} *</span>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />
      </label>

      <label className="hero-form-field">
        <span>{t('hero_form_phone')} *</span>
        <input
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          required
          autoComplete="tel"
        />
      </label>

      <label className="hero-form-field">
        <span>{t('hero_form_message')}</span>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={2}
        />
      </label>

      {error && <p className="hero-form-error">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="hero-form-submit"
      >
        {loading ? t('hero_form_loading') : t('hero_form_submit')}
      </button>
    </form>
  );
}
