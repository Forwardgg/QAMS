// backend/controllers/QuestionPaperController.js
import { pool } from "../config/db.js";
import { QuestionPaper } from "../models/QuestionPaper.js";
import { Question } from "../models/Question.js";

/**
 * Create a new question paper
 */
export const createQuestionPaper = async (req, res) => {
  try {
    const {
      courseId,
      title,
      examType,
      semester,
      academicYear,
      fullMarks,
      duration
    } = req.body;

    const createdBy = req.user.user_id;

    // Basic validation
    if (!courseId || !title) {
      return res.status(400).json({
        success: false,
        message: "courseId and title are required"
      });
    }

    const paper = await QuestionPaper.create({
      courseId,
      createdBy,
      title,
      examType,
      semester,
      academicYear,
      fullMarks,
      duration
    });

    res.status(201).json({
      success: true,
      message: "Question paper created successfully",
      data: paper
    });
  } catch (error) {
    const statusCode = error.message && (error.message.includes("required") || error.message.includes("must")) ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllPapers = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const limitInt = parseInt(limit, 10) || 50;
    const offsetInt = parseInt(offset, 10) || 0;

    const papers = await QuestionPaper.getAll(limitInt, offsetInt);

    res.json({
      success: true,
      data: papers,
      pagination: {
        limit: limitInt,
        offset: offsetInt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getPapersByCourse = async (req, res) => {
  try {
    const { courseCode } = req.params;

    if (!courseCode) {
      return res.status(400).json({ success: false, message: "courseCode is required" });
    }

    const papers = await QuestionPaper.getByCourseCode(courseCode);

    res.json({
      success: true,
      data: papers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getPapersByCourseAndCO = async (req, res) => {
  try {
    const { courseCode, coNumber } = req.params;

    if (!courseCode || !coNumber) {
      return res.status(400).json({ success: false, message: "courseCode and coNumber are required" });
    }

    const papers = await QuestionPaper.getByCourseAndCO(courseCode, coNumber);

    res.json({
      success: true,
      data: papers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updatePaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const {
      title,
      examType,
      semester,
      academicYear,
      fullMarks,
      duration,
      status
    } = req.body;

    if (!paperId) {
      return res.status(400).json({ success: false, message: "paperId is required" });
    }

    // Check if user is admin or owner of the paper
    if (req.user.role !== 'admin') {
      const isOwner = await QuestionPaper.isOwner(paperId, req.user.user_id);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only update your own papers."
        });
      }
    }

    const updatedPaper = await QuestionPaper.update(paperId, {
      title,
      examType,
      semester,
      academicYear,
      fullMarks,
      duration,
      status
    });

    res.json({
      success: true,
      message: "Question paper updated successfully",
      data: updatedPaper
    });
  } catch (error) {
    const statusCode = error.message && (error.message.includes("Invalid") || error.message.includes("required")) ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

export const submitForModeration = async (req, res) => {
  const debug = process.env.AUTH_DEBUG === 'true' || true;
  if (debug) {
    console.debug('=== submitForModeration REQUEST DEBUG ===');
    console.debug('method:', req.method, 'path:', req.path, 'originalUrl:', req.originalUrl);
    console.debug('req.params:', req.params);
    console.debug('req.query:', req.query);
    console.debug('headers.authorization (first 100 chars):', String(req.headers.authorization || '').slice(0,100));
  }
  
  const rawId = req.params?.id ?? req.params?.paperId ?? req.params?.paper_id;
  const paperId = Number.isInteger(Number(rawId)) ? parseInt(rawId, 10) : NaN;
  
  if (Number.isNaN(paperId)) {
    console.warn('[submitForModeration] invalid paper id param', { rawId, params: req.params });
    return res.status(400).json({ error: 'Invalid paper id parameter' });
  }
  
  const userId = req.user.user_id;
  const userRole = req.user.role;

  console.log('=== BACKEND OWNERSHIP DEBUG ===');
  console.log('Paper ID from params (raw):', req.params.id);
  console.log('Paper ID parsed:', paperId, 'Type:', typeof paperId);
  console.log('User ID from token:', userId, 'Type:', typeof userId);
  console.log('User Role:', userRole);

  try {
    // DIRECT DATABASE CHECK
    const paperCheck = await pool.query(
      'SELECT paper_id, created_by, title, status, version FROM question_papers WHERE paper_id = $1', 
      [paperId]
    );

    if (!paperCheck.rows.length) {
      console.log('PAPER NOT FOUND IN DATABASE');
      return res.status(404).json({ error: 'Paper not found' });
    }

    const dbPaper = paperCheck.rows[0];
    console.log('Paper from DB:', dbPaper);

    // Only instructors can submit
    if (userRole !== 'instructor') {
      console.log('USER IS NOT INSTRUCTOR');
      return res.status(403).json({ error: 'Only instructors can submit papers for moderation' });
    }

    // Check ownership
    const isOwner = await QuestionPaper.isOwner(paperId, userId);
    console.log('isOwner result:', isOwner);
    if (!isOwner) {
      console.log('isOwner returned false - ownership check failed');
      return res.status(403).json({ error: 'You are not the owner of this question paper' });
    }

    console.log('Ownership verified, continuing with submission...');

    // UPDATED: Allow draft AND resubmission from change_requested/rejected
    if (!['draft', 'change_requested', 'rejected'].includes(dbPaper.status)) {
      return res.status(400).json({ 
        error: `Paper cannot be submitted from current status: ${dbPaper.status}. Only draft, change_requested, or rejected papers can be submitted.` 
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // UPDATED: Increment version only for resubmissions (not initial submission)
      const isResubmission = ['change_requested', 'rejected'].includes(dbPaper.status);
      const newVersion = isResubmission ? (dbPaper.version || 1) + 1 : (dbPaper.version || 1);
      
      // Update paper status to 'submitted' and increment version if resubmission
      const updatedPaperRes = await client.query(
        `UPDATE question_papers
         SET status = 'submitted', 
             version = $1, 
             updated_at = CURRENT_TIMESTAMP
         WHERE paper_id = $2
         RETURNING paper_id, status, version, updated_at`,
        [newVersion, paperId]
      );

      const updatedPaper = updatedPaperRes.rows[0];

      // Get all questions for this paper
      const qRes = await client.query('SELECT question_id FROM questions WHERE paper_id = $1', [paperId]);
      const questions = qRes.rows || [];

      if (questions.length > 0) {
        const questionUpdates = questions.map(q => [ 'submitted', q.question_id ]);
        for (const [status, qid] of questionUpdates) {
          await client.query(
            `UPDATE questions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE question_id = $2`,
            [status, qid]
          );
        }
      }

      await client.query('COMMIT');

      return res.json({
        message: isResubmission 
          ? 'Paper resubmitted for moderation successfully' 
          : 'Question paper submitted for moderation successfully',
        paper: updatedPaper,
        questionsUpdated: questions.length,
        isResubmission: isResubmission
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Transaction error in submitForModeration:', err);
      return res.status(500).json({ error: 'Failed to submit paper for moderation' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Submit for moderation error DETAILS:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to submit paper for moderation: ' + error.message });
  }
};

export const deletePaper = async (req, res) => {
  try {
    const { paperId } = req.params;

    if (!paperId) {
      return res.status(400).json({ success: false, message: "paperId is required" });
    }

    // Check if user is admin or owner of the paper
    if (req.user.role !== 'admin') {
      const isOwner = await QuestionPaper.isOwner(paperId, req.user.user_id);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only delete your own papers."
        });
      }
    }

    const deletedPaper = await QuestionPaper.delete(paperId);

    res.json({
      success: true,
      message: "Question paper deleted successfully",
      data: deletedPaper
    });
  } catch (error) {
    const statusCode = error.message && error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};
