// backend/models/CourseOutcome.js
import { pool } from "../config/db.js";

export class CourseOutcome {
  
  static async create({ courseId, coNumber, description }) {
    const query = `
      INSERT INTO course_outcomes (course_id, co_number, description)
      VALUES ($1, $2, $3)
      RETURNING co_id, course_id, co_number, description;
    `;
    const values = [courseId, coNumber, description];
    const { rows } = await pool.query(query, values);
    return rows[0];
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
    return rows[0];
  }

  static async update(coId, { coNumber, description }) {
    const query = `
      UPDATE course_outcomes
      SET co_number = $1, description = $2
      WHERE co_id = $3
      RETURNING co_id, course_id, co_number, description;
    `;
    const values = [coNumber, description, coId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(coId) {
    const query = `
      DELETE FROM course_outcomes WHERE co_id = $1 RETURNING co_id;
    `;
    const { rows } = await pool.query(query, [coId]);
    return rows[0];
  }
}
