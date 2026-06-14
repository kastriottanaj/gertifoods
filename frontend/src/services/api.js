import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          // The backend rotates refresh tokens; keep the new one or the
          // next refresh attempt will use a blacklisted token.
          if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
          }
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch {
          // Session expired: clear tokens and let the auth context reset.
          // No hard redirect — anonymous visitors on public pages should
          // never be yanked to the login screen.
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new Event('auth:session-expired'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
