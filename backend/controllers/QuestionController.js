// backend/controllers/QuestionController.js
import { pool } from "../config/db.js";
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
    const { content_html, paper_id: paperIdRaw, co_id: coIdRaw } = req.body;
    const userId = req.user?.user_id;

    if (!content_html || !paperIdRaw) {
      return res.status(400).json({ error: "content_html and paper_id are required" });
    }

    const paperId = Number.isInteger(Number(paperIdRaw)) ? parseInt(paperIdRaw, 10) : NaN;
    if (Number.isNaN(paperId)) {
      return res.status(400).json({ error: "Invalid paper_id" });
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

    // Insert question in DB
    const insertQuery = `
      INSERT INTO questions (paper_id, content_html, co_id, status, sequence_number, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING question_id, paper_id, content_html, co_id, status, sequence_number, created_at, updated_at
    `;
    const insertValues = [paperId, content_html, coId, 'draft', sequence_number];

    const insertResult = await pool.query(insertQuery, insertValues);
    const question = insertResult.rows[0];

    // Extract and link media (best-effort). Use model helper to detect URLs.
    const mediaUrls = Question.extractMediaUrls(content_html || '');
    if (mediaUrls.length > 0) {
      // Update media rows to link them to this question
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (const mediaUrl of mediaUrls) {
  await client.query(
    `UPDATE question_media
     SET question_id = $1, is_used = TRUE
     WHERE media_url = $2 AND (question_id IS NULL OR question_id = $1)`,
    [question.question_id, mediaUrl]
  );
}
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Failed to link media during createQuestion:', err);
      } finally {
        client.release();
      }
    }

    res.status(201).json({
      success: true,
      question,
      message: "Question created successfully"
    });

  } catch (err) {
    console.error("createQuestion error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while creating question" });
  }
};

/**
 * Update an existing question (transactional)
 */
export const updateQuestion = async (req, res) => {
  logRequest(req);

  const client = await pool.connect();
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
      status: incomingStatus,
      sequence_number: incomingSequenceNumberRaw
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

    // Validate and determine paper_id to use
    let paperIdToUse = existingRes.paper_id;
    if (incomingPaperIdRaw !== undefined && incomingPaperIdRaw !== null && incomingPaperIdRaw !== '') {
      const pid = Number.isInteger(Number(incomingPaperIdRaw)) ? parseInt(incomingPaperIdRaw, 10) : NaN;
      if (Number.isNaN(pid)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "Invalid paper_id" });
      }
      // Validate access using model helper
      const hasAccess = await Question.validatePaperAccess(pid, req.user.user_id);
      if (!hasAccess) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "Invalid paper or access denied" });
      }
      paperIdToUse = pid;
    }

    // Validate co_id if provided
    let coIdToUse = existingRes.co_id;
    if (incomingCoIdRaw !== undefined) {
      if (incomingCoIdRaw === '' || incomingCoIdRaw === null) {
        coIdToUse = null;
      } else {
        const coid = Number.isInteger(Number(incomingCoIdRaw)) ? parseInt(incomingCoIdRaw, 10) : NaN;
        if (Number.isNaN(coid)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: "Invalid co_id" });
        }
        const isValid = await Question.validateCOForPaper(coid, paperIdToUse);
        if (!isValid) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: "Invalid CO for this paper's course" });
        }
        coIdToUse = coid;
      }
    }

    // Determine sequence number
    let seqToUse = existingRes.sequence_number;
    const incomingSeqIsProvided = incomingSequenceNumberRaw !== undefined && incomingSequenceNumberRaw !== null && incomingSequenceNumberRaw !== '';
    if (incomingSeqIsProvided) {
      const seqParsed = Number.isInteger(Number(incomingSequenceNumberRaw)) ? parseInt(incomingSequenceNumberRaw, 10) : NaN;
      if (Number.isNaN(seqParsed) || seqParsed < 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "Invalid sequence_number" });
      }
      seqToUse = seqParsed;
    } else {
      if (paperIdToUse !== existingRes.paper_id) {
        seqToUse = await Question.getNextSequenceNumber(paperIdToUse);
      }
    }

    // Validate status if provided
    const allowedQuestionStatuses = ['draft', 'submitted', 'under_review', 'change_requested', 'approved'];
    let statusToUse = existingRes.status;
    if (incomingStatus !== undefined && incomingStatus !== null && incomingStatus !== '') {
      if (!allowedQuestionStatuses.includes(incomingStatus)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Invalid status. Allowed: ${allowedQuestionStatuses.join(', ')}` });
      }
      statusToUse = incomingStatus;
    }

    // Build update query (use client)
    const setClauses = [];
    const values = [];
    let idx = 1;

    setClauses.push(`content_html = $${idx++}`);
    values.push(content_html);

    if (paperIdToUse !== undefined) {
      setClauses.push(`paper_id = $${idx++}`);
      values.push(paperIdToUse);
    }

    setClauses.push(`co_id = $${idx++}`);
    values.push(coIdToUse);

    setClauses.push(`status = $${idx++}`);
    values.push(statusToUse);

    setClauses.push(`sequence_number = $${idx++}`);
    values.push(seqToUse);

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateSql = `
      UPDATE questions
      SET ${setClauses.join(', ')}
      WHERE question_id = $${idx}
      RETURNING question_id, paper_id, content_html, co_id, status, sequence_number, created_at, updated_at
    `;
    values.push(questionId);

    const updateResult = await client.query(updateSql, values);
    if (!updateResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Question not found when updating" });
    }
    const updatedQuestion = updateResult.rows[0];

    // Reconcile media - FIXED: Removed updated_at from question_media queries
    const mediaUrls = Question.extractMediaUrls(content_html || '');

    if (mediaUrls.length > 0) {
      for (const mediaUrl of mediaUrls) {
        await client.query(
          `UPDATE question_media
           SET question_id = $1, is_used = TRUE
           WHERE media_url = $2 AND (question_id IS NULL OR question_id = $1)`,
          [questionId, mediaUrl]
        );
      }
    }

    if (mediaUrls.length > 0) {
      const placeholders = mediaUrls.map((_, i) => `$${i + 2}`).join(',');
      const unlinkSql = `
        UPDATE question_media
        SET question_id = NULL, is_used = FALSE
        WHERE question_id = $1 AND media_url NOT IN (${placeholders})
      `;
      await client.query(unlinkSql, [questionId, ...mediaUrls]);
    } else {
      await client.query(
        `UPDATE question_media
         SET question_id = NULL, is_used = FALSE
         WHERE question_id = $1`,
        [questionId]
      );
    }

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
