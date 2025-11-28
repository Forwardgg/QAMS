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
  create: (data, config = {}) =>
    handle(api.post("/questions", data, config)),

  getById: (questionId, config = {}) =>
    handle(api.get(`/questions/${encodeURIComponent(questionId)}`, config)),

  update: (questionId, data, config = {}) =>
    handle(api.put(`/questions/${encodeURIComponent(questionId)}`, data, config)),

  delete: (questionId, config = {}) =>
    handle(api.delete(`/questions/${encodeURIComponent(questionId)}`, config)),

  getByPaper: (paperId, config = {}) =>
    handle(api.get(`/questions/paper/${encodeURIComponent(paperId)}`, config)),

  /**
   * Search questions. `filters` is an object (paper_id, co_id, status, course_id, page, limit)
   * We pass through only non-empty values using axios `params`.
   */
  search: (filters = {}, config = {}) => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params[k] = v;
    });
    return handle(api.get("/questions/search", { params, ...config }));
  },

  updateSequence: (paperId, sequenceUpdates, config = {}) =>
    handle(api.patch(`/questions/paper/${encodeURIComponent(paperId)}/sequence`, {
      sequence_updates: sequenceUpdates
    }, config)),

  getUploadConfig: (config = {}) =>
    handle(api.get("/uploads/config", config)),

  uploadFile: (formData, config = {}) =>
    // DO NOT set Content-Type manually; axios/browser will set the boundary.
    handle(api.post("/uploads", formData, { ...config }))
};

export default questionAPI;
