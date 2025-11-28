// frontend/api/questionPaperAPI.js
import api from "./axios";

const questionPaperAPI = {
  /**
   * Create a new question paper (instructor)
   * POST /api/papers
   */
  create: (paperData, config = {}) =>
    api.post("/papers", paperData, config).then(res => res.data),

  /**
   * Get all papers (all authenticated users)
   * GET /api/papers
   * params: { limit, offset, search, courseId, status, ... }
   */
  getAll: (params = {}, config = {}) =>
    api.get("/papers", { params, ...config }).then(res => res.data),

  /**
   * Get papers by course code
   * GET /api/papers/course/:courseCode
   */
  getByCourse: (courseCode, config = {}) =>
    api.get(`/papers/course/${encodeURIComponent(courseCode)}`, config).then(res => res.data),

  /**
   * Get papers by course code and CO number
   * GET /api/papers/course/:courseCode/co/:coNumber
   */
  getByCourseAndCO: (courseCode, coNumber, config = {}) =>
    api.get(`/papers/course/${encodeURIComponent(courseCode)}/co/${encodeURIComponent(coNumber)}`, config)
       .then(res => res.data),

  /**
   * Update a paper (admin, instructor - their own paper)
   * PUT /api/papers/:paperId
   */
  update: (paperId, paperData, config = {}) =>
    api.put(`/papers/${encodeURIComponent(paperId)}`, paperData, config).then(res => res.data),

  /**
   * Delete a paper (admin, instructor - their own paper)
   * DELETE /api/papers/:paperId
   */
  remove: (paperId, config = {}) =>
    api.delete(`/papers/${encodeURIComponent(paperId)}`, config).then(res => res.data),

  /**
   * Submit paper for moderation (instructor - their own paper)
   * POST /api/papers/:paperId/submit-for-moderation
   */
  submitForModeration: (paperId) =>
  api.post(`/papers/${paperId}/submit-for-moderation`, {}) // send empty JSON object
     .then(res => res.data),
};

export default questionPaperAPI;
