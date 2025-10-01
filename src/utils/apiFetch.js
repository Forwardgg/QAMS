// src/utils/apiFetch.js
import jwtDecode from "jwt-decode";

const redirectToLogin = () => {
  try { sessionStorage.clear(); } catch(e) {}
  // use location.assign to preserve browser history behaviour
  window.location.assign("/auth");
};

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
};

/**
 * apiFetch(url, options)
 * - url: can be relative ("/api/logs") or absolute ("http://localhost:5000/api/logs")
 * - options: fetch options (method, body, headers, ...)
 */
export default async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem("token");
  if (!token || isTokenExpired(token)) {
    redirectToLogin();
    return; // exit early
  }

  const defaultHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...defaultHeaders,
    },
  };

  let res;
  try {
    res = await fetch(url, fetchOptions);
  } catch (err) {
    // network error
    console.error("Network error in apiFetch:", err);
    throw err;
  }

  // If unauthorized or forbidden: force logout and redirect
  if (res.status === 401 || res.status === 403) {
    redirectToLogin();
    return;
  }

  // attempt to parse response as JSON, fallback to text
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}
