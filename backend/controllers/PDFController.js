// controllers/PDFController.js
import Joi from 'joi';
import { pool } from '../config/db.js';
import PDFGenerationService from '../services/PDFGenerationService.js';

const pdfService = new PDFGenerationService({
  baseUrl: process.env.APP_BASE_URL || null,
  launchOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  },
});

const logRequest = (req) => {
  console.log('PDF request:', {
    method: req.method,
    path: req.path,
    userId: req.user?.user_id,
    timestamp: new Date().toISOString(),
  });
};

const bodySchema = Joi.object({
  html: Joi.string().allow('', null),
  paperId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().trim()).allow(null),
  baseUrl: Joi.string().uri().optional(),
  pdfOptions: Joi.object().optional(),
  postOptions: Joi.object().optional(),
  filename: Joi.string().max(200).optional(),
});

/**
 * Load paper and questions directly using SQL (uses your schema).
 * Returns object expected by PDFGenerationService.buildHtmlFromPaper:
 * {
 *   title,
 *   course,
 *   metadata: { institution, academic_year, exam_type, duration, full_marks },
 *   questions: [{ question_id, sequence_number, content_html }, ...]
 * }
 */
async function fetchPaperDataFromDb(paperId) {
  const client = await pool.connect();
  try {
    // UPDATED QUERY: Removed assembled_html (field no longer exists)
    const paperRes = await client.query(
      `SELECT 
         qp.paper_id, qp.title, qp.course_id, qp.created_by, 
         qp.academic_year, qp.exam_type, 
         qp.full_marks, qp.duration, qp.semester,
         c.code as course_code, c.title as course_title
       FROM question_papers qp
       LEFT JOIN courses c ON qp.course_id = c.course_id
       WHERE qp.paper_id = $1`,
      [paperId]
    );

    if (paperRes.rowCount === 0) {
      const err = new Error('Paper not found');
      err.status = 404;
      throw err;
    }

    const paper = paperRes.rows[0];

    // UPDATED: Fetch questions with marks field
    const qRes = await client.query(
      `SELECT question_id, sequence_number, content_html, marks
       FROM questions
       WHERE paper_id = $1
       ORDER BY COALESCE(sequence_number, 2147483647), created_at ASC`,
      [paperId]
    );

    const questions = qRes.rows.map((r) => ({
      question_id: r.question_id,
      sequence_number: r.sequence_number,
      content_html: r.content_html,
      marks: r.marks, // ADDED: Include marks field
    }));

    return {
      title: paper.title,
      course: `${paper.course_code}: ${paper.course_title}`, // Format: "CS343: COMPUTER NETWORKS"
      metadata: {
        institution: process.env.INSTITUTION_NAME || 'TEZPUR UNIVERSITY',
        academic_year: paper.academic_year,
        exam_type: paper.exam_type,
        semester: paper.semester, // ADD THIS
        duration: paper.duration,
        full_marks: paper.full_marks,
      },
      questions,
      created_by: paper.created_by,
    };
  } finally {
    client.release();
  }
}

/**
 * Access check helper
 * Allow if:
 *  - user is creator (paper.created_by === req.user.user_id)
 *  - OR user role is admin or moderator
 *
 * Adjust this policy if you want instructors to access other instructors' papers.
 */
function hasAccessToPaper(paper, user) {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase();
  if (role === 'admin' || role === 'moderator') return true;
  if (paper && Number(user.user_id) === Number(paper.created_by)) return true;
  return false;
}

/**
 * Controller: generatePdf
 * Body: { html?, paperId?, baseUrl?, pdfOptions?, postOptions?, filename? }
 */
export const generatePdf = async (req, res) => {
  logRequest(req);
  try {
    const { error, value } = bodySchema.validate(req.body ?? {}, { abortEarly: false });
    if (error) {
      return res.status(400).json({ error: 'Invalid request payload', details: error.details.map(d => d.message) });
    }

    const { html, paperId, baseUrl, pdfOptions, postOptions, filename } = value;

    if (!html && !paperId) {
      return res.status(400).json({ error: 'Either html or paperId must be provided' });
    }

    // If paperId provided, load paper metadata early to check access
    if (paperId) {
      const pid = Number.parseInt(paperId, 10);
      if (Number.isNaN(pid)) return res.status(400).json({ error: 'Invalid paperId' });

      const paperData = await fetchPaperDataFromDb(pid);

      if (!hasAccessToPaper(paperData, req.user)) {
        return res.status(403).json({ error: 'Access denied to requested paper' });
      }

      // Build PDF from server-side data
      const buffer = await pdfService.generatePdf({
        paperId: pid,
        fetchPaperData: async (id) => {
          // fetchPaperDataFromDb already returned the paper; but pdfService expects to call the fetcher.
          // Provide a fetcher that returns fresh data from DB (keeps behavior consistent).
          return await fetchPaperDataFromDb(id);
        },
        baseUrl: baseUrl || process.env.APP_BASE_URL || pdfService.baseUrl,
        pdfOptions: pdfOptions || { pageSize: 'A4', margins: pdfService.config.margins },
        postOptions: postOptions || {},
      });

      const safeName = filename ? String(filename).slice(0, 200).replace(/[^a-zA-Z0-9._-]/g, '_') : `paper-${pid}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      res.setHeader('Content-Length', buffer.length);

      return res.send(buffer);
    } else {
      // html provided by client — ensure baseUrl resolves relative /uploads/... images
      // Optional: do minimal permission check if you want (we assume authenticate + roles applied in route)
      const buffer = await pdfService.generatePdf({
        html,
        baseUrl: baseUrl || process.env.APP_BASE_URL || pdfService.baseUrl,
        pdfOptions: pdfOptions || { pageSize: 'A4', margins: pdfService.config.margins },
        postOptions: postOptions || {},
      });

      const safeName = filename ? String(filename).slice(0, 200).replace(/[^a-zA-Z0-9._-]/g, '_') : `paper-export-${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      res.setHeader('Content-Length', buffer.length);

      return res.send(buffer);
    }
  } catch (err) {
    console.error('PDFController.generatePdf error:', err?.stack ?? err?.message ?? err);
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    const message = status === 500 ? 'Failed to generate PDF' : err.message;
    return res.status(status).json({ error: message });
  }
};