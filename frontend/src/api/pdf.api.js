// src/api/pdf.api.js
import api from "./axios";

export const generatePdf = async (params = {}) => {
  try {
    const response = await api.post('/pdf/generate-pdf', params, {
      responseType: 'blob',
    });
    
    return response.data;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(error.response?.data?.error || 'PDF generation failed');
  }
};

export const downloadPdf = (pdfBlob, filename = 'paper.pdf') => {
  const url = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const openPdfInNewTab = (pdfBlob) => {
  const url = window.URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
};

export default {
  generatePdf,
  downloadPdf,
  openPdfInNewTab,
};