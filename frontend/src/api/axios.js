// src/api/axios.js
// src/api/axios.js
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

/**
 * axios instance
 */
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor
 * - Reads token from localStorage
 * - Adds Authorization: Bearer <token>
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // OR "access_token" based on your authService
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * - If backend returns 401 → auto-logout
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear storage
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      
      // Redirect to login page with message
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login?message=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
