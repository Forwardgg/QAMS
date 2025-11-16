// src/api/auth.api.js
import api from "./axios";

/**
 * Stores auth data in localStorage
 */
const saveAuth = (token, user) => {
  if (token) localStorage.setItem("token", token);
  if (user) localStorage.setItem("user", JSON.stringify(user));
};

/**
 * Removes auth data
 */
const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * --- AUTH API ---
 */
const authAPI = {
  /**
   * Register user
   * Backend: POST /api/auth/register
   */
  register: async (data) => {
    const res = await api.post("/auth/register", data);

    // backend returns: { tokenType, token, user }
    if (res.data.token) saveAuth(res.data.token, res.data.user);

    return res.data;
  },

  /**
   * Login user
   * Backend: POST /api/auth/login
   */
  login: async ({ email, password }) => {
    const res = await api.post("/auth/login", { email, password });

    if (res.data.token) saveAuth(res.data.token, res.data.user);

    return res.data;
  },

  /**
   * Forgot password
   * Backend: POST /api/auth/forgot-password
   */
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),

  /**
   * Reset password
   * Backend: POST /api/auth/reset-password
   */
  resetPassword: (data) => api.post("/auth/reset-password", data),

  /**
   * Soft delete user (admin only)
   * Backend: DELETE /api/auth/users/:id
   */
  deleteUser: (id) => api.delete(`/auth/users/${id}`),

  /**
   * Force delete user (admin only)
   * Backend: DELETE /api/auth/users/:id/force
   */
  forceDeleteUser: (id) => api.delete(`/auth/users/${id}/force`),

  /**
   * Logout (frontend only)
   */
  logout: () => {
    clearAuth();
    // do NOT redirect here — leave control to caller
  },

  /**
   * Helpers
   */
  getToken: () => localStorage.getItem("token"),

  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  hasRole: (role) => {
    const user = authAPI.getCurrentUser();
    return user?.role === role;
  },

  /**
   * Utility (optional)
   */
  healthCheck: () => api.get("/health"),
  testDB: () => api.get("/test"),
};

export default authAPI;
