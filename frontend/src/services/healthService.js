// src/services/healthService.js
import api from "../api/axios";

export const checkHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

export const checkDbTime = async () => {
  const response = await api.get("/test");
  return response.data;
};
