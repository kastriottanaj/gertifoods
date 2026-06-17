import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // Send the httpOnly refresh-token cookie on the accounts endpoints (login,
  // refresh, logout). The cookie is path-scoped server-side, so it never
  // travels with product/order requests.
  withCredentials: true,
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
    // Only attempt a refresh if we believe a session exists (an access token is
    // present). The refresh token itself lives in an httpOnly cookie the server
    // reads, so no token is sent in the body.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('access_token')
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/accounts/token/refresh/`,
          {},
          { withCredentials: true },
        );
        localStorage.setItem('access_token', data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch {
        // Session expired: clear the access token and let the auth context
        // reset. No hard redirect — anonymous visitors on public pages should
        // never be yanked to the login screen.
        localStorage.removeItem('access_token');
        window.dispatchEvent(new Event('auth:session-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
