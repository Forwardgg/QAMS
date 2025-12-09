// src/api/pdf.api.js
import authService from "../services/authService";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || '';

export const generatePdf = async (params = {}) => {
  try {
    const response = await api.post('/pdf/generate-pdf', params, {
      responseType: 'blob',  // Important for PDF files
    });
    
    return response.data;  // Returns blob
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(error.response?.data?.error || 'PDF generation failed');
  }
};

/**
 * Download PDF blob as file
 * @param {Blob} pdfBlob - PDF blob from generatePdf
 * @param {string} filename - Filename for download
 */
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

/**
 * Open PDF in new tab
 * @param {Blob} pdfBlob - PDF blob from generatePdf
 */
export const openPdfInNewTab = (pdfBlob) => {
  const url = window.URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
  // Note: URL revocation happens when the tab is closed
};

export default {
  generatePdf,
  downloadPdf,
  openPdfInNewTab,
};