// src/api/question.api.js
import api from "./axios";

/**
 * Helper to unwrap axios responses safely.
 * Returns res.data on success.
 * Throws a normalized Error(message) on failure for easier UI handling.
 */
async function handle(promise) {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    if (err.response && err.response.data) {
      const data = err.response.data;
      const msg = data.message ?? data.error ?? JSON.stringify(data);
      throw new Error(msg);
    }
    throw err;
  }
}

const questionAPI = {
  /**
   * Get all questions by course code
   * GET /api/questions/course/:courseCode
   */
  getByCourseCode: (courseCode) =>
    handle(api.get(`/questions/course/${encodeURIComponent(courseCode)}`)),

  /**
   * Get all questions by course code and paper
   * GET /api/questions/course/:courseCode/paper/:paperId
   */
  getByCourseAndPaper: (courseCode, paperId) =>
    handle(
      api.get(
        `/questions/course/${encodeURIComponent(courseCode)}/paper/${encodeURIComponent(paperId)}`
      )
    ),

  /**
   * Get single question by ID with full details
   * GET /api/questions/:questionId
   */
  getById: (questionId) =>
    handle(api.get(`/questions/${encodeURIComponent(questionId)}`)),

  /**
   * Create subjective question (instructor only)
   * POST /api/questions/subjective
   * Body: { courseId, paperId, content, coId? }
   */
  createSubjective: (data) =>
    handle(api.post("/questions/subjective", data)),

  /**
   * Create objective question (instructor only)
   * POST /api/questions/objective
   * Body: { courseId, paperId, content, coId?, options: [{ optionText, isCorrect }] }
   */
  createObjective: (data) =>
    handle(api.post("/questions/objective", data)),

  /**
   * Update question (instructor for own papers or admin)
   * PUT /api/questions/:questionId
   * Body: { content?, coId?, question_type?, options? }
   */
  update: (questionId, data) =>
    handle(api.put(`/questions/${encodeURIComponent(questionId)}`, data)),

  /**
   * Delete question (instructor for own papers or admin)
   * DELETE /api/questions/:questionId
   */
  delete: (questionId) =>
    handle(api.delete(`/questions/${encodeURIComponent(questionId)}`)),
};

export default questionAPI;
