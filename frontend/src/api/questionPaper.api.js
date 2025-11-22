// src/api/questionPaper.api.js
import api from "./axios";

const questionPaperAPI = {
  /**
   * Create a new question paper (instructor)
   * POST /api/papers
   */
  create: (paperData) =>
    api.post("/papers", paperData).then(res => res.data),

  /**
   * Get all papers (all authenticated users)
   * GET /api/papers
   */
  getAll: (params = {}) =>
    api.get("/papers", { params }).then(res => res.data),

  /**
   * Get papers by course code (all authenticated users)
   * GET /api/papers/course/:courseCode
   */
  getByCourse: (courseCode) =>
    api.get(`/papers/course/${courseCode}`).then(res => res.data),

  /**
   * Get papers by course code and CO number (all authenticated users)
   * GET /api/papers/course/:courseCode/co/:coNumber
   */
  getByCourseAndCO: (courseCode, coNumber) =>
    api.get(`/papers/course/${courseCode}/co/${coNumber}`).then(res => res.data),

  /**
   * Update a paper (admin, instructor - their own paper)
   * PUT /api/papers/:paperId
   */
  update: (paperId, paperData) =>
    api.put(`/papers/${paperId}`, paperData).then(res => res.data),

  /**
   * Delete a paper (admin, instructor - their own paper)
   * DELETE /api/papers/:paperId
   */
  delete: (paperId) =>
    api.delete(`/papers/${paperId}`).then(res => res.data),
};

export default questionPaperAPI;