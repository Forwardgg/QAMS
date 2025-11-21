// backend/models/User.js
import { pool } from "../config/db.js";

export class User {
  static allowedRoles = ["admin", "instructor", "moderator"];
  static allowedStatuses = ["active", "inactive"];

  // Helpers
  static _ensureInteger(val, name) {
    if (!Number.isInteger(val)) throw new Error(`${name} must be an integer.`);
  }
  static _ensureNonEmptyString(val, name) {
    if (val === undefined || val === null || String(val).trim() === "") {
      throw new Error(`${name} is required.`);
    }
  }
  static _normalizeEmail(email) {
    return String(email).trim().toLowerCase();
  }
  static _validateEmailFormat(email) {
    // small conservative check; delegate strict checks elsewhere if needed
    const e = String(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      throw new Error("Invalid email format.");
    }
  }

  // Create user - expects passwordHash already computed and role normalized
  static async create({ name, email, passwordHash, role }) {
    this._ensureNonEmptyString(name, "name");
    this._ensureNonEmptyString(email, "email");
    this._ensureNonEmptyString(passwordHash, "passwordHash");

    const normalizedEmail = this._normalizeEmail(email);
    this._validateEmailFormat(normalizedEmail);

    const roleNormalized = String(role).toLowerCase();
    if (!this.allowedRoles.includes(roleNormalized)) {
      throw new Error(`Invalid role. Allowed: ${this.allowedRoles.join(", ")}`);
    }

    const query = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, name, email, role, status, created_at, updated_at;
    `;
    const values = [name, normalizedEmail, passwordHash, roleNormalized];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0] || null;
    } catch (err) {
      // duplicate email
      if (err.code === "23505") {
        throw new Error("EMAIL_ALREADY_IN_USE");
      }
      throw err;
    }
  }

  // Internal: returns full user row (including password_hash) — use only for auth flows
  static async findByEmail(email) {
    if (!email) return null;
    const normalized = this._normalizeEmail(email);
    const query = `
      SELECT * FROM users 
      WHERE LOWER(email) = LOWER($1) 
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [normalized]);
    return rows[0] || null;
  }

  // Safe public lookup (never returns password_hash)
  static async findPublicById(userId) {
    this._ensureInteger(userId, "userId");
    const query = `
      SELECT user_id, name, email, role, status, created_at, updated_at
      FROM users
      WHERE user_id = $1;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0] || null;
  }

  // Internal full lookup by id (may include password_hash) — use only for internal/auth
  static async findById(userId) {
    this._ensureInteger(userId, "userId");
    const query = `SELECT * FROM users WHERE user_id = $1;`;
    const { rows } = await pool.query(query, [userId]);
    return rows[0] || null;
  }

  // Admin list (paginated could be added)
  static async getAll() {
    const query = `
      SELECT user_id, name, email, role, status, created_at, updated_at
      FROM users;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  static async updateStatus(userId, status) {
    this._ensureInteger(userId, "userId");
    if (!this.allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${this.allowedStatuses.join(", ")}`);
    }
    const query = `
      UPDATE users 
      SET status = $1,
          updated_at = NOW()
      WHERE user_id = $2 
      RETURNING user_id, name, email, role, status, created_at, updated_at;
    `;
    const { rows } = await pool.query(query, [status, userId]);
    return rows[0] || null;
  }

  static async updateProfile(userId, { name, email, role }) {
    this._ensureInteger(userId, "userId");

    let roleNormalized = null;
    if (role !== undefined && role !== null) {
      roleNormalized = String(role).toLowerCase();
      if (!this.allowedRoles.includes(roleNormalized)) {
        throw new Error(`Invalid role. Allowed: ${this.allowedRoles.join(", ")}`);
      }
    }

    let normalizedEmail = null;
    if (email !== undefined && email !== null) {
      normalizedEmail = this._normalizeEmail(email);
      this._validateEmailFormat(normalizedEmail);
    }

    const query = `
      UPDATE users
      SET name = COALESCE(NULLIF($1, ''), name),
          email = COALESCE($2, email),
          role = COALESCE($3, role),
          updated_at = NOW()
      WHERE user_id = $4
      RETURNING user_id, name, email, role, status, created_at, updated_at;
    `;
    const values = [
      name ?? null,
      normalizedEmail ?? null,
      roleNormalized ?? null,
      userId,
    ];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0] || null;
    } catch (err) {
      if (err.code === "23505") {
        throw new Error("EMAIL_ALREADY_IN_USE");
      }
      throw err;
    }
  }

  static async updatePassword(userId, passwordHash) {
    this._ensureInteger(userId, "userId");
    this._ensureNonEmptyString(passwordHash, "passwordHash");

    const query = `
      UPDATE users
      SET password_hash = $1,
          updated_at = NOW()
      WHERE user_id = $2
      RETURNING user_id, name, email, role, status, created_at, updated_at;
    `;
    const { rows } = await pool.query(query, [passwordHash, userId]);
    return rows[0] || null;
  }

  // Soft delete
  static async softDelete(userId) {
    this._ensureInteger(userId, "userId");
    const query = `
      UPDATE users
      SET status = 'inactive',
          updated_at = NOW()
      WHERE user_id = $1
      RETURNING user_id, status, updated_at;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0] || null;
  }

  // Hard delete
  static async forceDelete(userId) {
    this._ensureInteger(userId, "userId");
    const query = `
      DELETE FROM users 
      WHERE user_id = $1
      RETURNING user_id;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0] || null;
  }
}
