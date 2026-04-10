import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import SEO from '../components/SEO';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  return (
    <div className="profile-page">
      <SEO title={t('profile_title')} description={t('profile_meta')} />
      <h1>{t('profile_title')}</h1>
      <div className="profile-card">
        <div className="profile-field">
          <label>{t('profile_company')}</label>
          <p>{user.company_name || '-'}</p>
        </div>
        <div className="profile-field">
          <label>{t('profile_username')}</label>
          <p>{user.username}</p>
        </div>
        <div className="profile-field">
          <label>{t('profile_email')}</label>
          <p>{user.email}</p>
        </div>
        <div className="profile-field">
          <label>{t('profile_phone')}</label>
          <p>{user.phone || '-'}</p>
        </div>
        <div className="profile-field">
          <label>{t('profile_address')}</label>
          <p>{user.address || '-'}</p>
        </div>
        <div className="profile-field">
          <label>{t('profile_city')}</label>
          <p>{user.city || '-'}</p>
        </div>
        <div className="profile-field">
          <label>{t('profile_country')}</label>
          <p>{user.country}</p>
        </div>
        <div className="profile-field">
          <label>{t('profile_status')}</label>
          <p className={user.is_approved ? 'status-approved' : 'status-pending-text'}>
            {user.is_approved ? t('profile_approved') : t('profile_pending')}
          </p>
        </div>
      </div>
    </div>
  );
}
