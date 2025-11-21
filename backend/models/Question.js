// backend/models/Question.js
import { pool } from "../config/db.js";

export class Question {
  static allowedTypes = ["mcq", "subjective"];

  // Create a question. paperId is optional (can be part of a paper or standalone)
    static async create({ courseId, paperId = null, questionType, content, coId = null }) {
    // basic validation
    if (!this.allowedTypes.includes(questionType)) {
      throw new Error(`Invalid questionType. Allowed: ${this.allowedTypes.join(", ")}`);
    }
    if (!Number.isInteger(courseId)) {
      throw new Error("courseId must be an integer.");
    }
    if (paperId !== null && paperId !== undefined && !Number.isInteger(paperId)) {
      throw new Error("paperId must be an integer or null.");
    }
    if (coId !== null && coId !== undefined && !Number.isInteger(coId)) {
      throw new Error("coId must be an integer or null.");
    }
    if (content === undefined || content === null || String(content).trim() === "") {
      throw new Error("content is required.");
    }

    const query = `
      INSERT INTO questions (course_id, paper_id, question_type, content, co_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING question_id, course_id, paper_id, question_type, content, co_id, status, is_active, created_at, updated_at;
    `;
    const values = [courseId, paperId, questionType, content, coId];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }


  // Get all active questions for a course, include author (paper creator) if available
  static async getByCourse(courseId) {
    const query = `
      SELECT q.question_id, q.course_id, q.paper_id, q.question_type, q.content, q.co_id,
             q.status, q.is_active, q.created_at,
             p.created_by AS paper_creator_id,
             u.name AS author_name,
             c.code AS course_code,
             co.co_number
      FROM questions q
      LEFT JOIN question_papers p ON q.paper_id = p.paper_id
      LEFT JOIN users u ON p.created_by = u.user_id
      LEFT JOIN courses c ON q.course_id = c.course_id
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      WHERE q.course_id = $1 AND q.is_active = true
      ORDER BY q.created_at DESC;
    `;
    const { rows } = await pool.query(query, [courseId]);
    return rows;
  }

  // Get one question by id (include paper creator name if exists)
  static async getById(questionId) {
    const query = `
      SELECT q.question_id, q.course_id, q.paper_id, q.question_type, q.content, q.co_id,
             q.status, q.is_active, q.created_at, q.updated_at,
             p.created_by AS paper_creator_id,
             u.name AS author_name,
             c.code AS course_code,
             co.co_number
      FROM questions q
      LEFT JOIN question_papers p ON q.paper_id = p.paper_id
      LEFT JOIN users u ON p.created_by = u.user_id
      LEFT JOIN courses c ON q.course_id = c.course_id
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      WHERE q.question_id = $1;
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows[0] || null;
  }

  // Update content and/or co_id (partial update using COALESCE would also be possible)
    static async update(questionId, { content, coId }) {
    if (!Number.isInteger(questionId)) {
      throw new Error("questionId must be an integer.");
    }
    // require at least one field to update
    if (content === undefined && coId === undefined) return null;

    // validate coId if provided
    if (coId !== undefined && coId !== null && !Number.isInteger(coId)) {
      throw new Error("coId must be an integer or null.");
    }
    // if content is provided, disallow empty string
    if (content !== undefined && (content === null || String(content).trim() === "")) {
      throw new Error("content cannot be empty.");
    }

    const query = `
      UPDATE questions
      SET content = COALESCE(NULLIF($1, ''), content),
          co_id = COALESCE($2, co_id)
      WHERE question_id = $3
      RETURNING question_id, course_id, paper_id, question_type, content, co_id, updated_at, is_active;
    `;
    const values = [content ?? null, coId ?? null, questionId];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  // Soft delete (mark inactive)
  static async softDelete(questionId) {
    const query = `
      UPDATE questions
      SET is_active = false,
          updated_at = CURRENT_TIMESTAMP
      WHERE question_id = $1
      RETURNING question_id, is_active, updated_at;
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows[0] || null;
  }

  static async updateStatus(questionId, status) {
  const allowedStatuses = ['draft', 'submitted', 'under_review', 'change_requested', 'approved'];
  if (!allowedStatuses.includes(status)) {
    throw new Error(`Invalid status. Allowed: ${allowedStatuses.join(", ")}`);
  }

  const query = `
    UPDATE questions 
    SET status = $1, updated_at = CURRENT_TIMESTAMP 
    WHERE question_id = $2 
    RETURNING question_id, status, updated_at;
  `;
  const { rows } = await pool.query(query, [status, questionId]);
  return rows[0] || null;
}
}
