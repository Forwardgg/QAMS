import { pool } from "../config/db.js";

export class QuestionModeration {
  static allowedStatuses = ["pending", "approved", "rejected"];

  // create
  static async create({ paperId, questionId, moderatorId, status = "pending", comments = "" }) {
    if (!this.allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${this.allowedStatuses.join(", ")}`);
    }

    const query = `
      INSERT INTO question_moderation (paper_id, question_id, moderator_id, status, comments)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, paper_id, question_id, moderator_id, status, comments, reviewed_at;
    `;
    const values = [paperId, questionId, moderatorId, status, comments];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // read
  static async getByPaper(paperId) {
    const query = `
      SELECT qm.*, u.name as moderator_name, q.content, q.question_type
      FROM question_moderation qm
      LEFT JOIN users u ON qm.moderator_id = u.user_id
      LEFT JOIN questions q ON qm.question_id = q.question_id
      WHERE qm.paper_id = $1
      ORDER BY qm.reviewed_at DESC;
    `;
    const { rows } = await pool.query(query, [paperId]);
    return rows;
  }

  static async getByQuestion(questionId) {
    const query = `
      SELECT qm.*, u.name as moderator_name
      FROM question_moderation qm
      LEFT JOIN users u ON qm.moderator_id = u.user_id
      WHERE qm.question_id = $1
      ORDER BY qm.reviewed_at DESC;
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows;
  }

  static async getByModerator(moderatorId) {
    const query = `
      SELECT qm.*, q.content, q.question_type, p.title as paper_title
      FROM question_moderation qm
      LEFT JOIN questions q ON qm.question_id = q.question_id
      LEFT JOIN question_papers p ON qm.paper_id = p.paper_id
      WHERE qm.moderator_id = $1
      ORDER BY qm.reviewed_at DESC;
    `;
    const { rows } = await pool.query(query, [moderatorId]);
    return rows;
  }

  // update
  static async updateStatus(id, { status, comments }) {
    if (!this.allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${this.allowedStatuses.join(", ")}`);
    }

    const query = `
      UPDATE question_moderation
      SET status = $1, comments = $2, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, paper_id, question_id, moderator_id, status, comments, reviewed_at;
    `;
    const values = [status, comments, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // helpers
  static async approve(id, comments = "") {
    return this.updateStatus(id, { status: "approved", comments });
  }

  static async reject(id, comments = "") {
    return this.updateStatus(id, { status: "rejected", comments });
  }
}
