// src/api/pdf.api.js
import authService from "../services/authService";

const API_BASE = process.env.REACT_APP_API_BASE || '';

/**
 * Generate PDF from paper ID or HTML content
 * @param {Object} params - Generation parameters
 * @param {string} params.paperId - Paper ID for server-side generation
 * @param {string} params.html - HTML content for client-side generation
 * @param {string} params.baseUrl - Base URL for resolving relative images
 * @param {Object} params.pdfOptions - Puppeteer PDF options
 * @param {Object} params.postOptions - PDF post-processing options
 * @param {string} params.filename - Custom filename for download
 * @returns {Promise<Blob>} PDF blob
 */
export const generatePdf = async (params = {}) => {
  const token = authService.getToken();
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/pdf/generate-pdf`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `PDF generation failed: ${response.status}`);
  }

  return await response.blob();
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