// src/api/paperQuestion.api.js
import api from "./axios";

const paperQuestionAPI = {
  /**
   * Add a single question to a paper
   * POST /api/paper-questions/:paperId/:questionId
   */
  addToPaper: (paperId, questionId, data) =>
    api
      .post(`/paper-questions/${paperId}/${questionId}`, data)
      .then((res) => res.data),

  /**
   * Bulk add questions to a paper
   * POST /api/paper-questions/:paperId/bulk
   */
  bulkAddToPaper: (paperId, questions) =>
    api
      .post(`/paper-questions/${paperId}/bulk`, { questions })
      .then((res) => res.data),

  /**
   * Get all questions in a paper
   * GET /api/paper-questions/:paperId
   */
  getByPaper: (paperId) =>
    api.get(`/paper-questions/${paperId}`).then((res) => res.data),

  /**
   * Update a paper-question mapping
   * PUT /api/paper-questions/:pqId
   */
  update: (pqId, data) =>
    api.put(`/paper-questions/${pqId}`, data).then((res) => res.data),

  /**
   * Remove a question from a paper
   * DELETE /api/paper-questions/:pqId
   */
  remove: (pqId) =>
    api.delete(`/paper-questions/${pqId}`).then((res) => res.data),

  /**
   * Reorder all questions in a paper (compact sequence 1..N)
   * PUT /api/paper-questions/:paperId/reorder
   */
  reorder: (paperId) =>
    api.put(`/paper-questions/${paperId}/reorder`).then((res) => res.data),

  /**
   * Get paper-question mapping by ID
   * GET /api/paper-questions/:pqId
   */
  getById: (pqId) =>
    api.get(`/paper-questions/${pqId}`).then((res) => res.data),
};

export default paperQuestionAPI;
