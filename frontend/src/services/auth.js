import api from "../api/axios";

export const loginRequest = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  // backend returns: { tokenType, token, user: { id, name, role } }
  return res.data;
};

export const forgotPasswordRequest = async (email) => {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
};

export const saveAuth = ({ token, user }) => {
  if (token) localStorage.setItem("token", token);
  if (user) localStorage.setItem("user", JSON.stringify(user));
};
