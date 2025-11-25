import api from "./axios";

export const paperCompilationAPI = {
  /**
   * Get paper template HTML
   * GET /api/papers/:paperId/template
   */
  getPaperTemplate: async (paperId) => {
    const response = await api.get(`/papers/${paperId}/template`);
    return response.data;
  },

  /**
   * Generate PDF from HTML content
   * POST /api/papers/:paperId/generate-pdf
   */
  generatePDF: async (paperId, html) => {
    const response = await api.post(
      `/papers/${paperId}/generate-pdf`, 
      { html }, 
      {
        responseType: 'blob' // Important for PDF download
      }
    );
    return response;
  },

  /**
   * Submit paper for moderation
   * POST /api/papers/:paperId/submit
   */
  submitForModeration: async (paperId, html) => {
    const response = await api.post(`/papers/${paperId}/submit`, { html });
    return response.data;
  },

  /**
   * Download PDF file
   * Helper function to handle blob download
   */
  downloadPDF: (blob, filename = 'question-paper.pdf') => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};