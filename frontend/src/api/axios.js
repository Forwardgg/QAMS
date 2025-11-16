import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // not "authToken"
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor (optional)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token invalid or expired
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // You MAY redirect here, but better to handle in UI
    }
    return Promise.reject(err);
  }
);

export default api;
