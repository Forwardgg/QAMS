// src/api/auth.api.js
import api from "./axios";
import authService from "../services/authService";

const authAPI = {
  /**
   * Register user
   */
  register: async (data) => {
    const res = await api.post("/auth/register", data);
    const payload = res.data || {};

    // Your backend returns "token" (not "access_token")
    if (payload.token) {
      authService.setToken(payload.token);
      if (payload.user) {
        authService.setUser(payload.user);
      }
    }

    return payload;
  },

  /**
   * Login user
   */
  login: async ({ email, password }) => {
    const res = await api.post("/auth/login", { email, password });
    const payload = res.data || {};

    // Your backend returns "token"
    if (payload.token) {
      authService.setToken(payload.token);
      if (payload.user) {
        authService.setUser(payload.user);
      }
    }

    return payload;
  },

  /**
   * Get profile - REMOVE OR IMPLEMENT IN BACKEND
   */
  getProfile: async () => {
    try {
      const res = await api.get("/auth/profile");
      const user = res.data;
      if (user) authService.setUser(user);
      return user;
    } catch (error) {
      // Endpoint doesn't exist - return current user from storage
      return authService.getUser();
    }
  },

  /**
   * Forgot password
   */
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),

  /**
   * Reset password
   */
  resetPassword: (data) => api.post("/auth/reset-password", data),

  /**
   * Logout - SIMPLIFIED (backend endpoint doesn't exist)
   */
  logout: async () => {
    authService.clear(); // Just clear local storage
    return { message: "Logged out" };
  },

  // Remove refreshToken for now since backend doesn't support it
  // refreshToken: async () => { ... }
};

export default authAPI;