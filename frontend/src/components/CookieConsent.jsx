import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const CONSENT_KEY = 'gf_cookie_consent';

const COPY = {
  sq: {
    message: 'Përdorim cookies për analitikë dhe marketing, që të kuptojmë vizitorët dhe të përmirësojmë ofertat tona.',
    learnMore: 'Më shumë',
    accept: 'Prano',
    reject: 'Refuzo',
  },
  en: {
    message: 'We use cookies for analytics and marketing to understand visitors and improve our offers.',
    learnMore: 'Learn more',
    accept: 'Accept',
    reject: 'Decline',
  },
  de: {
    message: 'Wir verwenden Cookies für Analyse und Marketing, um Besucher zu verstehen und unsere Angebote zu verbessern.',
    learnMore: 'Mehr erfahren',
    accept: 'Akzeptieren',
    reject: 'Ablehnen',
  },
};

function updateConsent(granted) {
  if (typeof window.gtag !== 'function') return;
  const v = granted ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    ad_storage: v,
    ad_user_data: v,
    ad_personalization: v,
    analytics_storage: v,
  });
}

export default function CookieConsent() {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem(CONSENT_KEY); } catch (e) { /* ignore */ }
    if (!saved) setVisible(true);
  }, []);

  const choose = (granted) => {
    try {
      localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
    } catch (e) { /* ignore */ }
    updateConsent(granted);
    setVisible(false);
  };

  if (!visible) return null;
  const c = COPY[lang] || COPY.en;

  return (
    <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <p className="cookie-consent-text">
        {c.message} <Link to="/imprint" className="cookie-consent-link">{c.learnMore}</Link>
      </p>
      <div className="cookie-consent-actions">
        <button type="button" className="cookie-btn cookie-btn-reject" onClick={() => choose(false)}>
          {c.reject}
        </button>
        <button type="button" className="cookie-btn cookie-btn-accept" onClick={() => choose(true)}>
          {c.accept}
        </button>
      </div>
    </div>
  );
}
