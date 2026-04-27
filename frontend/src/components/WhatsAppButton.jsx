import { useLanguage } from '../i18n/LanguageContext';
import './WhatsAppButton.css';

const PHONE = '38349111150';

export default function WhatsAppButton() {
  const { t } = useLanguage();
  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(t('whatsapp_greeting'))}`;
  const label = t('whatsapp_label');

  return (
    <a
      href={href}
      className="wa-btn"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
    >
      <svg
        className="wa-btn-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M19.05 4.91A9.82 9.82 0 0012.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.33 4.97L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.02zM12.04 20.13h-.01a8.2 8.2 0 01-4.18-1.14l-.3-.18-3.12.82.83-3.04-.19-.31a8.18 8.18 0 01-1.26-4.37c0-4.54 3.7-8.23 8.23-8.23 2.2 0 4.27.86 5.82 2.41a8.17 8.17 0 012.41 5.82c0 4.54-3.69 8.23-8.23 8.23zm4.51-6.16c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.12-.17.25-.64.8-.79.97-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.46-1.37-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.77-1.84-.2-.48-.41-.42-.56-.42-.15-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.43 1.02 2.6.12.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.61.19 1.16.17 1.59.1.49-.07 1.5-.61 1.71-1.21.21-.6.21-1.11.15-1.21-.06-.1-.23-.17-.48-.29z"
        />
      </svg>
      <span className="wa-btn-label">{label}</span>
    </a>
  );
}
