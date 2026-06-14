import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';

export default function Register() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '',
    company_name: '', business_id: '', phone: '', address: '', city: '', country: 'Kosovo',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.values(data).flat().join(' ');
        setError(messages);
      } else {
        setError(t('register_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <SEO title={t('register_title')} description={t('register_meta')} />
      <div className="auth-card auth-card-wide">
        <h1>{t('register_title')}</h1>
        <p className="auth-subtitle">{t('register_subtitle')}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>{t('register_username')} *</label>
              <input name="username" value={form.username} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>{t('register_email')} *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('register_password')} *</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('register_company')} *</label>
              <input name="company_name" value={form.company_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>{t('register_business_id')} *</label>
              <input name="business_id" value={form.business_id} onChange={handleChange} required placeholder={t('register_business_id_placeholder')} />
            </div>
          </div>
          <div className="form-group">
            <label>{t('register_phone')}</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('register_address')}</label>
            <input name="address" value={form.address} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('register_city')}</label>
              <input name="city" value={form.city} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>{t('register_country')}</label>
              <input name="country" value={form.country} onChange={handleChange} />
            </div>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary btn-full">
            {loading ? t('register_loading') : t('register_submit')}
          </button>
        </form>
        <p className="auth-link">
          {t('register_has_account')} <Link to="/login">{t('register_login_link')}</Link>
        </p>
      </div>
    </div>
  );
}
