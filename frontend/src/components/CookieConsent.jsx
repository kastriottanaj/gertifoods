import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const CONSENT_KEY = 'gf_cookie_consent';

const COPY = {
  sq: {
    message: 'Përdorim cookies për analitikë dhe marketing, që të kuptojmë vizitorët dhe të përmirësojmë ofertat tona.',
    learnMore: 'Më shumë',
    learnMoreAria: 'Më shumë rreth cookies dhe impresumit',
    accept: 'Prano',
    reject: 'Refuzo',
  },
  en: {
    message: 'We use cookies for analytics and marketing to understand visitors and improve our offers.',
    learnMore: 'Learn more',
    learnMoreAria: 'Learn more about cookies and our imprint',
    accept: 'Accept',
    reject: 'Decline',
  },
  de: {
    message: 'Wir verwenden Cookies für Analyse und Marketing, um Besucher zu verstehen und unsere Angebote zu verbessern.',
    learnMore: 'Mehr erfahren',
    learnMoreAria: 'Mehr über Cookies und unser Impressum erfahren',
    accept: 'Akzeptieren',
    reject: 'Ablehnen',
  },
};

function updateConsent(granted) {
  const v = granted ? 'granted' : 'denied';
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      ad_storage: v,
      ad_user_data: v,
      ad_personalization: v,
      analytics_storage: v,
    });
  }
  if (typeof window.fbq === 'function') {
    window.fbq('consent', granted ? 'grant' : 'revoke');
  }
}

export default function CookieConsent() {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem(CONSENT_KEY); } catch { return true; }
  });

  const choose = (granted) => {
    try {
      localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
    } catch { /* ignore */ }
    updateConsent(granted);
    setVisible(false);
  };

  if (!visible) return null;
  const c = COPY[lang] || COPY.en;

  return (
    <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <p className="cookie-consent-text">
        {c.message} <Link to="/imprint" className="cookie-consent-link" aria-label={c.learnMoreAria}>{c.learnMore}</Link>
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
