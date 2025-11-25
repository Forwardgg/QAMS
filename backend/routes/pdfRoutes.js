// routes/pdfRoutes.js
import express from 'express';
import { generatePdf } from '../controllers/PDFController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// FINAL ENDPOINT: /api/pdf/generate-pdf
router.post(
  '/generate-pdf',
  authenticate,
  authorizeRoles('admin', 'instructor', 'moderator'),
  generatePdf
);

export default router;
