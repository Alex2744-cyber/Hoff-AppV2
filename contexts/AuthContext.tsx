import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, {
  User,
  setUnauthorizedHandler,
  setStoredAuthToken,
  getStoredAuthToken,
  clearAuthSession,
  AUTH_TOKEN_KEY,
} from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (usuario: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  /** Actualiza usuario en memoria y AsyncStorage (p. ej. tras guardar perfil). */
  applySessionUser: (u: User) => Promise<void>;
  /** Recarga perfil desde GET /auth/me. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await getStoredAuthToken();
      if (userData && token) {
        setUser(JSON.parse(userData));
      } else {
        if (userData || token) {
          await AsyncStorage.multiRemove(['user', AUTH_TOKEN_KEY]);
        }
        setUser(null);
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (usuario: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await api.login(usuario, password);

      if (result.success && result.user && result.token) {
        await setStoredAuthToken(result.token);
        setUser(result.user);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    await clearAuthSession();
  };

  const applySessionUser = useCallback(async (u: User) => {
    setUser(u);
    await AsyncStorage.setItem('user', JSON.stringify(u));
  }, []);

  const refreshUser = useCallback(async () => {
    const token = await getStoredAuthToken();
    if (!token) return;
    try {
      const res = await api.getAuthMe();
      if (res.success && res.data) {
        await applySessionUser(res.data);
      }
    } catch {
      /* silencioso; 401 ya limpia sesión vía apiRequest */
    }
  }, [applySessionUser]);

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    applySessionUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
