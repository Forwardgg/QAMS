// src/api/question.api.js
import api from "./axios";

const questionAPI = {
  /**
   * Add a subjective question to a course
   * POST /api/questions/subjective/:courseId
   */
  addSubjective: (courseId, data) =>
    api.post(`/questions/subjective/${courseId}`, data).then(res => res.data),

  /**
   * Add an MCQ question to a course
   * POST /api/questions/mcq/:courseId
   */
  addMCQ: (courseId, data) =>
    api.post(`/questions/mcq/${courseId}`, data).then(res => res.data),

  /**
   * Get questions for a paper
   * GET /api/questions/paper/:paperId
   */
  getByPaper: (paperId) =>
    api.get(`/questions/paper/${paperId}`).then(res => res.data),

  /**
   * Get all questions for a course
   * GET /api/questions/course/:courseId
   */
  getByCourse: (courseId) =>
    api.get(`/questions/course/${courseId}`).then(res => res.data),

  /**
   * Get questions for a specific paper AND course
   * GET /api/questions/course/:courseId/paper/:paperId
   */
  getByCourseAndPaper: (courseId, paperId) =>
    api.get(`/questions/course/${courseId}/paper/${paperId}`).then(res => res.data),

  /**
   * Update a question
   * PUT /api/questions/:questionId
   */
  update: (questionId, data) =>
    api.put(`/questions/${questionId}`, data).then(res => res.data),

  /**
   * Soft delete a question
   * DELETE /api/questions/:questionId
   */
  delete: (questionId) =>
    api.delete(`/questions/${questionId}`).then(res => res.data),

  /**
   * Get question by ID - ONLY IF BACKEND SUPPORTS IT
   * GET /api/questions/:questionId
   */
  getById: (questionId) =>
    api.get(`/questions/${questionId}`).then(res => res.data),
};

export default questionAPI;
