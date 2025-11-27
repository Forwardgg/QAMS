// src/backend/controllers/moderatorController.js
import { QuestionPaper } from "../models/QuestionPaper.js";
import { Question } from "../models/Question.js";
import { Moderation } from "../models/Moderation.js";
import { pool } from "../config/db.js";
/**
 * Get papers available for moderation
 * GET /api/moderator/papers?courseId=123
 */
export const getPapersForModeration = async (req, res) => {
  try {
    const { courseId, status } = req.query;
    const moderatorId = req.user.user_id;

    // Only moderators can access
    if (req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Moderator role required."
      });
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
    res.status(500).json({
      success: false,
      message: error.message
    });
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
      return res.status(403).json({
        success: false,
        message: "Access denied. Moderator role required."
      });
    }

    // Get paper details
    const paper = await QuestionPaper.getPaperForModeration(id);
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: "Paper not found or not available for moderation"
      });
    }

    // Get questions for this paper
    const questions = await Question.getQuestionsForModeration(id);

    // Get existing moderation if any
    const existingModeration = await Moderation.findByPaper(id);

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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Start moderating a paper (changes status to under_review)
 * POST /api/moderator/papers/:id/start
 */
export const startModeration = async (req, res) => {
  try {
    const { id } = req.params;
    const moderatorId = req.user.user_id;

    if (req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Moderator role required."
      });
    }

    // Check if paper exists and is in submitted status
    const paper = await QuestionPaper.getPaperForModeration(id);
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: "Paper not found"
      });
    }

    if (paper.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: `Paper is not in submitted status. Current status: ${paper.status}`
      });
    }

    // Check if already being moderated by someone else
    const existingModeration = await Moderation.findByPaper(id);
    if (existingModeration && existingModeration.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: "Paper is already being moderated by another moderator"
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update paper status to under_review
      await QuestionPaper.startModeration(id);

      // Create moderation record
      const moderation = await Moderation.create(id, moderatorId);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: "Moderation started successfully",
        data: {
          paper: { ...paper, status: 'under_review' },
          moderation
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("startModeration error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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
      return res.status(403).json({
        success: false,
        message: "Access denied. Moderator role required."
      });
    }

    if (!status || !['approved', 'change_requested'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'change_requested'"
      });
    }

    // Get question to verify it exists and get paper info
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    // Verify moderator has access to this paper
    const moderation = await Moderation.findByPaper(question.paper_id);
    if (!moderation || moderation.moderator_id !== moderatorId) {
      return res.status(403).json({
        success: false,
        message: "You are not moderating this paper"
      });
    }

    const updatedQuestion = await Question.updateQuestionStatus(id, status);

    res.json({
      success: true,
      message: `Question status updated to ${status}`,
      data: updatedQuestion
    });
  } catch (error) {
    console.error("updateQuestionStatus error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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
      return res.status(403).json({
        success: false,
        message: "Access denied. Moderator role required."
      });
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates array is required"
      });
    }

    // Validate all updates
    for (const update of updates) {
      if (!update.question_id || !['approved', 'change_requested'].includes(update.status)) {
        return res.status(400).json({
          success: false,
          message: "Each update must have question_id and status (approved/change_requested)"
        });
      }
    }

    // Verify all questions belong to the same paper and moderator has access
    const firstQuestion = await Question.findById(updates[0].question_id);
    if (!firstQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    const moderation = await Moderation.findByPaper(firstQuestion.paper_id);
    if (!moderation || moderation.moderator_id !== moderatorId) {
      return res.status(403).json({
        success: false,
        message: "You are not moderating this paper"
      });
    }

    // Verify all questions are from the same paper
    for (const update of updates) {
      const question = await Question.findById(update.question_id);
      if (!question) {
        return res.status(404).json({
          success: false,
          message: `Question ${update.question_id} not found`
        });
      }
      if (question.paper_id !== firstQuestion.paper_id) {
        return res.status(400).json({
          success: false,
          message: "All questions must be from the same paper"
        });
      }
    }

    const results = await Question.bulkUpdateStatus(updates);

    res.json({
      success: true,
      message: `${results.length} question statuses updated successfully`,
      data: results
    });
  } catch (error) {
    console.error("bulkUpdateQuestionStatus error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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
      return res.status(403).json({
        success: false,
        message: "Access denied. Moderator role required."
      });
    }

    if (!paper_id || !final_decision || !['approved', 'rejected'].includes(final_decision)) {
      return res.status(400).json({
        success: false,
        message: "paper_id and final_decision (approved/rejected) are required"
      });
    }

    // Verify moderator has access to this paper
    const existingModeration = await Moderation.findByPaper(paper_id);
    if (!existingModeration || existingModeration.moderator_id !== moderatorId) {
      return res.status(403).json({
        success: false,
        message: "You are not moderating this paper"
      });
    }

    if (existingModeration.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Moderation report already submitted"
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update moderation record with criteria and decision
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
        status: final_decision
      };

      const updatedModeration = await Moderation.update(existingModeration.moderation_id, moderationData);

      // Update paper status based on final decision
      const paperStatus = final_decision === 'approved' ? 'approved' : 'change_requested';
      await QuestionPaper.updateStatus(paper_id, paperStatus);

      // If paper is approved, approve all questions that weren't individually rejected
      if (final_decision === 'approved') {
        const questions = await Question.getQuestionsForModeration(paper_id);
        const questionsToApprove = questions.filter(q => q.status !== 'change_requested');
        
        if (questionsToApprove.length > 0) {
          const approveUpdates = questionsToApprove.map(q => ({
            question_id: q.question_id,
            status: 'approved'
          }));
          await Question.bulkUpdateStatus(approveUpdates);
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Moderation report submitted successfully. Paper ${final_decision}.`,
        data: {
          moderation: updatedModeration,
          paper_status: paperStatus
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
    res.status(500).json({
      success: false,
      message: error.message
    });
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
      return res.status(403).json({
        success: false,
        message: "Access denied. Moderator role required."
      });
    }

    const moderations = await Moderation.getByModerator(moderatorId);

    res.json({
      success: true,
      data: moderations,
      count: moderations.length
    });
  } catch (error) {
    console.error("getModerationHistory error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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
      return res.status(403).json({
        success: false,
        message: "Access denied. Moderator role required."
      });
    }

    // Verify moderator has access to this paper
    const moderation = await Moderation.findByPaper(id);
    if (!moderation || moderation.moderator_id !== moderatorId) {
      return res.status(403).json({
        success: false,
        message: "You are not moderating this paper"
      });
    }

    const coBreakdown = await Question.getQuestionsByCO(id);

    res.json({
      success: true,
      data: coBreakdown
    });
  } catch (error) {
    console.error("getCOBreakdown error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};