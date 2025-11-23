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
    if (['1', 'true', 't', 'yes'].includes(String(val).toLowerCase())) return true;
    if (['0', 'false', 'f', 'no'].includes(String(val).toLowerCase())) return false;
    return Boolean(val);
  }

  static async _validateQuestionExists(questionId) {
    const query = 'SELECT 1 FROM questions WHERE question_id = $1 AND is_active = true';
    const { rows } = await pool.query(query, [questionId]);
    if (rows.length === 0) {
      throw new Error(`Question with ID ${questionId} does not exist or is inactive`);
    }
  }

  // Create an option
  static async create({ questionId, optionText, isCorrect = false }) {
    this._ensureInteger(questionId, "questionId");
    this._ensureNonEmptyString(optionText, "optionText");
    const isCorrectBool = this._toBoolean(isCorrect);

    // Validate that question exists
    await this._validateQuestionExists(questionId);

    const query = `
      INSERT INTO options (question_id, option_text, is_correct)
      VALUES ($1, $2, $3)
      RETURNING option_id, question_id, option_text, is_correct;
    `;
    const values = [questionId, optionText, isCorrectBool];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  // Create multiple options at once
  static async createMultiple(questionId, options) {
    this._ensureInteger(questionId, "questionId");
    
    if (!options || !Array.isArray(options) || options.length === 0) {
      throw new Error("Options array is required and cannot be empty");
    }

    // Validate that question exists
    await this._validateQuestionExists(questionId);

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const createdOptions = [];
      for (const option of options) {
        this._ensureNonEmptyString(option.optionText, "optionText");
        const isCorrectBool = this._toBoolean(option.isCorrect);

        const query = `
          INSERT INTO options (question_id, option_text, is_correct)
          VALUES ($1, $2, $3)
          RETURNING option_id, question_id, option_text, is_correct;
        `;
        const values = [questionId, option.optionText, isCorrectBool];
        const { rows } = await client.query(query, values);
        createdOptions.push(rows[0]);
      }

      await client.query('COMMIT');
      return createdOptions;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get all options for a question
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

  // Get single option by ID
  static async getById(optionId) {
    this._ensureInteger(optionId, "optionId");
    const query = `
      SELECT option_id, question_id, option_text, is_correct
      FROM options
      WHERE option_id = $1;
    `;
    const { rows } = await pool.query(query, [optionId]);
    return rows[0] || null;
  }

  // Get correct options for a question
  static async getCorrectOptions(questionId) {
    this._ensureInteger(questionId, "questionId");
    const query = `
      SELECT option_id, question_id, option_text, is_correct
      FROM options
      WHERE question_id = $1 AND is_correct = true
      ORDER BY option_id;
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows;
  }

  // Check if a question has any correct options
  static async hasCorrectOptions(questionId) {
    this._ensureInteger(questionId, "questionId");
    const correctOptions = await this.getCorrectOptions(questionId);
    return correctOptions.length > 0;
  }

  // Partial update: only provided fields are updated
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
      // Nothing to update - return existing row
      return await this.getById(optionId);
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

  // Bulk update options for a question
  static async updateMultiple(questionId, options) {
    this._ensureInteger(questionId, "questionId");
    
    if (!options || !Array.isArray(options)) {
      throw new Error("Options array is required");
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Delete existing options
      await client.query('DELETE FROM options WHERE question_id = $1', [questionId]);

      // Create new options
      const updatedOptions = [];
      for (const option of options) {
        this._ensureNonEmptyString(option.optionText, "optionText");
        const isCorrectBool = this._toBoolean(option.isCorrect);

        const query = `
          INSERT INTO options (question_id, option_text, is_correct)
          VALUES ($1, $2, $3)
          RETURNING option_id, question_id, option_text, is_correct;
        `;
        const values = [questionId, option.optionText, isCorrectBool];
        const { rows } = await client.query(query, values);
        updatedOptions.push(rows[0]);
      }

      await client.query('COMMIT');
      return updatedOptions;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete single option
  static async delete(optionId) {
    this._ensureInteger(optionId, "optionId");
    const query = `
      DELETE FROM options WHERE option_id = $1 RETURNING option_id;
    `;
    const { rows } = await pool.query(query, [optionId]);
    return rows[0] || null;
  }

  // Delete all options for a question
  static async deleteByQuestion(questionId) {
    this._ensureInteger(questionId, "questionId");
    const query = `DELETE FROM options WHERE question_id = $1 RETURNING option_id;`;
    const { rows } = await pool.query(query, [questionId]);
    return rows; // Array of deleted option_ids
  }

  // Count options for a question
  static async countByQuestion(questionId) {
    this._ensureInteger(questionId, "questionId");
    const query = `SELECT COUNT(*) FROM options WHERE question_id = $1`;
    const { rows } = await pool.query(query, [questionId]);
    return parseInt(rows[0].count);
  }

  // Validate options for MCQ question (at least 2 options, at least 1 correct)
  static async validateMcqOptions(questionId) {
    const options = await this.getByQuestion(questionId);
    
    if (options.length < 2) {
      throw new Error("MCQ questions must have at least 2 options");
    }

    const correctOptions = options.filter(opt => opt.is_correct);
    if (correctOptions.length === 0) {
      throw new Error("MCQ questions must have at least 1 correct option");
    }

    return true;
  }
}