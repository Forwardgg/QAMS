// src/api/paperModeration.api.js
import api from "./axios";

const paperModerationAPI = {
  /**
   * Claim a paper for moderation (moderator)
   * POST /api/paper-moderation/claim/:paperId
   */
  claim: (paperId, data = {}) =>
    api.post(`/paper-moderation/claim/${paperId}`, data).then(res => res.data),

  /**
   * Get all moderation records for a specific paper
   * GET /api/paper-moderation/paper/:paperId
   */
  getByPaper: (paperId) =>
    api.get(`/paper-moderation/paper/${paperId}`).then(res => res.data),

  /**
   * Get moderation records created by the current moderator
   * GET /api/paper-moderation/my
   */
  getMine: () =>
    api.get(`/paper-moderation/my`).then(res => res.data),

  /**
   * Approve moderation
   * PATCH /api/paper-moderation/:id/approve
   */
  approve: (moderationId, data = {}) =>
    api.patch(`/paper-moderation/${moderationId}/approve`, data).then(res => res.data),

  /**
   * Reject moderation
   * PATCH /api/paper-moderation/:id/reject
   */
  reject: (moderationId, data = {}) =>
    api.patch(`/paper-moderation/${moderationId}/reject`, data).then(res => res.data),

  /**
   * Get moderation by ID (only works if backend supports endpoint)
   * GET /api/paper-moderation/:id
   */
  getById: (id) =>
    api.get(`/paper-moderation/${id}`).then(res => res.data),
};

export default paperModerationAPI;
