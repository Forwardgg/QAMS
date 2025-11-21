// src/services/authService.js

/**
 * Simple authService for storing and reading auth data from localStorage.
 * Matches axios/other code that expects token stored under "token".
 *
 * Responsibilities:
 * - store / read access token (key: "token")
 * - store / read refresh token (key: "refresh_token") [optional]
 * - store / read user object (key: "user")
 * - clear all auth storage
 * - helper checks (isAuthenticated)
 * - small event helper (emit auth change) so UI can react across tabs/components
 */

const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

// emit a storage-like event so listeners in the same window can react
function emitAuthChange() {
  try {
    // custom event is easier to listen to than storage events in same tab
    window.dispatchEvent(new CustomEvent("auth-change"));
  } catch (e) {
    // ignore
  }
}

const authService = {
  /**********************
   * Token helpers
   **********************/
  /**
   * Persist access token (string). If null/undefined, removes token.
   * @param {string|null} token
   */
  setToken(token) {
    try {
      if (token == null) localStorage.removeItem(TOKEN_KEY);
      else localStorage.setItem(TOKEN_KEY, token);
      emitAuthChange();
    } catch (err) {
      // ignore storage errors
      // console.warn("authService.setToken error", err);
    }
  },

  /**
   * Read access token
   * @returns {string|null}
   */
  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Persist refresh token (optional). If null/undefined, removes it.
   * @param {string|null} token
   */
  setRefreshToken(token) {
    try {
      if (token == null) localStorage.removeItem(REFRESH_TOKEN_KEY);
      else localStorage.setItem(REFRESH_TOKEN_KEY, token);
      emitAuthChange();
    } catch (err) {
      // ignore
    }
  },

  /**
   * Read refresh token
   * @returns {string|null}
   */
  getRefreshToken() {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  /**********************
   * User helpers
   **********************/
  /**
   * Persist user object (will JSON.stringify). If null, removes user.
   * @param {Object|null} user
   */
  setUser(user) {
    try {
      if (user == null) localStorage.removeItem(USER_KEY);
      else localStorage.setItem(USER_KEY, JSON.stringify(user));
      emitAuthChange();
    } catch (err) {
      // ignore
    }
  },

  /**
   * Read stored user object
   * @returns {Object|null}
   */
  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Remove all auth data (tokens + user)
   */
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      emitAuthChange();
    } catch {
      // ignore
    }
  },

  /**
   * Clear but keep user (rarely used)
   */
  clearTokensOnly() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      emitAuthChange();
    } catch {
      // ignore
    }
  },

  /**
   * Is user authenticated (simple check: token exists)
   * @returns {boolean}
   */
  isAuthenticated() {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      return !!t;
    } catch {
      return false;
    }
  },

  /**********************
   * Utilities
   **********************/
  /**
   * Subscribe to auth-change events in this window.
   * Example:
   *   const onAuth = () => { ... }
   *   authService.onChange(onAuth)
   *   authService.offChange(onAuth)
   */
  onChange(cb) {
    window.addEventListener("auth-change", cb);
  },

  offChange(cb) {
    window.removeEventListener("auth-change", cb);
  },

  /**
   * Helper: check if current user has a role
   * @param {string} role - role to check (case-insensitive)
   * @returns {boolean}
   */
  hasRole(role) {
    if (!role) return false;
    const user = authService.getUser();
    if (!user) return false;
    const r = (user.role || "").toLowerCase();
    return r === (role || "").toLowerCase();
  },

  /**
   * Helper: check if user has any role in array
   * @param {string[]} roles
   * @returns {boolean}
   */
  hasAnyRole(roles = []) {
    if (!Array.isArray(roles) || roles.length === 0) return false;
    const user = authService.getUser();
    if (!user) return false;
    const r = (user.role || "").toLowerCase();
    return roles.map((x) => (x || "").toLowerCase()).includes(r);
  },
};

export default authService;
