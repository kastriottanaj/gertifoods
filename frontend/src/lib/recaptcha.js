const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
let scriptPromise;

function loadRecaptcha() {
  if (!SITE_KEY) return Promise.resolve(null);
  if (window.grecaptcha) return Promise.resolve(window.grecaptcha);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = () => reject(new Error('Unable to load spam protection'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export async function getRecaptchaToken(action) {
  const recaptcha = await loadRecaptcha();
  if (!recaptcha) return '';

  await new Promise((resolve) => recaptcha.ready(resolve));
  return recaptcha.execute(SITE_KEY, { action });
}
