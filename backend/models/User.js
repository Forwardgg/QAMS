import { pool } from "../config/db.js";

export class User {
  static allowedRoles = ["admin", "instructor", "moderator"];
  static allowedStatuses = ["active", "inactive", "suspended"];

  // ------------------- CREATE -------------------
  static async create({ name, email, passwordHash, role }) {
    if (!this.allowedRoles.includes(role)) {
      throw new Error(`Invalid role. Allowed: ${this.allowedRoles.join(", ")}`);
    }

    const query = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, name, email, role, status, created_at;
    `;
    const values = [name, email, passwordHash, role];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // ------------------- READ -------------------
  static async findByEmail(email) {
    const query = `SELECT * FROM users WHERE email = $1 LIMIT 1;`;
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  }

  static async findById(userId) {
    const query = `SELECT * FROM users WHERE user_id = $1;`;
    const { rows } = await pool.query(query, [userId]);
    return rows[0];
  }

  static async getAll() {
    const query = `SELECT user_id, name, email, role, status, created_at FROM users;`;
    const { rows } = await pool.query(query);
    return rows;
  }

  // ------------------- UPDATE -------------------
  static async updateStatus(userId, status) {
    if (!this.allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${this.allowedStatuses.join(", ")}`);
    }

    const query = `
      UPDATE users 
      SET status = $1 
      WHERE user_id = $2 
      RETURNING user_id, name, email, role, status;
    `;
    const { rows } = await pool.query(query, [status, userId]);
    return rows[0];
  }

  static async updateProfile(userId, { name, email, role }) {
    if (role && !this.allowedRoles.includes(role)) {
      throw new Error(`Invalid role. Allowed: ${this.allowedRoles.join(", ")}`);
    }

    const query = `
      UPDATE users
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          role = COALESCE($3, role)
      WHERE user_id = $4
      RETURNING user_id, name, email, role, status, created_at;
    `;
    const values = [name, email, role, userId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async updatePassword(userId, passwordHash) {
    const query = `
      UPDATE users
      SET password_hash = $1
      WHERE user_id = $2
      RETURNING user_id, email;
    `;
    const { rows } = await pool.query(query, [passwordHash, userId]);
    return rows[0];
  }

  // ------------------- DELETE -------------------
  static async delete(userId) {
    const query = `DELETE FROM users WHERE user_id = $1 RETURNING user_id;`;
    const { rows } = await pool.query(query, [userId]);
    return rows[0];
  }
}
