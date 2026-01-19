/* eslint-disable react-refresh/only-export-components */
import React, { useRef, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth";
import { setAccessToken as setAccessTokenStore, clearAccessToken as clearAccessTokenStore } from "./tokenStore";

const AuthContext = createContext(null);
const ACCESS_TOKEN_KEY = "access_token";

export function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(
    () => sessionStorage.getItem(ACCESS_TOKEN_KEY) || ""
  );
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const setAccessToken = useCallback((token) => {
    const t = token || "";
    setAccessTokenState(t);

    if (t) {
      setAccessTokenStore(t);
      sessionStorage.setItem(ACCESS_TOKEN_KEY, t);
    } else {
      clearAccessTokenStore();
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  }, []);

  const refreshInFlight = useRef(null);

  const bootstrap = useCallback(async () => {
    if (refreshInFlight.current) return refreshInFlight.current;

    refreshInFlight.current = (async () => {
      setBootstrapping(true);
      try {
        const tokenRes = await authApi.refreshToken();
        setAccessToken(tokenRes.access_token);

        if (tokenRes.user) setUser(tokenRes.user);
        else setUser(await authApi.me());
      } catch {
        setAccessToken("");
        setUser(null);
      } finally {
        setBootstrapping(false);
        refreshInFlight.current = null;
      }
    })();

    return refreshInFlight.current;
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

  const refresh = useCallback(
    async () => {
      const tokenRes = await authApi.refreshToken();
      setAccessToken(tokenRes.access_token);
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
  
  const requestPasswordReset = useCallback(async (email) => {
    // does not change auth state; just forwards backend message
    return authApi.requestPasswordReset(email);
  }, []);

  const confirmPasswordReset = useCallback(async (token, new_password) => {
    return authApi.confirmPasswordReset(token, new_password);
  }, []);

  const setName = useCallback(
    async (name) => {
      if (!accessToken) throw new Error("Not authenticated");

      // Update name
      await authApi.updateMyName(name);

      // Refresh user so user.name is no longer null
      const meRes = await authApi.me(accessToken);
      setUser(meRes);

      return meRes;
    },
    [accessToken] 
  );


  const value = useMemo(
    () => ({
      accessToken,
      user,
      bootstrapping,
      isAuthed: !!accessToken,
      needsName: !!accessToken && user?.name === null,
      refresh,
      login,
      signup,
      loginGoogle,
      logout,
      setAccessToken,
      requestPasswordReset,
      confirmPasswordReset,
      setName,
      setUser,
    }),
    [accessToken, user, bootstrapping, login, refresh, signup, loginGoogle, logout, setAccessToken, setName, requestPasswordReset, confirmPasswordReset]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
