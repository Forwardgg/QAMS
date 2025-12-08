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
             p.created_at, p.updated_at,
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

  // Get papers by course and CO
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
    // First check if paper can be edited
    const paper = await this.findById(paperId);
    if (!paper) {
      throw new Error("Paper not found");
    }
    if (!['draft', 'change_requested'].includes(paper.status)) {
      throw new Error(`Paper cannot be edited. Current status: ${paper.status}. Only papers in 'draft' or 'change_requested' status can be edited.`);
    }

    // Rest of existing validation
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
    // First check if paper can be deleted
    const paper = await this.findById(paperId);
    if (!paper) {
      throw new Error("Paper not found");
    }
    if (!['draft', 'change_requested'].includes(paper.status)) {
      throw new Error(`Paper cannot be deleted. Current status: ${paper.status}. Only papers in 'draft' or 'change_requested' status can be deleted.`);
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

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

    // If moderatorId provided, exclude papers that are being moderated by OTHER moderators
    if (moderatorId) {
      paramCount++;
      whereConditions.push(`
        NOT EXISTS (
          SELECT 1 FROM qp_moderations m 
          WHERE m.paper_id = p.paper_id 
            AND m.status = 'pending'
            AND (m.moderator_id IS DISTINCT FROM $${paramCount})
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
        (SELECT COALESCE(SUM(q.marks), 0) FROM questions q WHERE q.paper_id = p.paper_id AND q.status != 'draft') as total_marks, -- NEW
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
            'description', co.description,
            'bloom_level', co.bloom_level  -- ADDED bloom_level
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
  static async startModeration(paperId, client = null) {
    const executor = client || pool;

    const query = `
      UPDATE question_papers
      SET status = 'under_review', updated_at = CURRENT_TIMESTAMP
      WHERE paper_id = $1 AND status = 'submitted'
      RETURNING paper_id, status, updated_at
    `;

    const { rows } = await executor.query(query, [paperId]);
    if (!rows.length) throw new Error('Paper not found or not in submitted status');
    return rows[0];
  }

  static async submitForModeration(paperId, client = null) {
    const executor = client || pool;
    
    const query = `
      UPDATE question_papers 
      SET status = 'submitted', updated_at = CURRENT_TIMESTAMP
      WHERE paper_id = $1 AND status = 'draft'
      RETURNING *
    `;
    
    const { rows } = await executor.query(query, [paperId]);
    if (!rows.length) {
      throw new Error('Paper not found or not in draft status');
    }
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

    if (moderatorId) {
      paramCount++;
      whereConditions.push(`
        NOT EXISTS (
          SELECT 1 FROM qp_moderations m 
          WHERE m.paper_id = p.paper_id 
            AND m.status = 'pending'
            AND (m.moderator_id IS DISTINCT FROM $${paramCount})
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
        (SELECT COALESCE(SUM(q.marks), 0) FROM questions q WHERE q.paper_id = p.paper_id AND q.status != 'draft') as total_marks, -- NEW
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

  // NEW METHODS FOR MARKS MANAGEMENT

  /**
   * Get total marks for a paper
   */
  static async getTotalMarks(paperId) {
    const query = `
      SELECT COALESCE(SUM(marks), 0) as total_marks
      FROM questions
      WHERE paper_id = $1 AND status != 'draft'
    `;
    
    const { rows } = await pool.query(query, [paperId]);
    return parseInt(rows[0].total_marks) || 0;
  }

  /**
   * Get marks breakdown by CO for a paper
   */
  static async getMarksBreakdown(paperId) {
    const query = `
      SELECT 
        co.co_number,
        co.description,
        co.bloom_level,  -- ADDED bloom_level
        COALESCE(SUM(q.marks), 0) as total_marks,
        COUNT(q.question_id) as question_count,
        COUNT(CASE WHEN q.status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN q.status = 'change_requested' THEN 1 END) as change_requested_count
      FROM course_outcomes co
      LEFT JOIN questions q ON co.co_id = q.co_id AND q.paper_id = $1
      WHERE co.course_id = (SELECT course_id FROM question_papers WHERE paper_id = $1)
      GROUP BY co.co_id, co.co_number, co.description, co.bloom_level  -- ADDED bloom_level to GROUP BY
      ORDER BY co.co_number
    `;
    
    const { rows } = await pool.query(query, [paperId]);
    return rows;
  }

  /**
   * Validate if total marks match paper's full_marks
   */
  static async validateMarks(paperId) {
    const paper = await this.findById(paperId);
    if (!paper) {
      throw new Error('Paper not found');
    }

    const totalMarks = await this.getTotalMarks(paperId);
    
    return {
      paperFullMarks: paper.full_marks,
      totalQuestionMarks: totalMarks,
      isValid: paper.full_marks === null || totalMarks === paper.full_marks,
      difference: paper.full_marks !== null ? totalMarks - paper.full_marks : null
    };
  }

  /**
   * Search papers with comprehensive filters including marks
   */
  static async searchPapers(filters = {}) {
    const {
      courseCode = '',
      status = '',
      examType = '',
      semester = '',
      academicYear = '',
      minMarks = null,
      maxMarks = null,
      page = 1,
      limit = 50
    } = filters;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (courseCode) {
      paramCount++;
      whereConditions.push(`c.code ILIKE $${paramCount}`);
      queryParams.push(`%${courseCode}%`);
    }

    if (status) {
      paramCount++;
      whereConditions.push(`p.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (examType) {
      paramCount++;
      whereConditions.push(`p.exam_type ILIKE $${paramCount}`);
      queryParams.push(`%${examType}%`);
    }

    if (semester) {
      paramCount++;
      whereConditions.push(`p.semester ILIKE $${paramCount}`);
      queryParams.push(`%${semester}%`);
    }

    if (academicYear) {
      paramCount++;
      whereConditions.push(`p.academic_year = $${paramCount}`);
      queryParams.push(academicYear);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Subquery for marks filtering
    let havingClause = '';
    if (minMarks !== null || maxMarks !== null) {
      const havingConditions = [];
      if (minMarks !== null) {
        paramCount++;
        havingConditions.push(`total_question_marks >= $${paramCount}`);
        queryParams.push(minMarks);
      }
      if (maxMarks !== null) {
        paramCount++;
        havingConditions.push(`total_question_marks <= $${paramCount}`);
        queryParams.push(maxMarks);
      }
      havingClause = `HAVING ${havingConditions.join(' AND ')}`;
    }

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM (
        SELECT p.paper_id
        FROM question_papers p
        LEFT JOIN courses c ON p.course_id = c.course_id
        LEFT JOIN users u ON p.created_by = u.user_id
        ${whereClause}
        GROUP BY p.paper_id
        ${havingClause}
      ) subquery
    `;

    // Main data query
    const dataQuery = `
      SELECT 
        p.paper_id, p.course_id, p.created_by, p.title, p.status, p.version,
        p.exam_type, p.semester, p.academic_year, p.full_marks, p.duration,
        p.created_at, p.updated_at,
        c.code AS course_code, c.title AS course_title,
        u.name AS creator_name,
        (SELECT COUNT(*) FROM questions q WHERE q.paper_id = p.paper_id) as question_count,
        (SELECT COALESCE(SUM(q.marks), 0) FROM questions q WHERE q.paper_id = p.paper_id AND q.status != 'draft') as total_question_marks
      FROM question_papers p
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.created_by = u.user_id
      ${whereClause}
      GROUP BY p.paper_id, c.course_id, u.user_id
      ${havingClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    // Calculate pagination
    const offset = (page - 1) * limit;
    queryParams.push(limit, offset);

    try {
      const countResult = await pool.query(countQuery, queryParams.slice(0, paramCount));
      const dataResult = await pool.query(dataQuery, queryParams);

      return {
        papers: dataResult.rows,
        totalCount: parseInt(countResult.rows[0].total_count),
        currentPage: page,
        totalPages: Math.ceil(countResult.rows[0].total_count / limit),
        hasNext: page < Math.ceil(countResult.rows[0].total_count / limit),
        hasPrev: page > 1
      };
    } catch (error) {
      console.error('Error in searchPapers:', error);
      throw error;
    }
  }

  // NEW: Get bloom level distribution for a paper
  static async getBloomLevelDistribution(paperId) {
    const query = `
      SELECT 
        co.bloom_level,
        COUNT(q.question_id) as question_count,
        COALESCE(SUM(q.marks), 0) as total_marks
      FROM course_outcomes co
      LEFT JOIN questions q ON co.co_id = q.co_id AND q.paper_id = $1
      WHERE co.course_id = (SELECT course_id FROM question_papers WHERE paper_id = $1)
      GROUP BY co.bloom_level
      ORDER BY co.bloom_level
    `;
    
    const { rows } = await pool.query(query, [paperId]);
    return rows;
  }
}