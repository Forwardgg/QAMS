// backend/models/QuestionPaper.js
import { pool } from "../config/db.js";

export class QuestionPaper {
  static allowedStatuses = [
    "draft",
    "submitted",
    "under_review",
    "change_requested",
    "approved",
  ];

  // --- helpers ---
  static ensureRequired(value, name) {
    if (value === undefined || value === null || value === "") {
      throw new Error(`${name} is required.`);
    }
  }

  static ensureNonNegativeInt(value, name) {
    if (value === undefined || value === null) return;
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${name} must be a non-negative integer.`);
    }
  }

  // Create a question paper
  // Accepts either createdBy or instructorId for backward compatibility
  static async create({
    courseId,
    createdBy,
    instructorId,
    title,
    examType = null,
    semester = null,
    academicYear = null,
    fullMarks = null,
    duration = null,
  }) {
    const authorId = createdBy ?? instructorId;

    this.ensureRequired(courseId, "courseId");
    this.ensureRequired(authorId, "createdBy/instructorId");
    this.ensureRequired(title, "title");
    this.ensureNonNegativeInt(fullMarks, "fullMarks");
    this.ensureNonNegativeInt(duration, "duration");

    const query = `
      INSERT INTO question_papers
        (course_id, created_by, title, exam_type, semester, academic_year, full_marks, duration)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING paper_id, course_id, created_by, title, status, version,
                exam_type, semester, academic_year, full_marks, duration,
                created_at, updated_at;
    `;
    const values = [
      courseId,
      authorId,
      title,
      examType,
      semester,
      academicYear,
      fullMarks,
      duration,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // List papers with optional pagination
  static async getAll(limit = 50, offset = 0) {
    const query = `
      SELECT p.paper_id, p.course_id, p.created_by, p.title, p.status, p.version,
             p.exam_type, p.semester, p.academic_year, p.full_marks, p.duration,
             p.created_at, p.updated_at,
             c.code AS course_code, c.title AS course_title,
             u.name AS creator_name
      FROM question_papers p
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.created_by = u.user_id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const { rows } = await pool.query(query, [limit, offset]);
    return rows;
  }

  static async getById(paperId) {
    const query = `
      SELECT p.paper_id, p.course_id, p.created_by, p.title, p.status, p.version,
             p.exam_type, p.semester, p.academic_year, p.full_marks, p.duration,
             p.created_at, p.updated_at,
             c.code AS course_code, c.title AS course_title,
             u.name AS creator_name
      FROM question_papers p
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.created_by = u.user_id
      WHERE p.paper_id = $1;
    `;
    const { rows } = await pool.query(query, [paperId]);
    return rows[0] || null;
  }

  // Partial update using COALESCE; increments version
  static async update(
    paperId,
    { title, examType, semester, academicYear, fullMarks, duration, status }
  ) {
    if (status !== undefined && status !== null) {
      if (!this.allowedStatuses.includes(status)) {
        throw new Error(
          `Invalid status. Allowed: ${this.allowedStatuses.join(", ")}`
        );
      }
    }

    this.ensureNonNegativeInt(fullMarks, "fullMarks");
    this.ensureNonNegativeInt(duration, "duration");

    const query = `
      UPDATE question_papers
      SET title = COALESCE($1, title),
          exam_type = COALESCE($2, exam_type),
          semester = COALESCE($3, semester),
          academic_year = COALESCE($4, academic_year),
          full_marks = COALESCE($5, full_marks),
          duration = COALESCE($6, duration),
          status = COALESCE($7, status),
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE paper_id = $8
      RETURNING paper_id, course_id, created_by, title, status, version,
                exam_type, semester, academic_year, full_marks, duration,
                created_at, updated_at;
    `;

    const values = [
      title ?? null,
      examType ?? null,
      semester ?? null,
      academicYear ?? null,
      fullMarks ?? null,
      duration ?? null,
      status ?? null,
      paperId,
    ];

    const { rows } = await pool.query(query, values);
    if (!rows.length) throw new Error("Paper not found");
    return rows[0];
  }

  static async delete(paperId) {
    const query = `DELETE FROM question_papers WHERE paper_id = $1 RETURNING paper_id;`;
    const { rows } = await pool.query(query, [paperId]);
    if (!rows.length) throw new Error("Paper not found");
    return rows[0];
  }

  // Moderation workflow helpers
  static async submit(paperId) {
    return this._setStatus(paperId, "submitted");
  }
  static async approve(paperId) {
    return this._setStatus(paperId, "approved");
  }
  static async requestChanges(paperId) {
    return this._setStatus(paperId, "change_requested");
  }
  static async markUnderReview(paperId) {
    return this._setStatus(paperId, "under_review");
  }

  static async _setStatus(paperId, status) {
    if (!this.allowedStatuses.includes(status)) {
      throw new Error("Invalid status");
    }
    const query = `
      UPDATE question_papers
      SET status = $1,
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE paper_id = $2
      RETURNING paper_id, course_id, created_by, title, status, version,
                exam_type, semester, academic_year, full_marks, duration,
                created_at, updated_at;
    `;
    const { rows } = await pool.query(query, [status, paperId]);
    if (!rows.length) throw new Error("Paper not found");
    return rows[0];
  }
}
