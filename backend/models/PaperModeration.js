import { pool } from "../config/db.js";
import { QuestionPaper } from "./QuestionPaper.js";

export class PaperModeration {
  static allowedStatuses = ["pending", "approved", "rejected"];

  static async create({ paperId, moderatorId, status = "pending", comments = "" }) {
    if (!this.allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${this.allowedStatuses.join(", ")}`);
    }

    const query = `
      INSERT INTO paper_moderation (paper_id, moderator_id, status, comments)
      VALUES ($1, $2, $3, $4)
      RETURNING id, paper_id, moderator_id, status, comments, reviewed_at;
    `;
    const values = [paperId, moderatorId, status, comments];
    const { rows } = await pool.query(query, values);

    // Recalculate paper status
    await this.updatePaperStatus(paperId);

    return rows[0];
  }

  static async getByPaper(paperId) {
    const query = `
      SELECT pm.*, u.name as moderator_name, p.title as paper_title
      FROM paper_moderation pm
      LEFT JOIN users u ON pm.moderator_id = u.user_id
      LEFT JOIN question_papers p ON pm.paper_id = p.paper_id
      WHERE pm.paper_id = $1
      ORDER BY pm.reviewed_at DESC;
    `;
    const { rows } = await pool.query(query, [paperId]);
    return rows;
  }

  static async getByModerator(moderatorId) {
    const query = `
      SELECT pm.*, p.title as paper_title
      FROM paper_moderation pm
      LEFT JOIN question_papers p ON pm.paper_id = p.paper_id
      WHERE pm.moderator_id = $1
      ORDER BY pm.reviewed_at DESC;
    `;
    const { rows } = await pool.query(query, [moderatorId]);
    return rows;
  }

  static async updateStatus(id, { status, comments }) {
    if (!this.allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${this.allowedStatuses.join(", ")}`);
    }

    const query = `
      UPDATE paper_moderation
      SET status = $1, comments = $2, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, paper_id, moderator_id, status, comments, reviewed_at;
    `;
    const values = [status, comments, id];
    const { rows } = await pool.query(query, values);

    if (rows[0]) {
      await this.updatePaperStatus(rows[0].paper_id);
    }

    return rows[0];
  }

  static async approve(id, comments = "") {
    return this.updateStatus(id, { status: "approved", comments });
  }

  static async reject(id, comments = "") {
    return this.updateStatus(id, { status: "rejected", comments });
  }

  // ------------------- NEW -------------------
  static async updatePaperStatus(paperId) {
    // Get all moderation records for this paper
    const moderations = await this.getByPaper(paperId);

    let newStatus = "submitted";
    if (moderations.some((m) => m.status === "rejected")) {
      newStatus = "rejected";
    } else if (moderations.some((m) => m.status === "approved")) {
      newStatus = "approved";
    }

    await QuestionPaper.update(paperId, { status: newStatus });
    return newStatus;
  }
}
