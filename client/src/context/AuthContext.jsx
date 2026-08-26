import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';

const AuthContext = createContext(null);

const DEFAULT_DEMO_USER = {
  id: 'USR_001',
  username: 'admin',
  full_name: 'Chief Inspector Arthur Pendelton',
  role: 'Administrator',
  role_id: 'ROLE_ADMIN',
  email: 'admin@mineguard.ai',
  badge_id: 'BADGE-ADM-01'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mineguard_user');
    return saved ? JSON.parse(saved) : DEFAULT_DEMO_USER;
  });

  const [token, setToken] = useState(() => localStorage.getItem('mineguard_token') || 'demo_token');
  const [loading, setLoading] = useState(false);

  const login = async (username, password, role) => {
    setLoading(true);
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, role })
      });

      if (res.success && res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('mineguard_user', JSON.stringify(res.user));
        localStorage.setItem('mineguard_token', res.token);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (targetRole) => {
    return login(null, null, targetRole);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mineguard_user');
    localStorage.removeItem('mineguard_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
