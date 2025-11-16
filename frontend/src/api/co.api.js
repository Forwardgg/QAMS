// src/api/co.api.js
import api from "./axios"; // uses your existing axios client with token interceptor

const coAPI = {
  /**
   * Create a new Course Outcome
   * POST /api/cos/course/:courseId
   */
  create: (courseId, coData) =>
    api.post(`/cos/course/${courseId}`, coData).then(res => res.data),

  /**
   * Get all COs for a specific course
   * GET /api/cos/by-course/:courseId
   */
  getByCourse: (courseId) =>
    api.get(`/cos/by-course/${courseId}`).then(res => res.data),

  /**
   * Get all courses with their COs
   * GET /api/cos
   */
  getAll: () =>
    api.get(`/cos`).then(res => res.data),

  /**
   * Update an existing Course Outcome
   * PUT /api/cos/outcome/:coId
   */
  update: (coId, coData) =>
    api.put(`/cos/outcome/${coId}`, coData).then(res => res.data),

  /**
   * Delete a CO
   * DELETE /api/cos/outcome/:coId
   */
  delete: (coId) =>
    api.delete(`/cos/outcome/${coId}`).then(res => res.data),

  /**
   * Get a CO by ID
   * GET /api/cos/outcome/:coId
   */
  getById: (coId) =>
    api.get(`/cos/outcome/${coId}`).then(res => res.data),
};

export default coAPI;
