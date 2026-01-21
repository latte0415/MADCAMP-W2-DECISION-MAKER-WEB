import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/api';
import { getUser, setUser, logout as authLogout, isAuthenticated } from '../utils/auth';
import type { User } from '../utils/auth';

export function useAuth() {
  const [user, setUserState] = useState<User | null>(getUser());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await apiClient.get<User>('/auth/me');
        setUser(currentUser);
        setUserState(currentUser);
      } catch (error) {
        authLogout();
        setUserState(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setUserState(userData);
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // 에러가 나도 로그아웃 처리
    } finally {
      authLogout();
      setUserState(null);
      navigate('/login');
    }
  };

  return {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    login,
    logout,
  };
}
