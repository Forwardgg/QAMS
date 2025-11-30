// backend/models/Moderation.js
import { pool } from "../config/db.js";

export class Moderation {
  /**
   * Create a new moderation record.
   * - Uses the current paper version (reads from question_papers).
   * - Accepts an optional client to participate in transactions.
   * - Prevents creating duplicate moderation for same moderator & paper.
   */
  // In backend/models/Moderation.js - replace the entire create() method
static async create(paperId, moderatorId, client = null) {
  const executor = client || pool;

  // Ensure paper exists and read its current version
  const pv = await executor.query(
    "SELECT version FROM question_papers WHERE paper_id = $1 LIMIT 1",
    [paperId]
  );
  if (!pv.rows.length) {
    throw new Error("Paper not found");
  }
  const paperVersion = pv.rows[0].version ?? 1;

  // FIX: Only prevent if same moderator already has active moderation for this paper
  const existing = await executor.query(
    `SELECT moderation_id, status FROM qp_moderations
     WHERE paper_id = $1 AND moderator_id = $2 AND status = 'pending' LIMIT 1`,
    [paperId, moderatorId]  // Only check for same moderator
  );
  if (existing.rows.length) {
    throw new Error("You are already moderating this paper");
  }

  const query = `
    INSERT INTO qp_moderations (
      paper_id, moderator_id, paper_version, status,
      questions_set_per_co, questions_set_per_co_comment,
      meets_level_standard, meets_level_standard_comment,
      covers_syllabus, covers_syllabus_comment,
      technically_accurate, technically_accurate_comment,
      edited_formatted_accurately, edited_formatted_comment,
      linguistically_accurate, linguistically_accurate_comment,
      verbatim_copy_check, verbatim_copy_comment
    )
    VALUES (
      $1, $2, $3, 'pending',
      NULL, 'N/A',
      NULL, 'N/A',
      NULL, 'N/A',
      NULL, 'N/A',
      NULL, 'N/A',
      NULL, 'N/A',
      NULL, 'N/A'
    )
    RETURNING *
  `;

  const values = [paperId, moderatorId, paperVersion];
  const { rows } = await executor.query(query, values);
  return rows[0];
}

  /**
   * Find the latest moderation row for a paper (any status).
   * Useful for history display. Returns null if none.
   */
  static async findByPaper(paperId) {
    const query = `
      SELECT 
        m.*,
        u.name as moderator_name,
        u.email as moderator_email,
        p.title as paper_title,
        p.status as paper_status,
        c.code as course_code,
        c.title as course_title
      FROM qp_moderations m
      LEFT JOIN users u ON m.moderator_id = u.user_id
      LEFT JOIN question_papers p ON m.paper_id = p.paper_id
      LEFT JOIN courses c ON p.course_id = c.course_id
      WHERE m.paper_id = $1
      ORDER BY m.created_at DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [paperId]);
    return rows[0] || null;
  }

  /**
   * Find the active/pending moderation for a paper (if any).
   * Returns the pending moderation row or null.
   */
  static async findPendingByPaper(paperId) {
    const query = `
      SELECT m.*, u.name as moderator_name, u.email as moderator_email
      FROM qp_moderations m
      LEFT JOIN users u ON m.moderator_id = u.user_id
      WHERE m.paper_id = $1 AND m.status = 'pending'
      ORDER BY m.created_at ASC
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [paperId]);
    return rows[0] || null;
  }

  /**
   * Update moderation record.
   * - Accepts optional client to participate in transactions.
   * - Validates status and normalizes boolean-like fields.
   */
  static async update(moderationId, moderationData, client = null) {
    const executor = client || pool;

    const allowedFields = [
      'questions_set_per_co', 'questions_set_per_co_comment',
      'meets_level_standard', 'meets_level_standard_comment',
      'covers_syllabus', 'covers_syllabus_comment',
      'technically_accurate', 'technically_accurate_comment',
      'edited_formatted_accurately', 'edited_formatted_comment',
      'linguistically_accurate', 'linguistically_accurate_comment',
      'verbatim_copy_check', 'verbatim_copy_comment',
      'status', 'paper_version'
    ];

    // Validate status if provided
    if (Object.prototype.hasOwnProperty.call(moderationData, 'status')) {
      const allowedStatuses = ['pending', 'approved', 'rejected'];
      if (!allowedStatuses.includes(moderationData.status)) {
        throw new Error(`Invalid moderation status. Allowed: ${allowedStatuses.join(', ')}`);
      }
    }

    // Normalize boolean-like fields (strings -> booleans or null)
    const booleanFields = [
      'questions_set_per_co', 'meets_level_standard', 'covers_syllabus',
      'technically_accurate', 'edited_formatted_accurately', 'linguistically_accurate',
      'verbatim_copy_check'
    ];

    for (const f of booleanFields) {
      if (Object.prototype.hasOwnProperty.call(moderationData, f)) {
        const v = moderationData[f];
        if (v === 'true' || v === '1') moderationData[f] = true;
        else if (v === 'false' || v === '0') moderationData[f] = false;
        else if (v === '' || v === null || v === undefined) moderationData[f] = null;
        // otherwise leave as-is (assume boolean or null)
      }
    }

    const setClauses = [];
    const values = [];
    let paramCount = 0;

    for (const [field, value] of Object.entries(moderationData)) {
      if (allowedFields.includes(field)) {
        paramCount++;
        setClauses.push(`${field} = $${paramCount}`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Always update updated_at
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    paramCount++;
    values.push(moderationId);

    const query = `
      UPDATE qp_moderations 
      SET ${setClauses.join(', ')}
      WHERE moderation_id = $${paramCount}
      RETURNING *
    `;

    const { rows } = await executor.query(query, values);
    if (!rows.length) throw new Error('Moderation record not found');
    return rows[0];
  }

  /**
   * Get all moderations by a specific moderator
   */
  static async getByModerator(moderatorId) {
    const query = `
      SELECT 
        m.*,
        p.title as paper_title,
        p.status as paper_status,
        p.version as paper_version,
        c.code as course_code,
        c.title as course_title,
        u.name as creator_name
      FROM qp_moderations m
      LEFT JOIN question_papers p ON m.paper_id = p.paper_id
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.created_by = u.user_id
      WHERE m.moderator_id = $1
      ORDER BY m.updated_at DESC
    `;
    const { rows } = await pool.query(query, [moderatorId]);
    return rows;
  }

  /**
   * Get moderation by ID
   */
  static async findById(moderationId) {
    const query = `
      SELECT 
        m.*,
        p.title as paper_title,
        p.status as paper_status,
        p.version as paper_version,
        c.code as course_code,
        c.title as course_title,
        u.name as creator_name,
        mod_user.name as moderator_name,
        mod_user.email as moderator_email
      FROM qp_moderations m
      LEFT JOIN question_papers p ON m.paper_id = p.paper_id
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.created_by = u.user_id
      LEFT JOIN users mod_user ON m.moderator_id = mod_user.user_id
      WHERE m.moderation_id = $1
    `;
    const { rows } = await pool.query(query, [moderationId]);
    return rows[0] || null;
  }

  /**
   * Check if moderator is already moderating a paper (pending record exists for this moderator)
   */
  static async isModeratingPaper(paperId, moderatorId) {
    const query = `
      SELECT moderation_id 
      FROM qp_moderations 
      WHERE paper_id = $1 AND moderator_id = $2 AND status = 'pending'
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [paperId, moderatorId]);
    return rows.length > 0;
  }

  /**
   * Check whether any pending moderation exists for a paper
   */
  static async isPaperBeingModerated(paperId) {
    const query = `SELECT 1 FROM qp_moderations WHERE paper_id = $1 AND status = 'pending' LIMIT 1`;
    const { rows } = await pool.query(query, [paperId]);
    return rows.length > 0;
  }

  /**
   * Get all pending moderations
   */
  static async getPendingModerations() {
    const query = `
      SELECT 
        m.*,
        p.title as paper_title,
        p.status as paper_status,
        c.code as course_code,
        c.title as course_title,
        u.name as creator_name,
        mod_user.name as moderator_name
      FROM qp_moderations m
      LEFT JOIN question_papers p ON m.paper_id = p.paper_id
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.created_by = u.user_id
      LEFT JOIN users mod_user ON m.moderator_id = mod_user.user_id
      WHERE m.status = 'pending'
      ORDER BY m.created_at ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  /**
   * Get moderation statistics for a moderator
   */
  static async getModeratorStats(moderatorId) {
    const query = `
      SELECT 
        COUNT(*) as total_moderations,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        MIN(created_at) as first_moderation,
        MAX(created_at) as last_moderation
      FROM qp_moderations 
      WHERE moderator_id = $1
    `;
    const { rows } = await pool.query(query, [moderatorId]);
    return rows[0];
  }

  /**
   * Get papers currently being moderated by a moderator
   */
  static async getActiveModerations(moderatorId) {
    const query = `
      SELECT 
        m.*,
        p.title as paper_title,
        p.status as paper_status,
        p.version as paper_version,
        c.code as course_code,
        c.title as course_title,
        u.name as creator_name,
        (SELECT COUNT(*) FROM questions q WHERE q.paper_id = p.paper_id) as question_count
      FROM qp_moderations m
      LEFT JOIN question_papers p ON m.paper_id = p.paper_id
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.created_by = u.user_id
      WHERE m.moderator_id = $1 AND m.status = 'pending'
      ORDER BY m.updated_at DESC
    `;
    const { rows } = await pool.query(query, [moderatorId]);
    return rows;
  }

  /**
   * Delete moderation record (for cleanup)
   */
  static async delete(moderationId) {
    const query = `
      DELETE FROM qp_moderations 
      WHERE moderation_id = $1 
      RETURNING moderation_id
    `;
    const { rows } = await pool.query(query, [moderationId]);
    if (!rows.length) throw new Error('Moderation record not found');
    return rows[0];
  }
  /**
 * Get all moderation records (for admin view)
 * with search, filter, and pagination support
 */
static async getAllModerations(filters = {}) {
  const {
    search = '',
    status = '',
    courseCode = '',
    moderatorName = '',
    page = 1,
    limit = 50
  } = filters;

  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  // Search filter (paper title, course code, moderator name)
  if (search) {
    paramCount++;
    whereConditions.push(`
      (p.title ILIKE $${paramCount} OR 
       c.code ILIKE $${paramCount} OR 
       mod_user.name ILIKE $${paramCount})
    `);
    queryParams.push(`%${search}%`);
  }

  // Status filter
  if (status) {
    paramCount++;
    whereConditions.push(`m.status = $${paramCount}`);
    queryParams.push(status);
  }

  // Course code filter
  if (courseCode) {
    paramCount++;
    whereConditions.push(`c.code = $${paramCount}`);
    queryParams.push(courseCode);
  }

  // Moderator name filter
  if (moderatorName) {
    paramCount++;
    whereConditions.push(`mod_user.name ILIKE $${paramCount}`);
    queryParams.push(`%${moderatorName}%`);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  // Count query for pagination
  const countQuery = `
    SELECT COUNT(*) as total_count
    FROM qp_moderations m
    LEFT JOIN question_papers p ON m.paper_id = p.paper_id
    LEFT JOIN courses c ON p.course_id = c.course_id
    LEFT JOIN users mod_user ON m.moderator_id = mod_user.user_id
    ${whereClause}
  `;

  // Main data query
  const dataQuery = `
    SELECT 
      m.*,
      p.title as paper_title,
      p.status as paper_status,
      p.version as paper_version,
      c.code as course_code,
      c.title as course_title,
      u.name as creator_name,
      mod_user.name as moderator_name,
      mod_user.email as moderator_email,
      (SELECT COUNT(*) FROM questions q WHERE q.paper_id = p.paper_id) as question_count
    FROM qp_moderations m
    LEFT JOIN question_papers p ON m.paper_id = p.paper_id
    LEFT JOIN courses c ON p.course_id = c.course_id
    LEFT JOIN users u ON p.created_by = u.user_id
    LEFT JOIN users mod_user ON m.moderator_id = mod_user.user_id
    ${whereClause}
    ORDER BY m.updated_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;

  // Calculate pagination
  const offset = (page - 1) * limit;
  queryParams.push(limit, offset);

  try {
    const countResult = await pool.query(countQuery, queryParams.slice(0, paramCount));
    const dataResult = await pool.query(dataQuery, queryParams);

    return {
      moderations: dataResult.rows,
      totalCount: parseInt(countResult.rows[0].total_count),
      currentPage: page,
      totalPages: Math.ceil(countResult.rows[0].total_count / limit),
      hasNext: page < Math.ceil(countResult.rows[0].total_count / limit),
      hasPrev: page > 1
    };
  } catch (error) {
    console.error('Error in getAllModerations:', error);
    throw error;
  }
}
}
