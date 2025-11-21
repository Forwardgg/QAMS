// backend/models/Option.js
import { pool } from "../config/db.js";

export class Option {
  static _ensureInteger(val, name) {
    if (!Number.isInteger(val)) throw new Error(`${name} must be an integer.`);
  }

  static _ensureNonEmptyString(val, name) {
    if (val === undefined || val === null || String(val).trim() === "") {
      throw new Error(`${name} is required.`);
    }
  }

  static _toBoolean(val) {
    if (val === undefined || val === null) return false;
    if (typeof val === "boolean") return val;
    if (val === 1 || val === "1" || val === "true") return true;
    if (val === 0 || val === "0" || val === "false") return false;
    throw new Error("isCorrect must be a boolean-like value.");
  }

  // create an option
  static async create({ questionId, optionText, isCorrect = false }) {
    this._ensureInteger(questionId, "questionId");
    this._ensureNonEmptyString(optionText, "optionText");
    const isCorrectBool = this._toBoolean(isCorrect);

    const query = `
      INSERT INTO options (question_id, option_text, is_correct)
      VALUES ($1, $2, $3)
      RETURNING option_id, question_id, option_text, is_correct;
    `;
    const values = [questionId, optionText, isCorrectBool];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  // get all options for a question
  static async getByQuestion(questionId) {
    this._ensureInteger(questionId, "questionId");
    const query = `
      SELECT option_id, question_id, option_text, is_correct
      FROM options
      WHERE question_id = $1
      ORDER BY option_id;
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows;
  }

  // partial update: only provided fields are updated
  static async update(optionId, { optionText, isCorrect } = {}) {
    this._ensureInteger(optionId, "optionId");

    const updates = [];
    const values = [];
    let idx = 1;

    if (optionText !== undefined) {
      if (optionText === null || String(optionText).trim() === "") {
        throw new Error("optionText cannot be empty.");
      }
      updates.push(`option_text = $${idx}`);
      values.push(optionText);
      idx++;
    }

    if (isCorrect !== undefined) {
      const isCorrectBool = this._toBoolean(isCorrect);
      updates.push(`is_correct = $${idx}`);
      values.push(isCorrectBool);
      idx++;
    }

    if (updates.length === 0) {
      // nothing to update — return existing row for clarity
      const q = `SELECT option_id, question_id, option_text, is_correct FROM options WHERE option_id = $1;`;
      const { rows } = await pool.query(q, [optionId]);
      return rows[0] || null;
    }

    values.push(optionId);
    const query = `
      UPDATE options
      SET ${updates.join(", ")}
      WHERE option_id = $${idx}
      RETURNING option_id, question_id, option_text, is_correct;
    `;
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  // delete single option
  static async delete(optionId) {
    this._ensureInteger(optionId, "optionId");
    const query = `
      DELETE FROM options WHERE option_id = $1 RETURNING option_id;
    `;
    const { rows } = await pool.query(query, [optionId]);
    return rows[0] || null;
  }

  // delete all options for a question
  static async deleteByQuestion(questionId) {
    this._ensureInteger(questionId, "questionId");
    const query = `DELETE FROM options WHERE question_id = $1 RETURNING option_id;`;
    const { rows } = await pool.query(query, [questionId]);
    return rows; // array of deleted option_ids
  }
}
