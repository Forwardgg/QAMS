// models/CourseOutcome.js
import { pool } from "../config/db.js";

export class CourseOutcome {
  static DEFAULT_LIMIT = 25;

  static _ensureRequiredString(val, name) {
    if (val === undefined || val === null || String(val).trim() === "") throw new Error(`${name} is required`);
  }

  static _ensureString(val, name) {
    if (val === undefined || val === null) return;
    if (typeof val !== "string") throw new Error(`${name} must be a string`);
  }

  static _ensureInt(val, name) {
    if (val === undefined || val === null) return;
    if (!Number.isInteger(val)) throw new Error(`${name} must be an integer`);
  }

  static async createCourseOutcome({ course_id, co_number, description }) {
    this._ensureInt(course_id, "course_id");
    this._ensureRequiredString(co_number, "co_number");
    this._ensureRequiredString(description, "description");

    const query = `
      INSERT INTO course_outcomes (course_id, co_number, description) 
      VALUES ($1, $2, $3) 
      RETURNING co_id, course_id, co_number, description, 
        (SELECT code FROM courses WHERE course_id = $1) as course_code
    `;
    const values = [course_id, String(co_number).trim(), String(description).trim()];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (err) {
      if (err.code === "23505") throw new Error("CO number already exists for this course");
      if (err.code === "23503") throw new Error("Course not found");
      throw err;
    }
  }

  static async getAllCourseOutcomes({ page = 1, limit = CourseOutcome.DEFAULT_LIMIT, orderBy = "co_number", order = "asc" } = {}) {
    page = Number(page) || 1;
    limit = Number(limit) || CourseOutcome.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;
    // removed created_at from allowedOrderBy because the table does not contain that column
    const allowedOrderBy = new Set(["co_number", "co_id"]);
    if (!allowedOrderBy.has(orderBy)) orderBy = "co_number";
    order = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";

    const countQuery = `SELECT COUNT(*)::int AS total FROM course_outcomes`;
    const dataQuery = `
      SELECT 
        co.co_id, 
        co.course_id, 
        co.co_number, 
        co.description,
        c.code as course_code,
        c.title as course_title
      FROM course_outcomes co
      JOIN courses c ON co.course_id = c.course_id
      ORDER BY ${orderBy} ${order} 
      LIMIT $1 OFFSET $2
    `;

    let client;
    try {
      client = await pool.connect();
      const totalRes = await client.query(countQuery);
      const total = totalRes.rows[0] ? totalRes.rows[0].total : 0;
      const dataRes = await client.query(dataQuery, [limit, offset]);
      return { rows: dataRes.rows, total, page, limit };
    } finally {
      if (client) {
        try { client.release(); } catch (e) { console.error("Error releasing client in getAllCourseOutcomes:", e); }
      }
    }
  }

  static async getCourseOutcomesByCourseCode(courseCode) {
    if (!courseCode || String(courseCode).trim() === "") throw new Error("courseCode is required");
    
    const query = `
      SELECT 
        co.co_id, 
        co.course_id, 
        co.co_number, 
        co.description,
        c.code as course_code,
        c.title as course_title
      FROM course_outcomes co
      JOIN courses c ON co.course_id = c.course_id
      WHERE c.code = $1
      ORDER BY co.co_number ASC
    `;
    
    const { rows } = await pool.query(query, [String(courseCode).trim()]);
    return rows;
  }

  static async getCourseOutcomesByCourseId(courseId) {
    this._ensureInt(courseId, "course_id");
    
    const query = `
      SELECT 
        co.co_id, 
        co.course_id, 
        co.co_number, 
        co.description,
        c.code as course_code,
        c.title as course_title
      FROM course_outcomes co
      JOIN courses c ON co.course_id = c.course_id
      WHERE co.course_id = $1
      ORDER BY co.co_number ASC
    `;
    
    const { rows } = await pool.query(query, [courseId]);
    return rows;
  }

  static async getCourseOutcomeByNumber(courseId, coNumber) {
    this._ensureInt(courseId, "course_id");
    this._ensureRequiredString(coNumber, "co_number");

    const query = `
      SELECT 
        co.co_id, 
        co.course_id, 
        co.co_number, 
        co.description,
        c.code as course_code,
        c.title as course_title
      FROM course_outcomes co
      JOIN courses c ON co.course_id = c.course_id
      WHERE co.course_id = $1 AND co.co_number = $2
    `;
    
    const { rows } = await pool.query(query, [courseId, String(coNumber).trim()]);
    return rows[0] || null;
  }

  static async getCourseOutcomeById(coId) {
    this._ensureInt(coId, "co_id");

    const query = `
      SELECT 
        co.co_id, 
        co.course_id, 
        co.co_number, 
        co.description,
        c.code as course_code,
        c.title as course_title
      FROM course_outcomes co
      JOIN courses c ON co.course_id = c.course_id
      WHERE co.co_id = $1
    `;
    
    const { rows } = await pool.query(query, [coId]);
    return rows[0] || null;
  }

  static async updateCourseOutcome(coId, { co_number, description } = {}) {
    this._ensureInt(coId, "co_id");
    this._ensureString(co_number, "co_number");
    this._ensureString(description, "description");

    const sets = [];
    const values = [];
    let idx = 1;

    if (co_number !== undefined) { 
      sets.push(`co_number = $${idx++}`); 
      values.push(String(co_number).trim()); 
    }
    if (description !== undefined) { 
      sets.push(`description = $${idx++}`); 
      values.push(String(description).trim()); 
    }

    if (sets.length === 0) return this.getCourseOutcomeById(coId);

    const query = `
      UPDATE course_outcomes 
      SET ${sets.join(", ")} 
      WHERE co_id = $${idx} 
      RETURNING 
        co_id, course_id, co_number, description,
        (SELECT code FROM courses WHERE course_id = course_outcomes.course_id) as course_code
    `;
    values.push(coId);

    try {
      const { rows } = await pool.query(query, values);
      return rows[0] || null;
    } catch (err) {
      if (err.code === "23505") throw new Error("CO number already exists for this course");
      throw err;
    }
  }

  static async deleteCourseOutcome(coId) {
    this._ensureInt(coId, "co_id");

    const query = `
      DELETE FROM course_outcomes 
      WHERE co_id = $1 
      RETURNING 
        co_id, course_id, co_number, description,
        (SELECT code FROM courses WHERE course_id = course_outcomes.course_id) as course_code
    `;
    
    const { rows } = await pool.query(query, [coId]);
    return rows[0] || null;
  }

  static async searchCourseOutcomes({ courseCode, coNumber, page = 1, limit = CourseOutcome.DEFAULT_LIMIT } = {}) {
    page = Number(page) || 1;
    limit = Number(limit) || CourseOutcome.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    const filters = [];
    const values = [];

    if (courseCode && String(courseCode).trim() !== "") {
      values.push(`%${String(courseCode).trim()}%`);
      filters.push(`c.code ILIKE $${values.length}`);
    }

    if (coNumber && String(coNumber).trim() !== "") {
      values.push(`%${String(coNumber).trim()}%`);
      filters.push(`co.co_number ILIKE $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const countQuery = `
      SELECT COUNT(*)::int AS total 
      FROM course_outcomes co
      JOIN courses c ON co.course_id = c.course_id
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        co.co_id, 
        co.course_id, 
        co.co_number, 
        co.description,
        c.code as course_code,
        c.title as course_title
      FROM course_outcomes co
      JOIN courses c ON co.course_id = c.course_id
      ${whereClause}
      ORDER BY co.co_number ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    // preserve a copy of values for the count query before pushing limit/offset
    const countValues = [...values];
    values.push(limit, offset);

    let client;
    try {
      client = await pool.connect();
      const totalRes = await client.query(countQuery, countValues);
      const total = totalRes.rows[0] ? totalRes.rows[0].total : 0;
      const dataRes = await client.query(dataQuery, values);
      return { rows: dataRes.rows, total, page, limit };
    } finally {
      if (client) {
        try { client.release(); } catch (e) { console.error("Error releasing client in searchCourseOutcomes:", e); }
      }
    }
  }
}

export default CourseOutcome;
