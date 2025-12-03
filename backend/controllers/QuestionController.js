// backend/controllers/QuestionController.js
import { Question } from "../models/Question.js";

/**
 * Lightweight request logger for questions endpoints
 */
const logRequest = (req) => {
  console.log('Questions request:', {
    method: req.method,
    path: req.path,
    userId: req.user?.user_id,
    timestamp: new Date().toISOString()
  });
};

/**
 * Create a new question
 */
export const createQuestion = async (req, res) => {
  logRequest(req);
  try {
    const { content_html, paper_id: paperIdRaw, co_id: coIdRaw, marks: marksRaw } = req.body;
    const userId = req.user?.user_id;

    if (!content_html || !paperIdRaw) {
      return res.status(400).json({ error: "content_html and paper_id are required" });
    }

    const paperId = Number.isInteger(Number(paperIdRaw)) ? parseInt(paperIdRaw, 10) : NaN;
    if (Number.isNaN(paperId)) {
      return res.status(400).json({ error: "Invalid paper_id" });
    }

    // Validate marks if provided
    let marks = null;
    if (marksRaw !== undefined && marksRaw !== null && marksRaw !== '') {
      const marksParsed = Number.isInteger(Number(marksRaw)) ? parseInt(marksRaw, 10) : NaN;
      if (Number.isNaN(marksParsed) || marksParsed < 0) {
        return res.status(400).json({ error: "marks must be a non-negative integer" });
      }
      marks = marksParsed;
    }

    // Validate paper access (model helper uses pool)
    const hasPaperAccess = await Question.validatePaperAccess(paperId, userId);
    if (!hasPaperAccess) {
      return res.status(403).json({ error: "Invalid paper or access denied" });
    }

    // Validate CO if provided
    let coId = null;
    if (coIdRaw !== undefined && coIdRaw !== null && coIdRaw !== '') {
      const coIdParsed = Number.isInteger(Number(coIdRaw)) ? parseInt(coIdRaw, 10) : NaN;
      if (Number.isNaN(coIdParsed)) {
        return res.status(400).json({ error: "Invalid co_id" });
      }
      const isValidCO = await Question.validateCOForPaper(coIdParsed, paperId);
      if (!isValidCO) {
        return res.status(400).json({ error: "Invalid CO for this paper's course" });
      }
      coId = coIdParsed;
    }

    // Get next sequence number (model helper)
    const sequence_number = await Question.getNextSequenceNumber(paperId);

    // Use the Question.create() method which validates paper status
    const questionData = {
      paper_id: paperId,
      content_html,
      co_id: coId,
      marks, // NEW: Add marks to question data
      status: 'draft',
      sequence_number
    };

    const question = await Question.create(questionData);

    // Extract and link media
    const mediaUrls = Question.extractMediaUrls(content_html || '');
    if (mediaUrls.length > 0) {
      await Question.linkMedia(question.question_id, mediaUrls);
    }

    res.status(201).json({
      success: true,
      question,
      message: "Question created successfully"
    });

  } catch (err) {
    console.error("createQuestion error:", err?.stack ?? err?.message ?? err);
    
    // Handle specific validation errors
    if (err.message.includes('Questions cannot be added') || 
        err.message.includes('Paper status:')) {
      return res.status(400).json({ error: err.message });
    }
    
    return res.status(500).json({ error: "Server error while creating question" });
  }
};

/**
 * Update an existing question (transactional)
 */
export const updateQuestion = async (req, res) => {
  logRequest(req);

  try {
    const questionIdRaw = req.params.id;
    const questionId = Number.isInteger(Number(questionIdRaw)) ? parseInt(questionIdRaw, 10) : NaN;
    if (Number.isNaN(questionId)) {
      return res.status(400).json({ error: "Invalid question ID" });
    }

    const {
      content_html,
      paper_id: incomingPaperIdRaw,
      co_id: incomingCoIdRaw,
      marks: incomingMarksRaw, // NEW: Add marks to destructuring
      status: incomingStatus,
      sequence_number: incomingSequenceNumberRaw
    } = req.body;

    if (!content_html) {
      return res.status(400).json({ error: "content_html is required" });
    }

    // Load existing question to validate ownership/access
    const existingQuestion = await Question.findById(questionId);
    if (!existingQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Validate paper access if changing paper_id
    if (incomingPaperIdRaw !== undefined && incomingPaperIdRaw !== null && incomingPaperIdRaw !== '') {
      const pid = Number.isInteger(Number(incomingPaperIdRaw)) ? parseInt(incomingPaperIdRaw, 10) : NaN;
      if (Number.isNaN(pid)) {
        return res.status(400).json({ error: "Invalid paper_id" });
      }
      const hasAccess = await Question.validatePaperAccess(pid, req.user.user_id);
      if (!hasAccess) {
        return res.status(403).json({ error: "Invalid paper or access denied" });
      }
    }

    // Validate co_id if provided
    let coIdToUse = existingQuestion.co_id;
    if (incomingCoIdRaw !== undefined) {
      if (incomingCoIdRaw === '' || incomingCoIdRaw === null) {
        coIdToUse = null;
      } else {
        const coid = Number.isInteger(Number(incomingCoIdRaw)) ? parseInt(incomingCoIdRaw, 10) : NaN;
        if (Number.isNaN(coid)) {
          return res.status(400).json({ error: "Invalid co_id" });
        }
        const paperIdForValidation = incomingPaperIdRaw ? parseInt(incomingPaperIdRaw, 10) : existingQuestion.paper_id;
        const isValid = await Question.validateCOForPaper(coid, paperIdForValidation);
        if (!isValid) {
          return res.status(400).json({ error: "Invalid CO for this paper's course" });
        }
        coIdToUse = coid;
      }
    }

    // Validate marks if provided
    let marksToUse = existingQuestion.marks;
    if (incomingMarksRaw !== undefined) {
      if (incomingMarksRaw === '' || incomingMarksRaw === null) {
        marksToUse = null;
      } else {
        const marksParsed = Number.isInteger(Number(incomingMarksRaw)) ? parseInt(incomingMarksRaw, 10) : NaN;
        if (Number.isNaN(marksParsed) || marksParsed < 0) {
          return res.status(400).json({ error: "marks must be a non-negative integer or null" });
        }
        marksToUse = marksParsed;
      }
    }

    // Determine sequence number
    let seqToUse = existingQuestion.sequence_number;
    const incomingSeqIsProvided = incomingSequenceNumberRaw !== undefined && incomingSequenceNumberRaw !== null && incomingSequenceNumberRaw !== '';
    if (incomingSeqIsProvided) {
      const seqParsed = Number.isInteger(Number(incomingSequenceNumberRaw)) ? parseInt(incomingSequenceNumberRaw, 10) : NaN;
      if (Number.isNaN(seqParsed) || seqParsed < 0) {
        return res.status(400).json({ error: "Invalid sequence_number" });
      }
      seqToUse = seqParsed;
    }

    // Validate status if provided
    const allowedQuestionStatuses = ['draft', 'submitted', 'under_review', 'change_requested', 'approved'];
    let statusToUse = existingQuestion.status;
    if (incomingStatus !== undefined && incomingStatus !== null && incomingStatus !== '') {
      if (!allowedQuestionStatuses.includes(incomingStatus)) {
        return res.status(400).json({ error: `Invalid status. Allowed: ${allowedQuestionStatuses.join(', ')}` });
      }
      statusToUse = incomingStatus;
    }

    // Prepare update data
    const updateData = {
      content_html,
      co_id: coIdToUse,
      marks: marksToUse, // NEW: Add marks to update data
      status: statusToUse,
      sequence_number: seqToUse
    };

    // Add paper_id if changing
    if (incomingPaperIdRaw !== undefined && incomingPaperIdRaw !== null && incomingPaperIdRaw !== '') {
      const pid = Number.isInteger(Number(incomingPaperIdRaw)) ? parseInt(incomingPaperIdRaw, 10) : NaN;
      if (!Number.isNaN(pid)) {
        updateData.paper_id = pid;
      }
    }

    // Use Question.update() method which validates paper status
    const updatedQuestion = await Question.update(questionId, updateData);

    // Handle media linking/unlinking
    const mediaUrls = Question.extractMediaUrls(content_html || '');
    
    if (mediaUrls.length > 0) {
      await Question.linkMedia(questionId, mediaUrls);
    }
    
    // Unlink media not in current content
    await Question.unlinkUnusedMedia(questionId, mediaUrls);

    console.log('Question updated:', {
      questionId: updatedQuestion.question_id,
      mediaUrlsCount: mediaUrls.length,
      userId: req.user.user_id
    });

    return res.json({
      success: true,
      question: updatedQuestion,
      message: "Question updated successfully"
    });

  } catch (err) {
    console.error("updateQuestion error:", err?.stack ?? err?.message ?? err);
    
    // Handle specific validation errors
    if (err.message.includes('Questions cannot be edited') || 
        err.message.includes('Paper status:')) {
      return res.status(400).json({ error: err.message });
    }
    
    if (err.message === 'Question not found') {
      return res.status(404).json({ error: "Question not found" });
    }
    
    return res.status(500).json({ error: "Server error while updating question" });
  }
};

/**
 * Get question by ID
 */
export const getQuestion = async (req, res) => {
  logRequest(req);
  try {
    const questionIdRaw = req.params.id;
    const questionId = Number.isInteger(Number(questionIdRaw)) ? parseInt(questionIdRaw, 10) : NaN;
    if (Number.isNaN(questionId)) {
      return res.status(400).json({ error: "Invalid question ID" });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const media = await Question.getQuestionMedia(questionId);

    return res.json({
      success: true,
      question: {
        ...question,
        media
      }
    });

  } catch (err) {
    console.error("getQuestion error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while fetching question" });
  }
};

/**
 * Get questions by paper ID
 */
export const getQuestionsByPaper = async (req, res) => {
  logRequest(req);
  try {
    const paperIdRaw = req.params.paperId;
    const paperId = Number.isInteger(Number(paperIdRaw)) ? parseInt(paperIdRaw, 10) : NaN;

    if (Number.isNaN(paperId)) {
      return res.status(400).json({ error: "Invalid paper ID" });
    }

    const questions = await Question.findByPaperId(paperId);

    return res.json({
      success: true,
      questions,
      count: questions.length
    });

  } catch (err) {
    console.error("getQuestionsByPaper error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while fetching questions" });
  }
};

/**
 * Delete a question
 */
export const deleteQuestion = async (req, res) => {
  logRequest(req);
  try {
    const questionIdRaw = req.params.id;
    const questionId = Number.isInteger(Number(questionIdRaw)) ? parseInt(questionIdRaw, 10) : NaN;

    if (Number.isNaN(questionId)) {
      return res.status(400).json({ error: "Invalid question ID" });
    }

    const deletedQuestion = await Question.delete(questionId);

    if (!deletedQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }

    console.log('Question deleted:', {
      questionId,
      userId: req.user.user_id
    });

    return res.json({
      success: true,
      message: "Question deleted successfully"
    });

  } catch (err) {
    console.error("deleteQuestion error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while deleting question" });
  }
};

/**
 * Search questions with filters
 */
export const searchQuestions = async (req, res) => {
  logRequest(req);
  try {
    const {
      paper_id,
      co_id,
      status,
      course_id,
      page = 1,
      limit = 25
    } = req.query;

    const filters = {
      paper_id: paper_id ? parseInt(paper_id, 10) : undefined,
      co_id: co_id ? parseInt(co_id, 10) : undefined,
      status,
      course_id: course_id ? parseInt(course_id, 10) : undefined,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };

    const result = await Question.search(filters);

    return res.json({
      success: true,
      ...result
    });

  } catch (err) {
    console.error("searchQuestions error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while searching questions" });
  }
};

/**
 * Update question sequence numbers
 */
export const updateQuestionSequence = async (req, res) => {
  logRequest(req);
  try {
    const paperIdRaw = req.params.paperId;
    const paperId = Number.isInteger(Number(paperIdRaw)) ? parseInt(paperIdRaw, 10) : NaN;
    const { sequence_updates } = req.body;

    if (Number.isNaN(paperId)) {
      return res.status(400).json({ error: "Invalid paper ID" });
    }

    if (!Array.isArray(sequence_updates) || sequence_updates.length === 0) {
      return res.status(400).json({ error: "sequence_updates array is required" });
    }

    // Validate each update
    for (const update of sequence_updates) {
      const qid = update.question_id;
      const sn = update.sequence_number;
      if (!Number.isInteger(Number(qid)) || !Number.isInteger(Number(sn))) {
        return res.status(400).json({ error: "Each update must have integer question_id and sequence_number" });
      }
    }

    const result = await Question.updateSequenceNumbers(paperId, sequence_updates);

    console.log('Question sequence updated:', {
      paperId,
      updatedCount: result.updated,
      userId: req.user.user_id
    });

    return res.json({
      success: true,
      message: "Question sequence updated successfully",
      ...result
    });

  } catch (err) {
    console.error("updateQuestionSequence error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while updating question sequence" });
  }
};

export const getPaperCOs = async (req, res) => {
  logRequest(req);
  try {
    const paperIdRaw = req.params.paperId;
    const paperId = Number.isInteger(Number(paperIdRaw)) ? parseInt(paperIdRaw, 10) : NaN;
    
    if (Number.isNaN(paperId)) {
      return res.status(400).json({ error: "Invalid paper ID" });
    }

    // Optional: Validate user has access to this paper
    if (req.user?.user_id) {
      const hasAccess = await Question.validatePaperAccess(paperId, req.user.user_id);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this paper" });
      }
    }

    const cos = await Question.getCOsForPaper(paperId);
    
    return res.json({
      success: true,
      cos,
      count: cos.length
    });

  } catch (err) {
    console.error("getPaperCOs error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while fetching course outcomes" });
  }
};