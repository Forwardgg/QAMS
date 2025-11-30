// src/api/moderatorAPI.js - UPDATED VERSION
import api from "./axios";
import pdfAPI from "./pdf.api";

const moderatorAPI = {
  getPapers: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.status) params.append('status', filters.status);
      const res = await api.get(`/moderation/papers?${params.toString()}`);
      return res.data;
    } catch (error) {
      console.error('API Error in getPapers:', error);
      throw error;
    }
  },

  getPaperDetails: async (paperId) => {
    try {
      const res = await api.get(`/moderation/papers/${paperId}`);
      return res.data;
    } catch (error) {
      console.error('API Error in getPaperDetails:', error);
      throw error;
    }
  },

  startModeration: async (paperId) => {
    try {
      const res = await api.post(`/moderation/papers/${paperId}/start`);
      return res.data;
    } catch (error) {
      console.error('API Error in startModeration:', error);
      throw error;
    }
  },

  updateQuestionStatus: async (questionId, status) => {
    try {
      const res = await api.patch(`/moderation/questions/${questionId}`, { status });
      return res.data;
    } catch (error) {
      console.error('API Error in updateQuestionStatus:', error);
      throw error;
    }
  },

  bulkUpdateQuestionStatus: async (updates) => {
    try {
      const res = await api.patch(`/moderation/questions/bulk-status`, { updates });
      return res.data;
    } catch (error) {
      console.error('API Error in bulkUpdateQuestionStatus:', error);
      throw error;
    }
  },

  submitModerationReport: async (moderationData) => {
    try {
      const res = await api.post(`/moderation/moderations`, moderationData);
      return res.data;
    } catch (error) {
      console.error('API Error in submitModerationReport:', error);
      throw error;
    }
  },

  getModerationHistory: async () => {
    try {
      const res = await api.get(`/moderation/moderations`);
      return res.data;
    } catch (error) {
      console.error('API Error in getModerationHistory:', error);
      throw error;
    }
  },

  getCOBreakdown: async (paperId) => {
    try {
      const res = await api.get(`/moderation/papers/${paperId}/co-breakdown`);
      return res.data;
    } catch (error) {
      console.error('API Error in getCOBreakdown:', error);
      throw error;
    }
  },

  generateModerationReportPdf: async (moderationId) => {
  try {
    const response = await api.get(`/moderation/moderations/${moderationId}/report-pdf`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('API Error in generateModerationReportPdf:', error);
    throw error;
  }
},
  generatePdf: async (params = {}) => {
    try {
      // Use the existing pdfAPI that we know works
      return await pdfAPI.generatePdf(params);
    } catch (error) {
      console.error('API Error in generatePdf:', error);
      throw error;
    }
  },
  downloadPdf: (pdfBlob, filename = 'paper.pdf') => {
    pdfAPI.downloadPdf(pdfBlob, filename);
  },

  openPdfInNewTab: (pdfBlob) => {
    pdfAPI.openPdfInNewTab(pdfBlob);
  },

  // === Report endpoints ===
  getPaperReport: async (paperId) => {
    try {
      const res = await api.get(`/moderation/papers/${paperId}/report`);
      return res.data;
    } catch (error) {
      console.error('API Error in getPaperReport:', error);
      throw error;
    }
  },

  getQuestionReport: async (paperId) => {
    try {
      const res = await api.get(`/moderation/papers/${paperId}/report/questions`);
      return res.data;
    } catch (error) {
      console.error('API Error in getQuestionReport:', error);
      throw error;
    }
  },

  // === ADMIN ENDPOINTS ===
  getAllModerations: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const res = await api.get(`/moderation/admin/moderations?${params.toString()}`);
      return res.data;
    } catch (error) {
      console.error('API Error in getAllModerations:', error);
      throw error;
    }
  },

  getModerationDetails: async (moderationId) => {
    try {
      const res = await api.get(`/moderation/admin/moderations/${moderationId}`);
      return res.data;
    } catch (error) {
      console.error('API Error in getModerationDetails:', error);
      throw error;
    }
  }
};

export default moderatorAPI;