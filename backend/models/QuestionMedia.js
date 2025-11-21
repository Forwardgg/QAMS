// backend/models/QuestionMedia.js
import { pool } from "../config/db.js";

export class QuestionMedia {
  static _ensureInteger(val, name) {
    if (!Number.isInteger(val)) throw new Error(`${name} must be an integer.`);
  }
  static _ensureNonEmptyString(val, name) {
    if (val === undefined || val === null || String(val).trim() === "") {
      throw new Error(`${name} is required and cannot be empty.`);
    }
  }

  // Create media entry for a question
  static async create({ questionId, mediaUrl, mediaType = null, caption = "" }) {
    this._ensureInteger(questionId, "questionId");
    this._ensureNonEmptyString(mediaUrl, "mediaUrl");

    const query = `
      INSERT INTO question_media (question_id, media_url, media_type, caption)
      VALUES ($1, $2, $3, $4)
      RETURNING media_id, question_id, media_url, media_type, caption;
    `;
    const values = [questionId, mediaUrl, mediaType, caption];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  // Get all media attached to a question
  static async getByQuestion(questionId) {
    this._ensureInteger(questionId, "questionId");
    const query = `
      SELECT media_id, question_id, media_url, media_type, caption
      FROM question_media
      WHERE question_id = $1
      ORDER BY media_id;
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows;
  }

  // Get single media by ID
  static async getById(mediaId) {
    this._ensureInteger(mediaId, "mediaId");
    const query = `
      SELECT media_id, question_id, media_url, media_type, caption
      FROM question_media
      WHERE media_id = $1;
    `;
    const { rows } = await pool.query(query, [mediaId]);
    return rows[0] || null;
  }

  // Update media (treat empty-string as "no change" for text fields)
  static async update(mediaId, { mediaUrl, mediaType, caption } = {}) {
    this._ensureInteger(mediaId, "mediaId");

    // Nothing to update — return current row
    if (mediaUrl === undefined && mediaType === undefined && caption === undefined) {
      const existing = await this.getById(mediaId);
      return existing;
    }

    const query = `
      UPDATE question_media
      SET media_url = COALESCE(NULLIF($1, ''), media_url),
          media_type = COALESCE(NULLIF($2, ''), media_type),
          caption = COALESCE(NULLIF($3, ''), caption)
      WHERE media_id = $4
      RETURNING media_id, question_id, media_url, media_type, caption;
    `;
    const values = [
      mediaUrl ?? null,
      mediaType ?? null,
      caption ?? null,
      mediaId
    ];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  // Delete a media record
  static async delete(mediaId) {
    this._ensureInteger(mediaId, "mediaId");
    const query = `
      DELETE FROM question_media
      WHERE media_id = $1
      RETURNING media_id;
    `;
    const { rows } = await pool.query(query, [mediaId]);
    return rows[0] || null;
  }

  // Delete all media for a given question
  static async deleteByQuestion(questionId) {
    this._ensureInteger(questionId, "questionId");
    const query = `
      DELETE FROM question_media
      WHERE question_id = $1
      RETURNING media_id;
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows;
  }
}
