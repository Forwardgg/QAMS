// src/api/questionPaper.api.js
import api from "./axios";

const questionPaperAPI = {
  /**
   * Create a new question paper
   * POST /api/papers
   */
  create: (paperData) =>
    api.post("/papers", paperData).then(res => res.data),

  /**
   * Get all papers (role-based access)
   * GET /api/papers
   */
  getAll: () =>
    api.get("/papers").then(res => res.data),

  /**
   * Get paper by ID
   * GET /api/papers/:paperId
   */
  getById: (paperId) =>
    api.get(`/papers/${paperId}`).then(res => res.data),

  /**
   * Update a paper
   * PUT /api/papers/:paperId
   */
  update: (paperId, paperData) =>
    api.put(`/papers/${paperId}`, paperData).then(res => res.data),

  /**
   * Delete a paper
   * DELETE /api/papers/:paperId
   */
  delete: (paperId) =>
    api.delete(`/papers/${paperId}`).then(res => res.data),

  /**
   * Submit paper for moderation
   * POST /api/papers/:paperId/submit
   */
  submit: (paperId) =>
    api.post(`/papers/${paperId}/submit`).then(res => res.data),

  /**
   * Approve a paper (admin/moderator)
   * POST /api/papers/:paperId/approve
   */
  approve: (paperId) =>
    api.post(`/papers/${paperId}/approve`).then(res => res.data),

  /**
   * Reject a paper (admin/moderator)
   * POST /api/papers/:paperId/reject
   */
  reject: (paperId) =>
    api.post(`/papers/${paperId}/reject`).then(res => res.data),
};

export default questionPaperAPI;
