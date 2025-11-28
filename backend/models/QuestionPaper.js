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

  // Create a question paper (instructor)
  static async create({
    courseId,
    createdBy,
    title,
    examType = null,
    semester = null,
    academicYear = null,
    fullMarks = null,
    duration = null,
    client = null
  }) {
    this.ensureRequired(courseId, "courseId");
    this.ensureRequired(createdBy, "createdBy");
    this.ensureRequired(title, "title");
    this.ensureNonNegativeInt(fullMarks, "fullMarks");
    this.ensureNonNegativeInt(duration, "duration");

    const executor = client || pool;

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
      createdBy,
      title,
      examType,
      semester,
      academicYear,
      fullMarks,
      duration,
    ];

    const { rows } = await executor.query(query, values);
    return rows[0];
  }

  // Get all papers (all)
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

  // Get paper by id
  static async findById(paperId) {
    const query = `
      SELECT p.paper_id, p.course_id, p.created_by, p.title, p.status, p.version,
             p.exam_type, p.semester, p.academic_year, p.full_marks, p.duration,
             p.assembled_html, p.rendered_pdf_url, p.created_at, p.updated_at,
             c.code AS course_code, c.title AS course_title,
             u.name AS creator_name
      FROM question_papers p
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.created_by = u.user_id
      WHERE p.paper_id = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [paperId]);
    return rows[0] || null;
  }

  // Get paper by course code
  static async getByCourseCode(courseCode) {
    const query = `
      SELECT p.paper_id, p.course_id, p.created_by, p.title, p.status, p.version,
             p.exam_type, p.semester, p.academic_year, p.full_marks, p.duration,
             p.created_at, p.updated_at,
             c.code AS course_code, c.title AS course_title,
             u.name AS creator_name
      FROM question_papers p
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.created_by = u.user_id
      WHERE c.code = $1
      ORDER BY p.created_at DESC;
    `;
    const { rows } = await pool.query(query, [courseCode]);
    return rows;
  }

  // will change later. it will be searched  by course and CO of questions. the QP is linked to questions and questions to COs.(all)
  static async getByCourseAndCO(courseCode, coNumber) {
    const query = `
      SELECT DISTINCT p.paper_id, p.course_id, p.created_by, p.title, p.status, p.version,
             p.exam_type, p.semester, p.academic_year, p.full_marks, p.duration,
             p.created_at, p.updated_at,
             c.code AS course_code, c.title AS course_title,
             u.name AS creator_name
      FROM question_papers p
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.created_by = u.user_id
      LEFT JOIN questions q ON p.paper_id = q.paper_id
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      WHERE c.code = $1 AND co.co_number = $2
      ORDER BY p.created_at DESC;
    `;
    const { rows } = await pool.query(query, [courseCode, coNumber]);
    return rows;
  }

  // Update paper (admin, instructor - their own paper)
  static async update(
    paperId,
    { title, examType, semester, academicYear, fullMarks, duration, status },
    client = null
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

    const executor = client || pool;

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

    const { rows } = await executor.query(query, values);
    if (!rows.length) throw new Error("Paper not found");
    return rows[0];
  }

  // Delete paper (admin, instructor - their own paper)
  static async delete(paperId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Just delete the paper - let database handle the cascade
      const result = await client.query(
        'DELETE FROM question_papers WHERE paper_id = $1 RETURNING paper_id, title;',
        [paperId]
      );

      if (!result.rows.length) {
        await client.query('ROLLBACK');
        throw new Error("Paper not found");
      }

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Check if user is owner of paper (for authorization)
  static async isOwner(paperId, userId) {
    // Convert both to integers to ensure type matching
    const paperIdInt = Number.isInteger(Number(paperId)) ? parseInt(paperId, 10) : NaN;
    const userIdInt = Number.isInteger(Number(userId)) ? parseInt(userId, 10) : NaN;

    if (Number.isNaN(paperIdInt) || Number.isNaN(userIdInt)) return false;

    const query = `
      SELECT paper_id FROM question_papers 
      WHERE paper_id = $1 AND created_by = $2;
    `;
    const { rows } = await pool.query(query, [paperIdInt, userIdInt]);
    return rows.length > 0;
  }

  /**
   * Get papers available for moderation
   */
  static async getPapersForModeration(courseId = null, moderatorId = null) {
    let whereConditions = [
      "p.status IN ('submitted', 'under_review', 'change_requested')"
    ];
    let queryParams = [];
    let paramCount = 0;

    if (courseId) {
      paramCount++;
      whereConditions.push(`p.course_id = $${paramCount}`);
      queryParams.push(courseId);
    }

    // Exclude papers already being moderated by this moderator
    if (moderatorId) {
      paramCount++;
      whereConditions.push(`
        NOT EXISTS (
          SELECT 1 FROM qp_moderations m 
          WHERE m.paper_id = p.paper_id 
          AND m.moderator_id = $${paramCount}
          AND m.status = 'pending'
        )
      `);
      queryParams.push(moderatorId);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const query = `
      SELECT 
        p.paper_id, p.course_id, p.created_by, p.title, p.status, p.version,
        p.exam_type, p.semester, p.academic_year, p.full_marks, p.duration,
        p.created_at, p.updated_at,
        c.code AS course_code, c.title AS course_title,
        u.name AS creator_name,
        (SELECT COUNT(*) FROM questions q WHERE q.paper_id = p.paper_id) as question_count,
        (SELECT COUNT(*) FROM qp_moderations m WHERE m.paper_id = p.paper_id) as moderation_count
      FROM question_papers p
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.created_by = u.user_id
      ${whereClause}
      ORDER BY p.created_at DESC
    `;

    const { rows } = await pool.query(query, queryParams);
    return rows;
  }

  /**
   * Get paper details for moderation (with questions and COs)
   */
  static async getPaperForModeration(paperId) {
    const query = `
      SELECT 
        p.paper_id, p.course_id, p.created_by, p.title, p.status, p.version,
        p.exam_type, p.semester, p.academic_year, p.full_marks, p.duration,
        p.created_at, p.updated_at,
        c.code AS course_code, c.title AS course_title,
        u.name AS creator_name,
        json_agg(
          DISTINCT jsonb_build_object(
            'co_id', co.co_id,
            'co_number', co.co_number,
            'description', co.description
          )
        ) FILTER (WHERE co.co_id IS NOT NULL) as course_outcomes
      FROM question_papers p
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.created_by = u.user_id
      LEFT JOIN course_outcomes co ON c.course_id = co.course_id
      WHERE p.paper_id = $1
      GROUP BY p.paper_id, c.course_id, u.user_id
    `;

    const { rows } = await pool.query(query, [paperId]);
    return rows[0] || null;
  }

  /**
   * Update paper status
   * Accepts optional client to participate in an outer transaction.
   */
  static async updateStatus(paperId, status, client = null) {
    if (!this.allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${this.allowedStatuses.join(', ')}`);
    }

    const executor = client || pool;

    const query = `
      UPDATE question_papers
      SET status = $1, version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE paper_id = $2
      RETURNING paper_id, status, version, updated_at
    `;

    const { rows } = await executor.query(query, [status, paperId]);
    if (!rows.length) throw new Error('Paper not found');
    return rows[0];
  }

  /**
   * Start moderation process for a paper
   */
  static async startModeration(paperId) {
    const query = `
      UPDATE question_papers
      SET status = 'under_review', updated_at = CURRENT_TIMESTAMP
      WHERE paper_id = $1 AND status = 'submitted'
      RETURNING paper_id, status, updated_at
    `;

    const { rows } = await pool.query(query, [paperId]);
    if (!rows.length) throw new Error('Paper not found or not in submitted status');
    return rows[0];
  }

  static async getAllPapersForModerator(courseId = null, status = null, moderatorId = null) {
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (courseId) {
      paramCount++;
      whereConditions.push(`p.course_id = $${paramCount}`);
      queryParams.push(courseId);
    }

    if (status) {
      paramCount++;
      whereConditions.push(`p.status = $${paramCount}`);
      queryParams.push(status);
    }

    // Exclude papers currently being moderated by this moderator (optional)
    if (moderatorId) {
      paramCount++;
      whereConditions.push(`
        NOT EXISTS (
          SELECT 1 FROM qp_moderations m 
          WHERE m.paper_id = p.paper_id 
          AND m.moderator_id = $${paramCount}
          AND m.status = 'pending'
        )
      `);
      queryParams.push(moderatorId);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const query = `
      SELECT 
        p.paper_id, p.course_id, p.created_by, p.title, p.status, p.version,
        p.exam_type, p.semester, p.academic_year, p.full_marks, p.duration,
        p.created_at, p.updated_at,
        c.code AS course_code, c.title AS course_title,
        u.name AS creator_name,
        (SELECT COUNT(*) FROM questions q WHERE q.paper_id = p.paper_id) as question_count,
        (SELECT COUNT(*) FROM qp_moderations m WHERE m.paper_id = p.paper_id) as moderation_count,
        (SELECT status FROM qp_moderations m WHERE m.paper_id = p.paper_id ORDER BY m.created_at DESC LIMIT 1) as latest_moderation_status
      FROM question_papers p
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.created_by = u.user_id
      ${whereClause}
      ORDER BY p.created_at DESC
    `;

    const { rows } = await pool.query(query, queryParams);
    return rows;
  }
}
