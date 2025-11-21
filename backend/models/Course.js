// backend/models/Course.js
import { pool } from "../config/db.js";

export class Course {
  // --- small helpers used by create/update ---
  static ensureRequired(value, name) {
    if (value === undefined || value === null || value === "") {
      throw new Error(`${name} is required.`);
    }
  }

  static validateLTPrange(val, name) {
    if (val === undefined || val === null) return;
    if (!Number.isInteger(val)) throw new Error(`${name} must be an integer`);
    if (val < 0 || val > 9) throw new Error(`${name} must be between 0 and 9`);
  }

  // Create a course
  static async create({ code, title, syllabus, l, t, p }) {
    // required checks
    this.ensureRequired(code, "code");
    this.ensureRequired(title, "title");
    this.ensureRequired(syllabus, "syllabus");

    // l/t/p validation + sensible defaults if caller omitted them
    const lVal = l === undefined || l === null ? 0 : l;
    const tVal = t === undefined || t === null ? 0 : t;
    const pVal = p === undefined || p === null ? 0 : p;

    this.validateLTPrange(lVal, "l");
    this.validateLTPrange(tVal, "t");
    this.validateLTPrange(pVal, "p");

    const query = `
      INSERT INTO courses (code, title, syllabus, l, t, p)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING course_id, code, title, syllabus, l, t, p, created_at;
    `;
    const values = [code, title, syllabus, lVal, tVal, pVal];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0] || null;
    } catch (err) {
      // Unique violation -> likely code conflict
      if (err.code === "23505") {
        throw new Error("Course code already exists.");
      }
      throw err;
    }
  }

  // Get all courses
  static async getAll() {
    const query = `
      SELECT course_id, code, title, syllabus, l, t, p, created_at, updated_at
      FROM courses
      ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // Get a course by id
  static async getById(courseId) {
    const query = `
      SELECT course_id, code, title, syllabus, l, t, p, created_at, updated_at
      FROM courses
      WHERE course_id = $1;
    `;
    const { rows } = await pool.query(query, [courseId]);
    return rows[0] || null;
  }

  // Update course fields. Provide all fields (your current semantics).
    static async update(courseId, { code, title, syllabus, l, t, p }) {
    // basic courseId guard
    if (!Number.isInteger(courseId)) {
      throw new Error("courseId must be an integer.");
    }

    // validate l/t/p if provided
    const validateLTPrangeLocal = (val, name) => {
      if (val === undefined || val === null) return;
      if (!Number.isInteger(val)) throw new Error(`${name} must be an integer.`);
      if (val < 0 || val > 9) throw new Error(`${name} must be between 0 and 9.`);
    };

    validateLTPrangeLocal(l, "l");
    validateLTPrangeLocal(t, "t");
    validateLTPrangeLocal(p, "p");

    // Treat empty strings as "no change" (optional - remove NULLIF if you want to allow empty string)
    const query = `
      UPDATE courses
      SET
        code = COALESCE(NULLIF($1, ''), code),
        title = COALESCE(NULLIF($2, ''), title),
        syllabus = COALESCE(NULLIF($3, ''), syllabus),
        l = COALESCE($4, l),
        t = COALESCE($5, t),
        p = COALESCE($6, p)
      WHERE course_id = $7
      RETURNING course_id, code, title, syllabus, l, t, p, created_at, updated_at;
    `;

    const values = [
      code ?? null,
      title ?? null,
      syllabus ?? null,
      l ?? null,
      t ?? null,
      p ?? null,
      courseId,
    ];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0] || null;
    } catch (err) {
      if (err.code === "23505") {
        // Optionally examine err.constraint to be more specific
        throw new Error("Course code already exists.");
      }
      throw err;
    }
  }
  // Delete a course
  static async delete(courseId) {
    const query = `
      DELETE FROM courses
      WHERE course_id = $1
      RETURNING course_id, code, title, syllabus, created_at;
    `;
    const { rows } = await pool.query(query, [courseId]);
    return rows[0] || null;
  }

  // Get a course by its unique code
  static async getByCode(code) {
    const query = `
      SELECT course_id, code, title, syllabus, l, t, p, created_at, updated_at
      FROM courses
      WHERE code = $1;
    `;
    const { rows } = await pool.query(query, [code]);
    return rows[0] || null;
  }

// Search courses by title (case-insensitive)
static async searchByTitle(title) {
  // GUARD: avoid returning entire DB when empty search
  if (!title || !title.trim()) {
    return [];
  }

  const query = `
    SELECT course_id, code, title, syllabus, l, t, p, created_at, updated_at
    FROM courses
    WHERE title ILIKE $1
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query, [`%${title}%`]);
  return rows;
}

}
