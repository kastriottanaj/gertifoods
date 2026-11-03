import axios from 'axios';

// Production serves Django behind the same origin at `/api`. Keeping the
// fallback relative is important: a production build without VITE_API_URL
// must never send a visitor's form to localhost (or be blocked as mixed
// content on HTTPS). Local development can still override this in .env.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Only the lead forms post through this, all anonymously: the site has had
// no customer accounts since 2026-11-03, so there is no token to attach and
// no cookie to send.
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
