// src/components/AuthProvider.js
import React, { createContext, useCallback, useEffect, useState } from "react";
import authAPI from "../api/auth.api";
import authService from "../services/authService";

/**
 * AuthProvider
 *
 * Provides:
 *  - user: stored user object (or null)
 *  - isAuthenticated: boolean
 *  - isInitializing: boolean while loading stored auth
 *  - login(credentials) -> { ok: true, data } | { ok: false, error }
 *  - logout() -> clears auth (calls backend logout if available)
 *  - refresh() optional helper to refresh profile / tokens
 *
 * Notes:
 *  - This is intentionally lightweight and uses authService (localStorage) as the single source of truth.
 *  - It listens for auth-change events emitted by authService so multiple tabs/components stay in sync.
 */

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  isLoading: false,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getUser());
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!authService.getToken();

  // Keep internal user state synchronized with authService storage.
  useEffect(() => {
  let mounted = true;
  
  // Initialize from localStorage (already done by useState)
  // No profile fetching needed - user is stored during login
  
  // Subscribe to auth-change events (authService emits them)
  const handler = () => {
    setUser(authService.getUser());
  };
  authService.onChange(handler);

  // Mark initialization as complete
  if (mounted) {
    setIsInitializing(false);
  }

  return () => {
    mounted = false;
    authService.offChange(handler);
  };
}, []); // run once on mount

  /**
   * login:
   * - calls authAPI.login(credentials) which is expected to return { token/access_token, refresh_token?, user }
   * - authAPI may save tokens/user in localStorage itself — we still sync via authService
   */
  // In your AuthProvider.js - update the login function:
    // In AuthProvider.js - update the login function:
// In AuthProvider.js - UPDATE the login function to return user immediately
const login = useCallback(async (credentials) => {
  setIsLoading(true);
  try {
    const res = await authAPI.login(credentials);
    const payload = res?.data ?? res;

    // Your backend returns "token" not "access_token"
    const token = payload?.token;
    const refreshToken = payload?.refresh_token;
    const userObj = payload?.user;

    if (token) authService.setToken(token);
    if (refreshToken) authService.setRefreshToken(refreshToken);
    if (userObj) authService.setUser(userObj);

    // Update React state IMMEDIATELY
    setUser(userObj || authService.getUser());
    setIsLoading(false);
    return { ok: true, data: payload };
  } catch (err) {
    setIsLoading(false);
    return { ok: false, error: err };
  }
}, []);

  /**
   * logout:
   * - calls backend logout if present (authAPI.logout), then clears local storage via authService.clear()
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // If authAPI exposes logout endpoint, call it but ignore errors
      if (authAPI.logout) {
        try {
          await authAPI.logout();
        } catch (e) {
          // ignore server logout failure
        }
      }

      authService.clear();
      setUser(null);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      // still clear on error
      authService.clear();
      setUser(null);
    }
  }, []);

  /**
   * refresh:
   * - optional helper to refresh tokens/profile
   * - calls authAPI.refreshToken() then updates stored tokens/user if returned
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!authAPI.refreshToken) {
        setIsLoading(false);
        return { ok: false, error: new Error("refreshToken not implemented on authAPI") };
      }

      const res = await authAPI.refreshToken();
      const payload = res?.data ?? res;
      const token = payload?.access_token ?? payload?.token;
      const refreshToken = payload?.refresh_token;
      const userObj = payload?.user ?? null;

      if (token) authService.setToken(token);
      if (refreshToken) authService.setRefreshToken && authService.setRefreshToken(refreshToken);
      if (userObj) authService.setUser(userObj);

      setUser(authService.getUser());
      setIsLoading(false);
      return { ok: true, data: payload };
    } catch (err) {
      // refresh failed -> clear auth
      authService.clear();
      setUser(null);
      setIsLoading(false);
      return { ok: false, error: err };
    }
  }, []);

  const value = {
    user,
    setUser,
    isAuthenticated,
    isInitializing,
    isLoading,
    login,
    logout,
    refresh,
    hasRole: (role) => authService.hasRole(role),
    hasAnyRole: (roles) => authService.hasAnyRole(roles),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
export { AuthContext };
