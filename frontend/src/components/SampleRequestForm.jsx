import { useState } from 'react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

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
};

export default function SampleRequestForm({ source = 'other', onSuccess }) {
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
      await api.post('/leads/sample-request/', { ...form, source });
      setSuccess(true);
      if (onSuccess) onSuccess();
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
      <h2>{t('sample_form_title')}</h2>
      <p className="sample-form-subtitle">{t('sample_form_subtitle')}</p>

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
