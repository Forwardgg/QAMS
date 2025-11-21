// backend/models/qp_moderation.js
import { pool } from "../config/db.js";
import { QuestionPaper } from "./QuestionPaper.js";

export class QPModeration {
  static allowedStatuses = ["pending", "approved", "rejected"];

  // Create or claim moderation for a paper
    static async create({ paperId, moderatorId, paperVersion = 1 }) {
    this._ensureInteger(paperId, "paperId");
    if (moderatorId !== null && moderatorId !== undefined) {
      this._ensureInteger(moderatorId, "moderatorId");
    }
    const query = `INSERT INTO qp_moderations 
        (paper_id, moderator_id, paper_version)
      VALUES ($1, $2, $3)
      RETURNING moderation_id, paper_id, moderator_id, paper_version, status,
                questions_set_per_co, questions_set_per_co_comment,
                meets_level_standard, meets_level_standard_comment,
                covers_syllabus, covers_syllabus_comment,
                technically_accurate, technically_accurate_comment,
                edited_formatted_accurately, edited_formatted_comment,
                created_at, updated_at;`;
    try {
      const { rows } = await pool.query(query, [paperId, moderatorId, paperVersion]);
      return rows[0];
    } catch (error) {
      if (error.code === "23505") {
        // Could inspect error.constraint for more specific message
        throw new Error("MODERATION_ALREADY_EXISTS");
      }
      if (error.code === "23503") {
        // foreign key violation: nicer message
        throw new Error("Related resource not found (paper or moderator).");
      }
      throw error;
    }
  }


  // Get moderation by paper
  static async getByPaper(paperId) {
    const query = `
      SELECT m.*, u.name as moderator_name, p.title as paper_title
      FROM qp_moderations m
      LEFT JOIN users u ON m.moderator_id = u.user_id
      LEFT JOIN question_papers p ON m.paper_id = p.paper_id
      WHERE m.paper_id = $1
      ORDER BY m.created_at DESC;
    `;
    const { rows } = await pool.query(query, [paperId]);
    return rows;
  }

  // Get moderations by moderator
  static async getByModerator(moderatorId) {
    const query = `
      SELECT m.*, p.title as paper_title, c.code as course_code
      FROM qp_moderations m
      LEFT JOIN question_papers p ON m.paper_id = p.paper_id
      LEFT JOIN courses c ON p.course_id = c.course_id
      WHERE m.moderator_id = $1
      ORDER BY m.created_at DESC;
    `;
    const { rows } = await pool.query(query, [moderatorId]);
    return rows;
  }

  // Get single moderation record
  static async getById(moderationId) {
    const query = `
      SELECT m.*, u.name as moderator_name, p.title as paper_title
      FROM qp_moderations m
      LEFT JOIN users u ON m.moderator_id = u.user_id
      LEFT JOIN question_papers p ON m.paper_id = p.paper_id
      WHERE m.moderation_id = $1;
    `;
    const { rows } = await pool.query(query, [moderationId]);
    return rows[0] || null;
  }

  // Update moderation with all checklist items
  static async update(moderationId, {
    status,
    questions_set_per_co,
    questions_set_per_co_comment,
    meets_level_standard,
    meets_level_standard_comment,
    covers_syllabus,
    covers_syllabus_comment,
    technically_accurate,
    technically_accurate_comment,
    edited_formatted_accurately,
    edited_formatted_comment
  }) {
    if (status && !this.allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${this.allowedStatuses.join(", ")}`);
    }

    const query = `
      UPDATE qp_moderations
      SET status = COALESCE($1, status),
          questions_set_per_co = COALESCE($2, questions_set_per_co),
          questions_set_per_co_comment = COALESCE($3, questions_set_per_co_comment),
          meets_level_standard = COALESCE($4, meets_level_standard),
          meets_level_standard_comment = COALESCE($5, meets_level_standard_comment),
          covers_syllabus = COALESCE($6, covers_syllabus),
          covers_syllabus_comment = COALESCE($7, covers_syllabus_comment),
          technically_accurate = COALESCE($8, technically_accurate),
          technically_accurate_comment = COALESCE($9, technically_accurate_comment),
          edited_formatted_accurately = COALESCE($10, edited_formatted_accurately),
          edited_formatted_comment = COALESCE($11, edited_formatted_comment),
          updated_at = CURRENT_TIMESTAMP
      WHERE moderation_id = $12
      RETURNING moderation_id, paper_id, moderator_id, paper_version, status,
                questions_set_per_co, questions_set_per_co_comment,
                meets_level_standard, meets_level_standard_comment,
                covers_syllabus, covers_syllabus_comment,
                technically_accurate, technically_accurate_comment,
                edited_formatted_accurately, edited_formatted_comment,
                created_at, updated_at;
    `;

    const values = [
      status ?? null,
      questions_set_per_co ?? null,
      questions_set_per_co_comment ?? null,
      meets_level_standard ?? null,
      meets_level_standard_comment ?? null,
      covers_syllabus ?? null,
      covers_syllabus_comment ?? null,
      technically_accurate ?? null,
      technically_accurate_comment ?? null,
      edited_formatted_accurately ?? null,
      edited_formatted_comment ?? null,
      moderationId
    ];

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  // Convenience methods for common actions
  static async approve(moderationId, checklistData = {}) {
    return this.update(moderationId, { 
      status: "approved",
      ...checklistData 
    });
  }

  static async reject(moderationId, checklistData = {}) {
    return this.update(moderationId, { 
      status: "rejected",
      ...checklistData 
    });
  }

  // Update paper status based on moderation
  static async updatePaperStatus(paperId) {
  // Use a transaction to avoid races and use moderation_id for latest
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const selectQ = `
      SELECT status
      FROM qp_moderations
      WHERE paper_id = $1
      ORDER BY moderation_id DESC
      LIMIT 1;
    `;
    const res = await client.query(selectQ, [paperId]);

    if (res.rowCount === 0) {
      await client.query("COMMIT");
      return null;
    }

    const latestStatus = res.rows[0].status;
    let paperStatus = "under_review";

    if (latestStatus === "approved") {
      paperStatus = "approved";
    } else if (latestStatus === "rejected") {
      paperStatus = "change_requested";
    }

    // call QuestionPaper.update using the global pool (or use client.query on paper table)
    await QuestionPaper.update(paperId, { status: paperStatus });

    await client.query("COMMIT");
    return paperStatus;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
}