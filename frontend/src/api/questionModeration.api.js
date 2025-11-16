// src/api/questionModeration.api.js
import api from "./axios";

const questionModerationAPI = {
  /**
   * Claim a specific question for moderation
   * POST /api/question-moderation/claim/:paperId/:questionId
   */
  claim: (paperId, questionId, data = {}) =>
    api.post(`/question-moderation/claim/${paperId}/${questionId}`, data).then(res => res.data),

  /**
   * Get all moderation records for a specific paper
   * GET /api/question-moderation/paper/:paperId
   */
  getByPaper: (paperId) =>
    api.get(`/question-moderation/paper/${paperId}`).then(res => res.data),

  /**
   * Get all moderation records for a specific question
   * GET /api/question-moderation/question/:questionId
   */
  getByQuestion: (questionId) =>
    api.get(`/question-moderation/question/${questionId}`).then(res => res.data),

  /**
   * Get all moderations claimed by the current moderator
   * GET /api/question-moderation/my
   */
  getMine: () =>
    api.get(`/question-moderation/my`).then(res => res.data),

  /**
   * Approve moderation
   * PATCH /api/question-moderation/:id/approve
   */
  approve: (moderationId, data = {}) =>
    api.patch(`/question-moderation/${moderationId}/approve`, data).then(res => res.data),

  /**
   * Reject moderation
   * PATCH /api/question-moderation/:id/reject
   */
  reject: (moderationId, data = {}) =>
    api.patch(`/question-moderation/${moderationId}/reject`, data).then(res => res.data),

  /**
   * Get moderation record by ID
   * GET /api/question-moderation/:id
   */
  getById: (moderationId) =>
    api.get(`/question-moderation/${moderationId}`).then(res => res.data),
};

export default questionModerationAPI;
