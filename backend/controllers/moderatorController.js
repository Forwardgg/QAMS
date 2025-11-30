// backend/controllers/moderatorController.js
import { QuestionPaper } from "../models/QuestionPaper.js";
import { Question } from "../models/Question.js";
import { Moderation } from "../models/Moderation.js";
import ModerationReportPdfService from "../services/ModerationReportPdfService.js";
import { pool } from "../config/db.js";

/**
 * Get papers available for moderation
 * GET /api/moderator/papers?courseId=123&status=submitted
 */
export const getPapersForModeration = async (req, res) => {
  try {
    const { courseId, status } = req.query;
    const moderatorId = req.user.user_id;

    if (req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: "Access denied. Moderator role required." });
    }

    const papers = await QuestionPaper.getAllPapersForModerator(courseId, status, moderatorId);

    res.json({
      success: true,
      data: papers,
      count: papers.length,
      filters: {
        courseId: courseId || 'all',
        status: status || 'all'
      }
    });
  } catch (error) {
    console.error("getPapersForModeration error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get paper details with questions for moderation
 * GET /api/moderator/papers/:id
 */
export const getPaperDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const moderatorId = req.user.user_id;

    if (req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: "Access denied. Moderator role required." });
    }

    // Paper metadata and course outcomes
    const paper = await QuestionPaper.getPaperForModeration(id);
    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found or not available for moderation" });
    }

    // Questions for moderation (content + COs)
    const questions = await Question.getQuestionsForModeration(id);

    // Active pending moderation (if any)
    const existingModeration = await Moderation.findPendingByPaper(id);

    // Return everything; front-end decides allowed actions based on existingModeration & user
    res.json({
      success: true,
      data: {
        paper,
        questions,
        existingModeration
      }
    });
  } catch (error) {
    console.error("getPaperDetails error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Start moderating a paper (transactional)
 * POST /api/moderator/papers/:id/start
 */
export const startModeration = async (req, res) => {
  try {
    const { id } = req.params;
    const moderatorId = req.user.user_id;

    console.log('=== START MODERATION DEBUG ===');
    console.log('Paper ID:', id, 'Moderator ID:', moderatorId);

    if (req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: "Access denied. Moderator role required." });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock the paper row to avoid concurrent starters
      const paperRes = await client.query(
        'SELECT paper_id, status, version FROM question_papers WHERE paper_id = $1 FOR UPDATE',
        [id]
      );
      
      console.log('Paper query result:', paperRes.rows);
      
      if (!paperRes.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: "Paper not found" });
      }
      
      const paper = paperRes.rows[0];
      console.log('Paper status:', paper.status, 'Paper version:', paper.version);

      // Check paper status
      if (paper.status !== 'submitted') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Paper is not in submitted status. Current status: ${paper.status}`
        });
      }

      const existingModeration = await client.query(
  `SELECT 1 FROM qp_moderations WHERE paper_id = $1 AND status = 'pending' AND moderator_id = $2 LIMIT 1`,
  [id, moderatorId]
);
      
      console.log('Existing moderation check for same moderator:', existingModeration.rows);

      if (existingModeration.rows.length) {
  await client.query('ROLLBACK');
  return res.status(400).json({ 
    success: false, 
    message: "You are already moderating this paper" 
  });
}

      // Create moderation record using same client
      console.log('Creating moderation record...');
      const moderation = await Moderation.create(id, moderatorId, client);
      console.log('Moderation created:', moderation);

      // Update paper status to under_review using same client
      console.log('Updating paper status to under_review...');
      await QuestionPaper.startModeration(id, client);

      await client.query('COMMIT');
      console.log('Transaction committed successfully');

      res.json({
        success: true,
        message: "Moderation started successfully",
        data: {
          paper: { paper_id: id, status: 'under_review' },
          moderation
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error in startModeration:', error);
      console.error('Error stack:', error.stack);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("startModeration error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      paperId: req.params.id,
      moderatorId: req.user.user_id
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update individual question status
 * PATCH /api/moderator/questions/:id
 */
export const updateQuestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const moderatorId = req.user.user_id;

    if (req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: "Access denied. Moderator role required." });
    }

    if (!status || !['approved', 'change_requested'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be either 'approved' or 'change_requested'" });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    // Ensure the moderator has an active pending moderation for this paper
    const isActive = await Moderation.isModeratingPaper(question.paper_id, moderatorId);
    if (!isActive) {
      return res.status(403).json({ success: false, message: "You are not moderating this paper" });
    }

    // Update question status (single update)
    const updatedQuestion = await Question.updateQuestionStatus(id, status);

    res.json({
      success: true,
      message: `Question status updated to ${status}`,
      data: updatedQuestion
    });
  } catch (error) {
    console.error("updateQuestionStatus error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Bulk update question statuses
 * PATCH /api/moderator/questions/bulk-status
 */
export const bulkUpdateQuestionStatus = async (req, res) => {
  try {
    const { updates } = req.body;
    const moderatorId = req.user.user_id;

    if (req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: "Access denied. Moderator role required." });
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: "Updates array is required" });
    }

    // Validate payload
    for (const upd of updates) {
      if (!upd.question_id || !['approved', 'change_requested'].includes(upd.status)) {
        return res.status(400).json({
          success: false,
          message: "Each update must have question_id and status (approved/change_requested)"
        });
      }
    }

    // Fetch first question and verify moderator access
    const firstQuestion = await Question.findById(updates[0].question_id);
    if (!firstQuestion) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const isActive = await Moderation.isModeratingPaper(firstQuestion.paper_id, moderatorId);
    if (!isActive) {
      return res.status(403).json({ success: false, message: "You are not moderating this paper" });
    }

    // Fetch all question records in one query to validate paper ownership
    const ids = updates.map(u => u.question_id);
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const qFetch = await pool.query(`SELECT question_id, paper_id FROM questions WHERE question_id IN (${placeholders})`, ids);

    if (qFetch.rows.length !== ids.length) {
      return res.status(404).json({ success: false, message: "One or more questions not found" });
    }
    for (const r of qFetch.rows) {
      if (r.paper_id !== firstQuestion.paper_id) {
        return res.status(400).json({ success: false, message: "All questions must be from the same paper" });
      }
    }

    // Perform bulk update in a transaction (so either all succeed or none)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = await Question.bulkUpdateStatus(updates, client);
      await client.query('COMMIT');

      res.json({
        success: true,
        message: `${results.length} question statuses updated successfully`,
        data: results
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("bulkUpdateQuestionStatus error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Submit final moderation report
 * POST /api/moderator/moderations
 */
export const submitModerationReport = async (req, res) => {
  try {
    const {
      paper_id,
      questions_set_per_co,
      questions_set_per_co_comment = 'N/A',
      meets_level_standard,
      meets_level_standard_comment = 'N/A',
      covers_syllabus,
      covers_syllabus_comment = 'N/A',
      technically_accurate,
      technically_accurate_comment = 'N/A',
      edited_formatted_accurately,
      edited_formatted_comment = 'N/A',
      linguistically_accurate,
      linguistically_accurate_comment = 'N/A',
      verbatim_copy_check,
      verbatim_copy_comment = 'N/A',
      final_decision // 'approved' or 'rejected'
    } = req.body;

    const moderatorId = req.user.user_id;

    if (req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: "Access denied. Moderator role required." });
    }

    if (!paper_id || !final_decision || !['approved', 'rejected'].includes(final_decision)) {
      return res.status(400).json({ success: false, message: "paper_id and final_decision (approved/rejected) are required" });
    }

    // Get pending moderation for this paper and ensure this moderator is assigned
    const existingModeration = await Moderation.findPendingByPaper(paper_id);
    if (!existingModeration || existingModeration.moderator_id !== moderatorId) {
      return res.status(403).json({ success: false, message: "You are not moderating this paper (or no active moderation found)" });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock the moderation row to avoid races
      const modLock = await client.query('SELECT moderation_id FROM qp_moderations WHERE moderation_id = $1 FOR UPDATE', [existingModeration.moderation_id]);
      if (!modLock.rows.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: "Moderation record not found" });
      }

      // Get all questions for validation BEFORE making any changes
      const questions = await Question.getQuestionsForModeration(paper_id);
      
      // CRITICAL VALIDATION: Cannot approve paper if any questions are change_requested
      if (final_decision === 'approved') {
        const changeRequestedQuestions = questions.filter(q => q.status === 'change_requested');
        if (changeRequestedQuestions.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: `Cannot approve paper. ${changeRequestedQuestions.length} question(s) have change_requested status. All questions must be approved to approve the paper.`
          });
        }

        // Additional validation: Ensure all questions have been explicitly reviewed
        const unreviewedQuestions = questions.filter(q => 
          !['approved', 'change_requested'].includes(q.status)
        );
        if (unreviewedQuestions.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: `Cannot approve paper. ${unreviewedQuestions.length} question(s) have not been reviewed (current status: ${unreviewedQuestions.map(q => q.status).join(', ')}). Please review all questions before approving the paper.`
          });
        }
      }

      // Prepare moderationData for update
      const moderationData = {
        questions_set_per_co,
        questions_set_per_co_comment,
        meets_level_standard,
        meets_level_standard_comment,
        covers_syllabus,
        covers_syllabus_comment,
        technically_accurate,
        technically_accurate_comment,
        edited_formatted_accurately,
        edited_formatted_comment,
        linguistically_accurate,
        linguistically_accurate_comment,
        verbatim_copy_check,
        verbatim_copy_comment,
        status: final_decision === 'approved' ? 'approved' : 'rejected'
      };

      // Update moderation record (within transaction)
      const updatedModeration = await Moderation.update(existingModeration.moderation_id, moderationData, client);

      // Update paper status (approved -> 'approved', rejected -> 'change_requested')
      const paperStatus = final_decision === 'approved' ? 'approved' : 'change_requested';
      await QuestionPaper.updateStatus(paper_id, paperStatus, client);

      // NEW LOGIC: Handle question status based on final decision
      if (final_decision === 'approved') {
        // For approved papers: All questions should already be approved (validated above)
        // No need to change question statuses since they're already correct
        console.log(`Paper approved - ${questions.filter(q => q.status === 'approved').length} questions already approved`);
      } else {
        // For rejected papers: Questions keep their current status (no changes needed)
        console.log(`Paper rejected - questions maintain their current status`);
      }

      await client.query('COMMIT');

      // CLEANUP OLD VERSIONS AFTER SUCCESSFUL MODERATION
      await Moderation.cleanupOldVersions(paper_id);

      res.json({
        success: true,
        message: `Moderation report submitted successfully. Paper ${final_decision}.`,
        data: {
          moderation: updatedModeration,
          paper_status: paperStatus,
          question_summary: {
            total: questions.length,
            approved: questions.filter(q => q.status === 'approved').length,
            change_requested: questions.filter(q => q.status === 'change_requested').length,
            other: questions.filter(q => !['approved', 'change_requested'].includes(q.status)).length
          }
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("submitModerationReport error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get moderation history for current moderator
 * GET /api/moderator/moderations
 */
export const getModerationHistory = async (req, res) => {
  try {
    const moderatorId = req.user.user_id;

    if (req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: "Access denied. Moderator role required." });
    }

    const moderations = await Moderation.getByModerator(moderatorId);

    res.json({
      success: true,
      data: moderations,
      count: moderations.length
    });
  } catch (error) {
    console.error("getModerationHistory error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get questions grouped by CO for moderation report
 * GET /api/moderator/papers/:id/co-breakdown
 */
export const getCOBreakdown = async (req, res) => {
  try {
    const { id } = req.params;
    const moderatorId = req.user.user_id;

    if (req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: "Access denied. Moderator role required." });
    }

    // Verify moderator has access to this paper (active moderation)
    const moderation = await Moderation.findPendingByPaper(id);
    if (!moderation || moderation.moderator_id !== moderatorId) {
      return res.status(403).json({ success: false, message: "You are not moderating this paper" });
    }

    const coBreakdown = await Question.getQuestionsByCO(id);

    res.json({
      success: true,
      data: coBreakdown
    });
  } catch (error) {
    console.error("getCOBreakdown error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/moderation/papers/:id/report/questions
 * Returns list of questions with moderation status for a paper.
 */
export const viewQuestionReport = async (req, res) => {
  try {
    const { id } = req.params; // paper id
    const requester = req.user;

    // ... permission checks ...

    // Fetch questions for the paper (moderation view)
    const questions = await Question.getQuestionsForModeration(id);

    // Transform for response - RETURN FULL CONTENT
    const transformed = questions.map(q => ({
      question_id: q.question_id,
      sequence_number: q.sequence_number,
      status: q.status,
      content_html: q.content_html, // ← ADD THIS LINE - FULL HTML WITH IMAGES
      content_preview: q.content_html ? String(q.content_html).substring(0, 300) : '',
      co_id: q.co_id,
      co_number: q.co_number,
      co_description: q.co_description,
      updated_at: q.updated_at
    }));

    return res.json({
      success: true,
      data: transformed,
      count: transformed.length
    });
  } catch (error) {
    console.error('viewQuestionReport error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/moderation/papers/:id/report
 * Returns overall paper moderation + questions summary
 */
export const viewPaperReport = async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    if (!['moderator', 'instructor', 'admin'].includes(String(requester.role).toLowerCase())) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // instructor must be owner
    if (String(requester.role).toLowerCase() === 'instructor') {
      const isOwner = await QuestionPaper.isOwner(id, requester.user_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    // moderators must have at least one moderation record (they can view reports they worked on).
    if (String(requester.role).toLowerCase() === 'moderator') {
      const modAny = await Moderation.findByPaper(id);
      if (!modAny) {
        return res.status(403).json({ success: false, message: 'You are not associated with this paper' });
      }
    }

    // Paper metadata
    const paper = await QuestionPaper.findById(id);
    if (!paper) {
      return res.status(404).json({ success: false, message: 'Paper not found' });
    }

    // Latest moderation record (if any)
    const latestModeration = await Moderation.findByPaper(id); // returns latest (existing function)
    // If you prefer the active pending moderation, use findPendingByPaper()

    // Questions & counts
    const questions = await Question.getQuestionsForModeration(id);
    const counts = {
      total: questions.length,
      approved: questions.filter(q => q.status === 'approved').length,
      change_requested: questions.filter(q => q.status === 'change_requested').length,
      draft: questions.filter(q => q.status === 'draft').length,
      submitted: questions.filter(q => q.status === 'submitted').length,
      under_review: questions.filter(q => q.status === 'under_review').length
    };

    // Prepare a compact questions array (include content_preview)
    const questionsCompact = questions.map(q => ({
      question_id: q.question_id,
      sequence_number: q.sequence_number,
      status: q.status,
      content_html: q.content_html, // Add full content
content_preview: q.content_html ? String(q.content_html).substring(0, 300) : '',
      co_id: q.co_id,
      co_number: q.co_number,
      co_description: q.co_description,
      updated_at: q.updated_at
    }));

    return res.json({
      success: true,
      data: {
        paper: {
          paper_id: paper.paper_id,
          title: paper.title,
          course_id: paper.course_id,
          course_code: paper.course_code,
          course_title: paper.course_title,
          status: paper.status,
          version: paper.version,
          created_by: paper.created_by,
          created_at: paper.created_at,
          updated_at: paper.updated_at
        },
        moderation: latestModeration, // can be null
        counts,
        questions: questionsCompact
      }
    });
  } catch (error) {
    console.error('viewPaperReport error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const getAllModerations = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin role required." 
      });
    }

    const {
      search = '',
      status = '',
      courseCode = '',
      moderatorName = '',
      page = 1,
      limit = 50
    } = req.query;

    const filters = {
      search,
      status,
      courseCode,
      moderatorName,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await Moderation.getAllModerations(filters);

    res.json({
      success: true,
      data: result.moderations,
      pagination: {
        total: result.totalCount,
        page: result.currentPage,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      },
      filters
    });
  } catch (error) {
    console.error("getAllModerations error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Get moderation details by ID for admin
 * GET /api/admin/moderations/:id
 */
export const getModerationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const moderation = await Moderation.findById(id);

    if (!moderation) {
      return res.status(404).json({ 
        success: false, 
        message: "Moderation record not found" 
      });
    }

    res.json({
      success: true,
      data: moderation
    });
  } catch (error) {
    console.error("getModerationDetails error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const generateModerationReportPdf = async (req, res) => {
  try {
    const { id } = req.params; // moderation_id
    const userId = req.user.user_id;
    const userRole = req.user.role;

    // Allow admin, moderator, and instructor roles
    if (!['admin', 'moderator', 'instructor'].includes(userRole)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Get moderation details with paper data
    const moderation = await Moderation.findById(id);
    if (!moderation) {
      return res.status(404).json({ success: false, message: "Moderation record not found" });
    }

    // Additional permission checks for instructors
    if (userRole === 'instructor') {
      // Instructor can only generate PDF for their own papers
      const isOwner = await QuestionPaper.isOwner(moderation.paper_id, userId);
      if (!isOwner) {
        return res.status(403).json({ 
          success: false, 
          message: "Access denied. You can only generate reports for your own papers." 
        });
      }
    }

    // Additional permission checks for moderators
    if (userRole === 'moderator' && moderation.moderator_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied to this moderation record" 
      });
    }

    // Get paper details
    const paper = await QuestionPaper.findById(moderation.paper_id);
    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found" });
    }

    // Generate PDF
    const pdfService = new ModerationReportPdfService();
    const pdfBuffer = await pdfService.generateModerationReport(moderation, paper);

    // Set response headers
    const filename = `moderation-report-${paper.course_code}-${paper.semester}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error("generateModerationReportPdf error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
