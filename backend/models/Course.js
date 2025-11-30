// src/backend/models/Course.js
import { pool } from "../config/db.js";

export class Course {
  static DEFAULT_LIMIT = 25;
  static _ensureRequiredString(val, name) {
    if (val === undefined || val === null || String(val).trim() === "") throw new Error(`${name} is required`);
  }
  static _ensureString(val, name) {
    if (val === undefined || val === null) return;
    if (typeof val !== "string") throw new Error(`${name} must be a string`);
  }
  static _ensureIntRange(val, name, min = 0, max = 9) {
    if (val === undefined || val === null) return;
    if (!Number.isInteger(val)) throw new Error(`${name} must be an integer`);
    if (val < min || val > max) throw new Error(`${name} must be between ${min} and ${max}`);
  }

  static async createCourse({ code, title, syllabus, l = 0, t = 0, p = 0 }) {
    this._ensureRequiredString(code, "code");
    this._ensureRequiredString(title, "title");
    this._ensureRequiredString(syllabus, "syllabus");
    this._ensureIntRange(l, "l");
    this._ensureIntRange(t, "t");
    this._ensureIntRange(p, "p");

    const query = `INSERT INTO courses (code, title, syllabus, l, t, p) VALUES ($1,$2,$3,$4,$5,$6) RETURNING course_id, code, title, syllabus, l, t, p, created_at, updated_at`;
    const values = [String(code).trim(), String(title).trim(), syllabus, l, t, p];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (err) {
      if (err.code === "23505") throw new Error("Course code already exists");
      throw err;
    }
  }

  static async getAllCourses({ page = 1, limit = Course.DEFAULT_LIMIT, search = "", orderBy = "created_at", order = "desc" } = {}) {
    page = Number(page) || 1;
    limit = Number(limit) || Course.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;
    const allowedOrderBy = new Set(["created_at", "updated_at", "title", "code"]);
    if (!allowedOrderBy.has(orderBy)) orderBy = "created_at";
    order = String(order).toLowerCase() === "asc" ? "ASC" : "DESC";

    const filters = [];
    const values = [];

    if (search && String(search).trim() !== "") {
      values.push(`%${String(search).trim()}%`);
      filters.push(`(title ILIKE $${values.length} OR code ILIKE $${values.length})`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const countQuery = `SELECT COUNT(*)::int AS total FROM courses ${whereClause}`;
    const dataQuery = `SELECT course_id, code, title, syllabus, l, t, p, created_at, updated_at FROM courses ${whereClause} ORDER BY ${orderBy} ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

    values.push(limit, offset);

    const client = await pool.connect();
    try {
      const totalRes = await client.query(countQuery, values.slice(0, values.length - 2));
      const total = totalRes.rows[0] ? totalRes.rows[0].total : 0;
      const dataRes = await client.query(dataQuery, values);
      return { rows: dataRes.rows, total, page, limit };
    } finally {
      client.release();
    }
  }

  static async getCourseById(courseId) {
    if (!Number.isInteger(courseId)) throw new Error("courseId must be an integer");
    const query = `SELECT course_id, code, title, syllabus, l, t, p, created_at, updated_at FROM courses WHERE course_id = $1`;
    const { rows } = await pool.query(query, [courseId]);
    return rows[0] || null;
  }

  static async getCourseByCode(code) {
    if (!code || String(code).trim() === "") throw new Error("code is required");
    const query = `SELECT course_id, code, title, syllabus, l, t, p, created_at, updated_at FROM courses WHERE code = $1`;
    const { rows } = await pool.query(query, [String(code).trim()]);
    return rows[0] || null;
  }

  static async updateCourse(courseId, { code, title, syllabus, l, t, p } = {}) {
    if (!Number.isInteger(courseId)) throw new Error("courseId must be an integer");
    this._ensureString(code, "code");
    this._ensureString(title, "title");
    this._ensureString(syllabus, "syllabus");
    this._ensureIntRange(l, "l");
    this._ensureIntRange(t, "t");
    this._ensureIntRange(p, "p");

    const sets = [];
    const values = [];
    let idx = 1;

    if (code !== undefined) { sets.push(`code = $${idx++}`); values.push(code === null ? null : String(code).trim()); }
    if (title !== undefined) { sets.push(`title = $${idx++}`); values.push(title === null ? null : String(title).trim()); }
    if (syllabus !== undefined) { sets.push(`syllabus = $${idx++}`); values.push(syllabus); }
    if (l !== undefined) { sets.push(`l = $${idx++}`); values.push(l); }
    if (t !== undefined) { sets.push(`t = $${idx++}`); values.push(t); }
    if (p !== undefined) { sets.push(`p = $${idx++}`); values.push(p); }

    if (sets.length === 0) return this.getCourseById(courseId);

    const query = `UPDATE courses SET ${sets.join(", ")} WHERE course_id = $${idx} RETURNING course_id, code, title, syllabus, l, t, p, created_at, updated_at`;
    values.push(courseId);

    try {
      const { rows } = await pool.query(query, values);
      return rows[0] || null;
    } catch (err) {
      if (err.code === "23505") throw new Error("Course code already exists");
      throw err;
    }
  }

  static async deleteCourse(courseId) {
    if (!Number.isInteger(courseId)) throw new Error("courseId must be an integer");
    const query = `DELETE FROM courses WHERE course_id = $1 RETURNING course_id, code, title`;
    const { rows } = await pool.query(query, [courseId]);
    return rows[0] || null;
  }

  static async searchCourses({ q = "", page = 1, limit = Course.DEFAULT_LIMIT } = {}) {
    return this.getAllCourses({ page, limit, search: q });
  }
}
