// routes/pdfRoutes.js
import express from 'express';
import { generatePdf } from '../controllers/PDFController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/generate-pdf
 * Protected: admin / instructor / moderator (adjust roles as needed)
 * Body: { html?, paperId?, baseUrl?, pdfOptions?, postOptions?, filename? }
 */
router.post(
  '/api/generate-pdf',
  authenticate,
  authorizeRoles('admin', 'instructor', 'moderator'),
  generatePdf
);

export default router;
