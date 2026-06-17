import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/accounts/profile/')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const onSessionExpired = () => setUser(null);
    window.addEventListener('auth:session-expired', onSessionExpired);
    return () => window.removeEventListener('auth:session-expired', onSessionExpired);
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/accounts/login/', { username, password });
    // Only the short-lived access token is stored in JS; the refresh token is
    // set by the server as an httpOnly cookie.
    localStorage.setItem('access_token', data.access);
    const profile = await api.get('/accounts/profile/');
    setUser(profile.data);
    return profile.data;
  };

  const logout = async () => {
    // Revoke the refresh-token cookie server-side; ignore failures (e.g. token
    // already expired) — local logout proceeds regardless.
    try {
      await api.post('/accounts/logout/');
    } catch {
      // no-op
    }
    localStorage.removeItem('access_token');
    // Clear any stale refresh token left by the pre-cookie implementation.
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const register = async (formData) => {
    await api.post('/accounts/register/', formData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
