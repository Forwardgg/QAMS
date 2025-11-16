// src/api/log.api.js
import api from "./axios";

const logAPI = {
  /**
   * Get all logs (admin)
   * GET /api/logs
   * @param {Object} params - { limit?: number, page?: number, action?: string, role?: string, ... }
   */
  getAll: (params = {}) =>
    api.get("/logs", { params }).then(res => res.data),

  /**
   * Get logs for a specific user (admin)
   * GET /api/logs/user/:id
   */
  getByUser: (userId, params = {}) =>
    api.get(`/logs/user/${userId}`, { params }).then(res => res.data),

  /**
   * Delete a log entry (admin)
   * DELETE /api/logs/:logId
   */
  delete: (logId) =>
    api.delete(`/logs/${logId}`).then(res => res.data),

  /**
   * (Optional) Server-side filtering if you add support later
   * GET /api/logs/filter?role=&action=&startDate=&endDate=...
   */
  filter: (filters = {}) =>
    api.get("/logs/filter", { params: filters }).then(res => res.data),
};

export default logAPI;
