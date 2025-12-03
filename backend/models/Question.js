// backend/models/Question.js
import { pool } from '../config/db.js';

export class Question {
  // Static methods for database operations

  static async create(questionData, client = null) {
    const executor = client || pool;
    const { 
      paper_id, 
      content_html, 
      co_id, 
      marks = null, // NEW FIELD
      status = 'draft', 
      sequence_number = null 
    } = questionData;

    // Basic validation
    if (!content_html) {
      throw new Error('content_html is required');
    }

    // Validate marks if provided
    if (marks !== null && marks !== undefined) {
      if (typeof marks !== 'number' || marks < 0) {
        throw new Error('marks must be a non-negative number');
      }
    }

    if (paper_id) {
      // Check paper exists AND validate status
      const paperCheck = await executor.query(
        'SELECT paper_id, status FROM question_papers WHERE paper_id = $1 LIMIT 1', 
        [paper_id]
      );
      if (!paperCheck.rows.length) {
        throw new Error('paper_id not found');
      }
      
      // Validate paper status for adding questions
      const paperStatus = paperCheck.rows[0].status;
      if (!['draft', 'change_requested'].includes(paperStatus)) {
        throw new Error(`Questions cannot be added. Paper status: ${paperStatus}. Only papers in 'draft' or 'change_requested' status can have questions added.`);
      }
    }

    const query = `
      INSERT INTO questions (paper_id, content_html, co_id, marks, status, sequence_number, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING question_id, paper_id, content_html, co_id, marks, status, sequence_number, created_at, updated_at
    `;

    const values = [paper_id || null, content_html, co_id || null, marks, status, sequence_number];
    const result = await executor.query(query, values);
    return result.rows[0];
  }

  static async update(questionId, questionData, client = null) {
    if (!questionId) throw new Error('Invalid questionId');

    const executor = client || pool;

    // First get the question to find paper_id and validate paper status
    const existingQuestion = await executor.query(
      'SELECT paper_id FROM questions WHERE question_id = $1', 
      [questionId]
    );
    if (!existingQuestion.rows.length) {
      throw new Error('Question not found');
    }

    const paperId = existingQuestion.rows[0].paper_id;

    // Validate paper status for editing questions
    if (paperId) {
      const paperCheck = await executor.query(
        'SELECT status FROM question_papers WHERE paper_id = $1', 
        [paperId]
      );
      if (paperCheck.rows.length) {
        const paperStatus = paperCheck.rows[0].status;
        if (!['draft', 'change_requested'].includes(paperStatus)) {
          throw new Error(`Questions cannot be edited. Paper status: ${paperStatus}. Only papers in 'draft' or 'change_requested' status can have questions edited.`);
        }
      }
    }

    // Validate marks if provided
    if (Object.prototype.hasOwnProperty.call(questionData, 'marks')) {
      if (questionData.marks !== null && questionData.marks !== undefined) {
        if (typeof questionData.marks !== 'number' || questionData.marks < 0) {
          throw new Error('marks must be a non-negative number or null');
        }
      }
    }

    // Validate status if provided
    if (Object.prototype.hasOwnProperty.call(questionData, 'status')) {
      const allowedStatuses = ['draft', 'submitted', 'under_review', 'change_requested', 'approved'];
      if (!allowedStatuses.includes(questionData.status)) {
        throw new Error(`Invalid status. Allowed: ${allowedStatuses.join(', ')}`);
      }
    }

    // Allowed updatable fields (added marks)
    const allowed = ['paper_id', 'content_html', 'co_id', 'marks', 'status', 'sequence_number'];

    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(questionData, key) && questionData[key] !== undefined) {
        setClauses.push(`${key} = $${idx++}`);
        values.push(questionData[key] === '' ? null : questionData[key]);
      }
    }

    if (setClauses.length === 0) {
      return existingQuestion.rows[0];
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    const query = `
      UPDATE questions
      SET ${setClauses.join(', ')}
      WHERE question_id = $${idx}
      RETURNING question_id, paper_id, content_html, co_id, marks, status, sequence_number, created_at, updated_at
    `;
    values.push(questionId);

    const result = await executor.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Question not found');
    }
    return result.rows[0];
  }

  static async findById(questionId) {
    const query = `
      SELECT q.*, 
             co.co_number, 
             co.description as co_description,
             c.course_id,
             c.code as course_code,
             c.title as course_title
      FROM questions q
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      LEFT JOIN question_papers qp ON q.paper_id = qp.paper_id
      LEFT JOIN courses c ON qp.course_id = c.course_id
      WHERE q.question_id = $1
    `;
    
    const result = await pool.query(query, [questionId]);
    return result.rows[0];
  }

  static async findByPaperId(paperId) {
    const query = `
      SELECT q.*, 
             co.co_number, 
             co.description as co_description
      FROM questions q
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      WHERE q.paper_id = $1
      ORDER BY q.sequence_number NULLS LAST, q.question_id
    `;
    
    const result = await pool.query(query, [paperId]);
    return result.rows;
  }

  static async delete(questionId, client = null) {
    const executor = client || pool;

    // First get the question to find paper_id and validate paper status
    const existingQuestion = await executor.query(
      'SELECT paper_id FROM questions WHERE question_id = $1', 
      [questionId]
    );
    if (!existingQuestion.rows.length) {
      throw new Error('Question not found');
    }

    const paperId = existingQuestion.rows[0].paper_id;

    // Validate paper status for deleting questions
    if (paperId) {
      const paperCheck = await executor.query(
        'SELECT status FROM question_papers WHERE paper_id = $1', 
        [paperId]
      );
      if (paperCheck.rows.length) {
        const paperStatus = paperCheck.rows[0].status;
        if (!['draft', 'change_requested'].includes(paperStatus)) {
          throw new Error(`Questions cannot be deleted. Paper status: ${paperStatus}. Only papers in 'draft' or 'change_requested' status can have questions deleted.`);
        }
      }
    }

    const query = 'DELETE FROM questions WHERE question_id = $1 RETURNING question_id';
    const result = await executor.query(query, [questionId]);
    return result.rows[0];
  }

  static async updateSequenceNumbers(paperId, sequenceUpdates, client = null) {
    const executor = client || pool;

    // Validate paper status for sequence editing
    const paperCheck = await executor.query(
      'SELECT status FROM question_papers WHERE paper_id = $1', 
      [paperId]
    );
    if (!paperCheck.rows.length) {
      throw new Error('Paper not found');
    }

    const paperStatus = paperCheck.rows[0].status;
    if (!['draft', 'change_requested'].includes(paperStatus)) {
      throw new Error(`Sequence numbers cannot be edited. Paper status: ${paperStatus}. Only papers in 'draft' or 'change_requested' status can have sequence numbers edited.`);
    }

    const clientProvided = Boolean(client);

    const run = async () => {
      for (const update of sequenceUpdates) {
        await executor.query(
          'UPDATE questions SET sequence_number = $1 WHERE question_id = $2 AND paper_id = $3',
          [update.sequence_number, update.question_id, paperId]
        );
      }
    };

    if (clientProvided) {
      await run();
      return { success: true, updated: sequenceUpdates.length };
    } else {
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        for (const update of sequenceUpdates) {
          await c.query(
            'UPDATE questions SET sequence_number = $1 WHERE question_id = $2 AND paper_id = $3',
            [update.sequence_number, update.question_id, paperId]
          );
        }
        await c.query('COMMIT');
        return { success: true, updated: sequenceUpdates.length };
      } catch (error) {
        await c.query('ROLLBACK');
        throw error;
      } finally {
        c.release();
      }
    }
  }

  static extractMediaUrls(htmlContent) {
    const mediaUrls = [];
    if (!htmlContent) return mediaUrls;

    // Accept absolute (http(s)://...) and root-relative (/uploads/...) URLs
    const imgRegex = /<img[^>]+src=["']((?:https?:\/\/|\/)[^"']+)["'][^>]*>/gi;
    let match;

    while ((match = imgRegex.exec(htmlContent)) !== null) {
      if (match[1]) {
        mediaUrls.push(match[1]);
      }
    }

    return mediaUrls;
  }

  static async linkMedia(questionId, mediaUrls, client = null) {
    if (!mediaUrls || mediaUrls.length === 0) return;

    const executor = client || pool;
    for (const mediaUrl of mediaUrls) {
      await executor.query(
        `UPDATE question_media 
         SET question_id = $1, is_used = TRUE 
         WHERE media_url = $2 AND (question_id IS NULL OR question_id = $1)`,
        [questionId, mediaUrl]
      );
    }
  }

  static async unlinkUnusedMedia(questionId, currentMediaUrls = [], client = null) {
    const executor = client || pool;

    let query = `
      UPDATE question_media 
      SET question_id = NULL, is_used = FALSE 
      WHERE question_id = $1
    `;
    
    const params = [questionId];

    if (currentMediaUrls.length > 0) {
      query += ` AND media_url NOT IN (${currentMediaUrls.map((_, i) => `$${i + 2}`).join(', ')})`;
      params.push(...currentMediaUrls);
    }

    await executor.query(query, params);
  }

  static async getQuestionMedia(questionId) {
    const query = `
      SELECT media_id, media_url, media_type, is_used, created_at
      FROM question_media
      WHERE question_id = $1 AND deleted_at IS NULL
      ORDER BY created_at
    `;
    
    const result = await pool.query(query, [questionId]);
    return result.rows;
  }

  static async search(filters = {}) {
    const {
      paper_id,
      co_id,
      status,
      course_id,
      page = 1,
      limit = 25
    } = filters;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (paper_id) {
      paramCount++;
      whereConditions.push(`q.paper_id = $${paramCount}`);
      queryParams.push(paper_id);
    }

    if (co_id) {
      paramCount++;
      whereConditions.push(`q.co_id = $${paramCount}`);
      queryParams.push(co_id);
    }

    if (status) {
      paramCount++;
      whereConditions.push(`q.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (course_id) {
      paramCount++;
      whereConditions.push(`qp.course_id = $${paramCount}`);
      queryParams.push(course_id);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM questions q
      LEFT JOIN question_papers qp ON q.paper_id = qp.paper_id
      ${whereClause}
    `;

    // Main query
    const mainQuery = `
      SELECT q.*, 
             co.co_number, 
             co.description as co_description,
             qp.course_id,
             c.code as course_code,
             c.title as course_title,
             u.name as created_by_name
      FROM questions q
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      LEFT JOIN question_papers qp ON q.paper_id = qp.paper_id
      LEFT JOIN courses c ON qp.course_id = c.course_id
      LEFT JOIN users u ON qp.created_by = u.user_id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    const offset = (page - 1) * limit;
    queryParams.push(limit, offset);

    const [countResult, questionsResult] = await Promise.all([
      pool.query(countQuery, queryParams.slice(0, paramCount)),
      pool.query(mainQuery, queryParams)
    ]);

    return {
      questions: questionsResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page,
        limit,
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  }
  
  static async getNextSequenceNumber(paperId) {
    const query = `
      SELECT COALESCE(MAX(sequence_number), 0) + 1 as next_sequence
      FROM questions 
      WHERE paper_id = $1
    `;
    const result = await pool.query(query, [paperId]);
    return result.rows[0].next_sequence;
  }

  static async validatePaperAccess(paperId, userId) {
    const query = `
      SELECT paper_id FROM question_papers 
      WHERE paper_id = $1 AND created_by = $2
    `;
    const result = await pool.query(query, [paperId, userId]);
    return result.rows.length > 0;
  }

  static async validateCOForPaper(coId, paperId) {
    const query = `
      SELECT co.co_id 
      FROM course_outcomes co
      JOIN question_papers qp ON co.course_id = qp.course_id
      WHERE co.co_id = $1 AND qp.paper_id = $2
    `;
    const result = await pool.query(query, [coId, paperId]);
    return result.rows.length > 0;
  }

  static async updateQuestionStatus(questionId, status, client = null) {
    const allowedStatuses = ['draft', 'submitted', 'under_review', 'change_requested', 'approved'];
    
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${allowedStatuses.join(', ')}`);
    }

    const executor = client || pool;

    const query = `
      UPDATE questions
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE question_id = $2
      RETURNING question_id, paper_id, status, updated_at
    `;

    const { rows } = await executor.query(query, [status, questionId]);
    if (!rows.length) throw new Error('Question not found');
    return rows[0];
  }

  static async getQuestionsForModeration(paperId) {
    const query = `
      SELECT 
        q.question_id, q.paper_id, q.content_html, q.marks, q.status, q.sequence_number,
        q.created_at, q.updated_at,
        co.co_id, co.co_number, co.description as co_description,
        c.course_id, c.code as course_code, c.title as course_title
      FROM questions q
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      LEFT JOIN question_papers qp ON q.paper_id = qp.paper_id
      LEFT JOIN courses c ON qp.course_id = c.course_id
      WHERE q.paper_id = $1
      ORDER BY q.sequence_number, q.question_id
    `;

    const { rows } = await pool.query(query, [paperId]);
    return rows;
  }

  static async bulkUpdateStatus(questionUpdates, client = null) {
    if (!Array.isArray(questionUpdates) || questionUpdates.length === 0) {
      throw new Error('Question updates array is required');
    }

    const executor = client || pool;
    const clientProvided = Boolean(client);

    if (!clientProvided) {
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        const results = [];
        for (const update of questionUpdates) {
          const { question_id, status } = update;
          
          if (!question_id || !status) {
            throw new Error('Each update must have question_id and status');
          }

          const result = await c.query(
            `UPDATE questions
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE question_id = $2
            RETURNING question_id, status, updated_at`,
            [status, question_id]
          );
          results.push(result.rows[0]);
        }
        await c.query('COMMIT');
        return results;
      } catch (error) {
        await c.query('ROLLBACK');
        throw error;
      } finally {
        c.release();
      }
    } else {
      const results = [];
      for (const update of questionUpdates) {
        const { question_id, status } = update;
        
        if (!question_id || !status) {
          throw new Error('Each update must have question_id and status');
        }

        const result = await executor.query(
          `UPDATE questions
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE question_id = $2
          RETURNING question_id, status, updated_at`,
          [status, question_id]
        );
        results.push(result.rows[0]);
      }
      return results;
    }
  }

  static async getQuestionsByCO(paperId) {
    const query = `
      SELECT 
        co.co_id,
        co.co_number,
        co.description as co_description,
        COUNT(q.question_id) as total_questions,
        COUNT(CASE WHEN q.status = 'approved' THEN 1 END) as approved_questions,
        COUNT(CASE WHEN q.status = 'change_requested' THEN 1 END) as change_requested_questions,
        SUM(q.marks) as total_marks, -- NEW: Calculate total marks per CO
        json_agg(
          jsonb_build_object(
            'question_id', q.question_id,
            'sequence_number', q.sequence_number,
            'marks', q.marks, -- NEW: Include marks in JSON
            'content_preview', SUBSTRING(q.content_html FROM 1 FOR 100),
            'status', q.status,
            'created_at', q.created_at
          ) ORDER BY q.sequence_number NULLS LAST
        ) FILTER (WHERE q.question_id IS NOT NULL) as questions
      FROM course_outcomes co
      JOIN (SELECT course_id FROM question_papers WHERE paper_id = $1 LIMIT 1) qp_course
        ON co.course_id = qp_course.course_id
      LEFT JOIN questions q ON co.co_id = q.co_id AND q.paper_id = $1
      GROUP BY co.co_id, co.co_number, co.description
      ORDER BY co.co_number
    `;

    const { rows } = await pool.query(query, [paperId]);
    return rows;
  }

  static async getCOsForPaper(paperId) {
    if (!paperId) throw new Error('paper_id is required');
    
    const query = `
      SELECT co.co_id, co.co_number, co.description
      FROM course_outcomes co
      JOIN question_papers qp ON co.course_id = qp.course_id
      WHERE qp.paper_id = $1
      ORDER BY co.co_number
    `;
    
    const result = await pool.query(query, [paperId]);
    return result.rows;
  }

  // NEW METHOD: Calculate total marks for a paper
  static async getTotalMarksForPaper(paperId) {
    const query = `
      SELECT COALESCE(SUM(marks), 0) as total_marks
      FROM questions
      WHERE paper_id = $1 AND status != 'draft'
    `;
    
    const result = await pool.query(query, [paperId]);
    return parseInt(result.rows[0].total_marks) || 0;
  }

  // NEW METHOD: Get marks distribution by CO
  static async getMarksDistribution(paperId) {
    const query = `
      SELECT 
        co.co_number,
        COALESCE(SUM(q.marks), 0) as total_marks,
        COUNT(q.question_id) as question_count
      FROM course_outcomes co
      LEFT JOIN questions q ON co.co_id = q.co_id AND q.paper_id = $1
      WHERE co.course_id = (SELECT course_id FROM question_papers WHERE paper_id = $1)
      GROUP BY co.co_id, co.co_number
      ORDER BY co.co_number
    `;
    
    const result = await pool.query(query, [paperId]);
    return result.rows;
  }
}