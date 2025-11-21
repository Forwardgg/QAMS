// backend/models/CourseOutcome.js
import { pool } from "../config/db.js";

export class CourseOutcome {
    static async create({ courseId, coNumber, description }) {
    // basic validation
    if (!Number.isInteger(courseId)) {
      throw new Error("courseId must be an integer.");
    }
    if (coNumber === undefined || coNumber === null || String(coNumber).trim() === "") {
      throw new Error("coNumber is required.");
    }
    if (description === undefined || description === null || String(description).trim() === "") {
      throw new Error("description is required.");
    }

    // Optional: ensure course exists (uncomment if desired)
    // const courseCheck = await pool.query('SELECT 1 FROM courses WHERE course_id=$1', [courseId]);
    // if (courseCheck.rows.length === 0) {
    //   throw new Error("Course not found.");
    // }

    const query = `
      INSERT INTO course_outcomes (course_id, co_number, description)
      VALUES ($1, $2, $3)
      RETURNING co_id, course_id, co_number, description;
    `;
    try {
      const values = [courseId, coNumber, description];
      const { rows } = await pool.query(query, values);
      return rows[0] || null;
    } catch (error) {
      // Handle duplicate CO number within the same course
      if (error.code === "23505") {
        // Optionally inspect error.constraint to ensure it's the course_outcomes unique index
        throw new Error("DUPLICATE_CO_NUMBER");
      }
      throw error;
    }
  }

  static async getByCourse(courseId) {
    const query = `
      SELECT co_id, course_id, co_number, description
      FROM course_outcomes
      WHERE course_id = $1
      ORDER BY co_number;
    `;
    const { rows } = await pool.query(query, [courseId]);
    return rows;
  }
  static async getById(coId) {
    const query = `
      SELECT co_id, course_id, co_number, description
      FROM course_outcomes
      WHERE co_id = $1;
    `;
    const { rows } = await pool.query(query, [coId]);
    return rows[0] || null;
  }
    static async update(coId, { coNumber, description }) {
    if (!Number.isInteger(coId)) {
      throw new Error("coId must be an integer.");
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (coNumber !== undefined) {
      if (coNumber === null || String(coNumber).trim() === "") {
        throw new Error("coNumber cannot be empty.");
      }
      updates.push(`co_number = $${idx}`);
      values.push(coNumber);
      idx++;
    }
    if (description !== undefined) {
      if (description === null || String(description).trim() === "") {
        throw new Error("description cannot be empty.");
      }
      updates.push(`description = $${idx}`);
      values.push(description);
      idx++;
    }

    if (updates.length === 0) {
      // nothing to update — return current row so the caller can see the state
      const existing = await this.getById(coId);
      return existing;
    }

    values.push(coId);

    const query = `
      UPDATE course_outcomes
      SET ${updates.join(", ")}
      WHERE co_id = $${idx}
      RETURNING co_id, course_id, co_number, description;
    `;

    try {
      const { rows } = await pool.query(query, values);
      return rows[0] || null;
    } catch (error) {
      if (error.code === "23505") {
        throw new Error("DUPLICATE_CO_NUMBER");
      }
      throw error;
    }
  }

  static async delete(coId) {
    const query = `
      DELETE FROM course_outcomes 
      WHERE co_id = $1 
      RETURNING co_id, course_id, co_number, description;
    `;
    const { rows } = await pool.query(query, [coId]);
    return rows[0] || null;
  }
}
