import { pool } from "../config/db.js";

export class Moderation {
  /**
   * Create a new moderation record
   */
  static async create(paperId, moderatorId) {
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
        $1, $2, 1, 'pending',
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

    const values = [paperId, moderatorId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  /**
   * Find moderation by paper ID
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
   * Update moderation record
   */
  static async update(moderationId, moderationData) {
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
    paramCount++;
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    paramCount++;
    values.push(moderationId);

    const query = `
      UPDATE qp_moderations 
      SET ${setClauses.join(', ')}
      WHERE moderation_id = $${paramCount}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
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
   * Check if moderator is already moderating a paper
   */
  static async isModeratingPaper(paperId, moderatorId) {
    const query = `
      SELECT moderation_id 
      FROM qp_moderations 
      WHERE paper_id = $1 AND moderator_id = $2 AND status = 'pending'
    `;

    const { rows } = await pool.query(query, [paperId, moderatorId]);
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
}