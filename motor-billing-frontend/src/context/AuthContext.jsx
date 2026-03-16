import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Support both the new 'authUser' key and the old 'mockUser' key for backward compat
    const storedUser =
      localStorage.getItem('authUser') ||
      localStorage.getItem('mockUser');

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Migrate old key to new key
        if (!localStorage.getItem('authUser')) {
          localStorage.setItem('authUser', storedUser);
          localStorage.removeItem('mockUser');
        }
      } catch {
        localStorage.removeItem('authUser');
        localStorage.removeItem('mockUser');
      }
    }
    setLoading(false);
  }, []);

  // Real login using backend API (import api lazily to avoid circular dependency)
  const login = async (email, password) => {
    const { default: api } = await import('../services/api');
    const res = await api.post('/auth/login', { email, password });
    const { token, role, name } = res.data;
    const userData = {
      name: name || (role === 'admin' ? 'Admin User' : 'Staff Member'),
      role,
      email,
    };
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  // Quick demo login — no backend call needed
  const mockLogin = (role) => {
    const userData = {
      role,
      name: role === 'admin' ? 'Admin User' : 'Staff Member',
    };
    setUser(userData);
    localStorage.setItem('authUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('mockUser');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, mockLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
