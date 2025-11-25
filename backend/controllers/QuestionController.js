import { Question } from "../models/Question.js";
import { pool } from "../config/db.js";

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
  try {
    const { content_html, paper_id, co_id } = req.body;
    const userId = req.user.user_id;

    // Validate required fields
    if (!content_html || !paper_id) {
      return res.status(400).json({ error: "content_html and paper_id are required" });
    }

    // Validate paper access
    const hasPaperAccess = await Question.validatePaperAccess(paper_id, userId);
    if (!hasPaperAccess) {
      return res.status(403).json({ error: "Invalid paper or access denied" });
    }

    // Validate CO if provided
    if (co_id) {
      const isValidCO = await Question.validateCOForPaper(co_id, paper_id);
      if (!isValidCO) {
        return res.status(400).json({ error: "Invalid CO for this paper's course" });
      }
    }

    // Get next sequence number
    const sequence_number = await Question.getNextSequenceNumber(paper_id);

    // Create question (always set status to 'draft')
    const question = await Question.create({
      paper_id,
      content_html,
      co_id: co_id || null,
      sequence_number,
      status: 'draft' // Always draft, ignore user input
    });

    // Extract and link media
    const mediaUrls = Question.extractMediaUrls(content_html);
    await Question.linkMedia(question.question_id, mediaUrls);

    res.status(201).json({
      success: true,
      question,
      message: "Question created successfully"
    });

  } catch (err) {
    console.error("createQuestion error:", err);
    res.status(500).json({ error: "Server error while creating question" });
  }
};

/**
 * Update an existing question
 */
export const updateQuestion = async (req, res) => {
  logRequest(req);
  const client = await pool.connect();
  try {
    const questionId = parseInt(req.params.id, 10);
    if (Number.isNaN(questionId)) {
      return res.status(400).json({ error: "Invalid question ID" });
    }

    const {
      content_html,
      paper_id: incomingPaperId,
      co_id: incomingCoId,
      status: incomingStatus,
      sequence_number: incomingSequenceNumber
    } = req.body;

    if (!content_html) {
      return res.status(400).json({ error: "content_html is required" });
    }

    // Load existing question
    const existingRes = await Question.findById(questionId);
    if (!existingRes) {
      return res.status(404).json({ error: "Question not found" });
    }

    await client.query('BEGIN');

    // Validate paper_id if provided
    let paperIdToUse = existingRes.paper_id;
    if (incomingPaperId !== undefined && incomingPaperId !== null) {
      const pid = parseInt(incomingPaperId, 10);
      if (Number.isNaN(pid)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "Invalid paper_id" });
      }
      const hasAccess = await Question.validatePaperAccess(pid, req.user.user_id);
      if (!hasAccess) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "Invalid paper or access denied" });
      }
      paperIdToUse = pid;
    }

    // Validate co_id if provided
    if (incomingCoId !== undefined && incomingCoId !== null && incomingCoId !== '') {
      const coid = parseInt(incomingCoId, 10);
      if (Number.isNaN(coid)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "Invalid co_id" });
      }
      const isValid = await Question.validateCOForPaper(coid, paperIdToUse);
      if (!isValid) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "Invalid CO for this paper's course" });
      }
    }

    // Determine sequence number
    let seqToUse = (incomingSequenceNumber !== undefined) ? incomingSequenceNumber : existingRes.sequence_number;
    if ((incomingSequenceNumber === undefined || incomingSequenceNumber === null) && incomingPaperId && incomingPaperId !== existingRes.paper_id) {
      seqToUse = await Question.getNextSequenceNumber(paperIdToUse);
    }

    // Build update payload with only provided fields
    const updatePayload = {
      content_html,
      ...(incomingPaperId !== undefined ? { paper_id: paperIdToUse } : {}),
      ...(incomingCoId !== undefined ? { co_id: incomingCoId === '' ? null : incomingCoId } : {}),
      ...(incomingStatus !== undefined ? { status: incomingStatus } : {}),
      ...(incomingSequenceNumber !== undefined ? { sequence_number: incomingSequenceNumber } : (seqToUse !== undefined ? { sequence_number: seqToUse } : {}))
    };

    const updatedQuestion = await Question.update(questionId, updatePayload);

    // Reconcile media
    const mediaUrls = Question.extractMediaUrls(content_html || '');
    await Question.linkMedia(questionId, mediaUrls);
    await Question.unlinkUnusedMedia(questionId, mediaUrls);

    await client.query('COMMIT');

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
    try { await client.query('ROLLBACK'); } catch (e) {}
    console.error("updateQuestion error:", err?.stack ?? err?.message ?? err);
    if (err.message === 'Question not found') {
      return res.status(404).json({ error: "Question not found" });
    }
    return res.status(500).json({ error: "Server error while updating question" });
  } finally {
    client.release();
  }
};


/**
 * Get question by ID
 */
export const getQuestion = async (req, res) => {
  logRequest(req);
  try {
    const questionId = parseInt(req.params.id);

    if (isNaN(questionId)) {
      return res.status(400).json({ error: "Invalid question ID" });
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Get associated media
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
    const paperId = parseInt(req.params.paperId);

    if (isNaN(paperId)) {
      return res.status(400).json({ error: "Invalid paper ID" });
    }

    const questions = await Question.findByPaperId(paperId);

    return res.json({
      success: true,
      questions: questions,
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
    const questionId = parseInt(req.params.id);

    if (isNaN(questionId)) {
      return res.status(400).json({ error: "Invalid question ID" });
    }

    const deletedQuestion = await Question.delete(questionId);

    if (!deletedQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }

    console.log('Question deleted:', {
      questionId: questionId,
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
      paper_id: paper_id ? parseInt(paper_id) : undefined,
      co_id: co_id ? parseInt(co_id) : undefined,
      status,
      course_id: course_id ? parseInt(course_id) : undefined,
      page: parseInt(page),
      limit: parseInt(limit)
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
    const paperId = parseInt(req.params.paperId);
    const { sequence_updates } = req.body;

    if (isNaN(paperId)) {
      return res.status(400).json({ error: "Invalid paper ID" });
    }

    if (!Array.isArray(sequence_updates) || sequence_updates.length === 0) {
      return res.status(400).json({ error: "sequence_updates array is required" });
    }

    // Validate each update
    for (const update of sequence_updates) {
      if (!update.question_id || typeof update.sequence_number !== 'number') {
        return res.status(400).json({ error: "Each update must have question_id and sequence_number" });
      }
    }

    const result = await Question.updateSequenceNumbers(paperId, sequence_updates);

    console.log('Question sequence updated:', {
      paperId: paperId,
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