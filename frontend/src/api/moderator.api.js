import api from "./axios";

const moderatorAPI = {
  /**
   * Get papers for moderation
   * @param {Object} filters - { courseId, status }
   */
  getPapers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.status) params.append('status', filters.status);
    
    const res = await api.get(`/moderation/papers?${params.toString()}`);
    return res.data;
  },

  /**
   * Get paper details with questions for moderation
   * @param {number} paperId 
   */
  getPaperDetails: async (paperId) => {
    const res = await api.get(`/moderation/papers/${paperId}`);
    return res.data;
  },

  /**
   * Start moderating a paper
   * @param {number} paperId 
   */
  startModeration: async (paperId) => {
    const res = await api.post(`/moderation/papers/${paperId}/start`);
    return res.data;
  },

  /**
   * Update individual question status
   * @param {number} questionId 
   * @param {string} status - 'approved' or 'change_requested'
   */
  updateQuestionStatus: async (questionId, status) => {
    const res = await api.patch(`/moderation/questions/${questionId}`, { status });
    return res.data;
  },

  /**
   * Bulk update question statuses
   * @param {Array} updates - [{ question_id, status }]
   */
  bulkUpdateQuestionStatus: async (updates) => {
    const res = await api.patch('/moderation/questions/bulk-status', { updates });
    return res.data;
  },

  /**
   * Submit final moderation report
   * @param {Object} moderationData 
   */
  submitModerationReport: async (moderationData) => {
    const res = await api.post('/moderation/moderations', moderationData);
    return res.data;
  },

  /**
   * Get moderation history for current moderator
   */
  getModerationHistory: async () => {
    const res = await api.get('/moderation/moderations');
    return res.data;
  },

  /**
   * Get questions grouped by CO for moderation report
   * @param {number} paperId 
   */
  getCOBreakdown: async (paperId) => {
    const res = await api.get(`/moderation/papers/${paperId}/co-breakdown`);
    return res.data;
  }
};

export default moderatorAPI;