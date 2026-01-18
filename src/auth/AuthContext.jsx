/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);
const ACCESS_TOKEN_KEY = "access_token";

export function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(
    () => sessionStorage.getItem(ACCESS_TOKEN_KEY) || ""
  );
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const setAccessToken = useCallback((token) => {
    setAccessTokenState(token);
    if (token) sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    else sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }, []);

  const bootstrap = useCallback(async () => {
    setBootstrapping(true);
    try {
      const tokenRes = await authApi.refreshToken();
      setAccessToken(tokenRes.access_token);

      if (tokenRes.user) {
        setUser(tokenRes.user);
      } else {
        const me = await authApi.me(tokenRes.access_token);
        setUser(me);
      }
    } catch {
      setAccessToken("");
      setUser(null);
    } finally {
      setBootstrapping(false);
    }
  }, [setAccessToken]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (email, password) => {
      const tokenRes = await authApi.loginWithEmail(email, password);
      setAccessToken(tokenRes.access_token);
      setUser(tokenRes.user ?? null);
      return tokenRes;
    },
    [setAccessToken]
  );

  const signup = useCallback(
    async (email, password) => {
      const tokenRes = await authApi.signupWithEmail(email, password);
      setAccessToken(tokenRes.access_token);
      setUser(tokenRes.user ?? null);
      return tokenRes;
    },
    [setAccessToken]
  );

  const loginGoogle = useCallback(
    async (id_token) => {
      const tokenRes = await authApi.loginWithGoogleIdToken(id_token);
      setAccessToken(tokenRes.access_token);
      setUser(tokenRes.user ?? null);
      return tokenRes;
    },
    [setAccessToken]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken("");
      setUser(null);
    }
  }, [setAccessToken]);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      bootstrapping,
      isAuthed: !!accessToken,
      refresh: bootstrap,
      login,
      signup,
      loginGoogle,
      logout,
      setAccessToken, // optional; you can remove if you want
      setUser,
    }),
    [accessToken, user, bootstrapping, bootstrap, login, signup, loginGoogle, logout, setAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
