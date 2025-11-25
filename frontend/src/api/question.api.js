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
   * Create a new question
   * POST /api/questions
   * Body: { content_html, paper_id, co_id?, status?, sequence_number? }
   */
  create: (data) =>
    handle(api.post("/questions", data)),

  /**
   * Get question by ID with full details and media
   * GET /api/questions/:id
   */
  getById: (questionId) =>
    handle(api.get(`/questions/${encodeURIComponent(questionId)}`)),

  /**
   * Update an existing question
   * PUT /api/questions/:id
   * Body: { content_html, paper_id, co_id?, status?, sequence_number? }
   */
  update: (questionId, data) =>
    handle(api.put(`/questions/${encodeURIComponent(questionId)}`, data)),

  /**
   * Delete a question
   * DELETE /api/questions/:id
   */
  delete: (questionId) =>
    handle(api.delete(`/questions/${encodeURIComponent(questionId)}`)),

  /**
   * Get all questions by paper ID
   * GET /api/questions/paper/:paperId
   */
  getByPaper: (paperId) =>
    handle(api.get(`/questions/paper/${encodeURIComponent(paperId)}`)),

  /**
   * Search questions with filters
   * GET /api/questions/search?paper_id=&co_id=&status=&course_id=&page=&limit=
   */
  search: (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    return handle(api.get(`/questions/search?${params.toString()}`));
  },

  /**
   * Update question sequence numbers for a paper
   * PATCH /api/questions/paper/:paperId/sequence
   * Body: { sequence_updates: [{ question_id, sequence_number }] }
   */
  updateSequence: (paperId, sequenceUpdates) =>
    handle(api.patch(`/questions/paper/${encodeURIComponent(paperId)}/sequence`, {
      sequence_updates: sequenceUpdates
    })),

  /**
   * Get upload configuration
   * GET /api/uploads/config
   */
  getUploadConfig: () =>
    handle(api.get("/uploads/config")),

  /**
   * Upload a file for questions
   * POST /api/uploads
   * FormData: { file, question_id?, paper_id? }
   */
  uploadFile: (formData) =>
    handle(api.post("/uploads", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }))
};

export default questionAPI;