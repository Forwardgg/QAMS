// src/api/user.api.js
import api from "./axios";

const userAPI = {
  /**
   * Create a new user (admin)
   * POST /api/users
   */
  create: (userData) =>
    api.post("/users", userData).then(res => res.data),

  /**
   * Get all users (admin)
   * GET /api/users
   */
  getAll: () =>
    api.get("/users").then(res => res.data),

  /**
   * Get total user count (admin)
   * GET /api/users/stats/total
   */
  getTotal: () =>
    api.get("/users/stats/total").then(res => res.data),

  /**
   * Get user counts by role (admin)
   * GET /api/users/stats/roles
   */
  getCountsByRole: () =>
    api.get("/users/stats/roles").then(res => res.data),

  /**
   * Get total instructors count (admin)
   * GET /api/users/stats/instructors
   */
  getTotalInstructors: () =>
    api.get("/users/stats/instructors").then(res => res.data),

  /**
   * Deactivate a user (admin)
   * PATCH /api/users/:id/deactivate
   */
  deactivate: (userId) =>
    api.patch(`/users/${userId}/deactivate`).then(res => res.data),

  /**
   * Activate a user (admin)
   * PATCH /api/users/:id/activate
   */
  activate: (userId) =>
    api.patch(`/users/${userId}/activate`).then(res => res.data),

  /**
   * Update user profile (admin)
   * PUT /api/users/:id
   */
  update: (userId, userData) =>
    api.put(`/users/${userId}`, userData).then(res => res.data),

  /**
   * Update user password (admin)
   * PATCH /api/users/:id/password
   */
  updatePassword: (userId, passwordData) =>
    api.patch(`/users/${userId}/password`, passwordData).then(res => res.data),

  /**
   * Update current user's password (self)
   * PATCH /api/users/me/password
   */
  updateMyPassword: (passwordData) =>
    api.patch("/users/me/password", passwordData).then(res => res.data),

  /**
   * Get user by ID (requires backend endpoint)
   * GET /api/users/:id
   */
  getById: (userId) =>
    api.get(`/users/${userId}`).then(res => res.data),
};

export default userAPI;
