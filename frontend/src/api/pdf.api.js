// src/api/pdf.api.js
import authService from "../services/authService";

const API_BASE = process.env.REACT_APP_API_BASE || '';

export const generatePdf = async (params = {}) => {
  const token = authService.getToken();
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // FIX: Remove "/api" from the URL since API_BASE already has it
  const url = `${API_BASE}/pdf/generate-pdf`;
  
  console.log('PDF API Request URL:', url); // Debug log

  const response = await fetch(url, {
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