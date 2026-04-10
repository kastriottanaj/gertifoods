import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.username, form.password);
      navigate('/products');
    } catch {
      setError(t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <SEO title={t('login_title')} description={t('login_meta')} />
      <div className="auth-card">
        <h1>{t('login_title')}</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('login_username')}</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>{t('login_password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary btn-full">
            {loading ? t('login_loading') : t('login_submit')}
          </button>
        </form>
        <p className="auth-link">
          {t('login_no_account')} <Link to="/register">{t('login_register_link')}</Link>
        </p>
      </div>
    </div>
  );
}
