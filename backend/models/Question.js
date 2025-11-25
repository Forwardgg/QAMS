// models/Question.js
import { pool } from '../config/db.js';

export class Question {
  // Static methods for database operations

  /**
   * Create a new question
   */
  static async create(questionData) {
  const { paper_id, content_html, co_id, status = 'draft', sequence_number = null } = questionData;
  
  const query = `
    INSERT INTO questions (paper_id, content_html, co_id, status, sequence_number, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING question_id, paper_id, content_html, co_id, status, sequence_number, created_at, updated_at
  `;
  
  const values = [paper_id || null, content_html, co_id || null, status, sequence_number];
  const result = await pool.query(query, values);
  return result.rows[0];
}

  /**
   * Update an existing question
   */
  static async update(questionId, questionData) {
  const { paper_id, content_html, co_id, status, sequence_number } = questionData;
  
  const query = `
    UPDATE questions 
    SET paper_id = $1, content_html = $2, co_id = $3, status = $4, sequence_number = $5, updated_at = CURRENT_TIMESTAMP
    WHERE question_id = $6
    RETURNING question_id, paper_id, content_html, co_id, status, sequence_number, created_at, updated_at
  `;
  
  const values = [paper_id || null, content_html, co_id || null, status, sequence_number, questionId];
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    throw new Error('Question not found');
  }
  
  return result.rows[0];
}

  /**
   * Find question by ID
   */
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

  /**
   * Find questions by paper ID
   */
  static async findByPaperId(paperId) {
    const query = `
      SELECT q.*, 
             co.co_number, 
             co.description as co_description
      FROM questions q
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      WHERE q.paper_id = $1
      ORDER BY q.sequence_number, q.question_id
    `;
    
    const result = await pool.query(query, [paperId]);
    return result.rows;
  }

  /**
   * Delete a question
   */
  static async delete(questionId) {
    const query = 'DELETE FROM questions WHERE question_id = $1 RETURNING question_id';
    const result = await pool.query(query, [questionId]);
    return result.rows[0];
  }

  /**
   * Update question sequence numbers for a paper
   */
  static async updateSequenceNumbers(paperId, sequenceUpdates) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const update of sequenceUpdates) {
        await client.query(
          'UPDATE questions SET sequence_number = $1 WHERE question_id = $2 AND paper_id = $3',
          [update.sequence_number, update.question_id, paperId]
        );
      }
      
      await client.query('COMMIT');
      return { success: true, updated: sequenceUpdates.length };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Extract media URLs from HTML content
   */
  static extractMediaUrls(htmlContent) {
    const mediaUrls = [];
    if (!htmlContent) return mediaUrls;

    // Regex to find <img src="/uploads/..."> patterns
    const imgRegex = /<img[^>]+src="(\/uploads\/[^"]+)"[^>]*>/gi;
    let match;

    while ((match = imgRegex.exec(htmlContent)) !== null) {
      if (match[1]) {
        mediaUrls.push(match[1]);
      }
    }

    return mediaUrls;
  }

  /**
   * Link media to question
   */
  static async linkMedia(questionId, mediaUrls) {
    if (!mediaUrls.length) return;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update media records to link them to this question
      for (const mediaUrl of mediaUrls) {
        await client.query(
          `UPDATE question_media 
           SET question_id = $1, is_used = TRUE 
           WHERE media_url = $2 AND (question_id IS NULL OR question_id = $1)`,
          [questionId, mediaUrl]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Unlink media no longer referenced by question
   */
  static async unlinkUnusedMedia(questionId, currentMediaUrls) {
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

    await pool.query(query, params);
  }

  /**
   * Get media records for a question
   */
  static async getQuestionMedia(questionId) {
    const query = `
      SELECT media_id, media_url, media_type, caption, is_used, created_at
      FROM question_media
      WHERE question_id = $1
      ORDER BY created_at
    `;
    
    const result = await pool.query(query, [questionId]);
    return result.rows;
  }

  /**
   * Search questions with filters
   */
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
  
/**
 * Get next sequence number for a paper
 */
static async getNextSequenceNumber(paperId) {
  const query = `
    SELECT COALESCE(MAX(sequence_number), 0) + 1 as next_sequence
    FROM questions 
    WHERE paper_id = $1
  `;
  const result = await pool.query(query, [paperId]);
  return result.rows[0].next_sequence;
}

/**
 * Validate paper exists and belongs to user
 */
static async validatePaperAccess(paperId, userId) {
  const query = `
    SELECT paper_id FROM question_papers 
    WHERE paper_id = $1 AND created_by = $2
  `;
  const result = await pool.query(query, [paperId, userId]);
  return result.rows.length > 0;
}

/**
 * Validate CO belongs to course of paper
 */
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
}