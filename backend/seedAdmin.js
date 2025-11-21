// backend/seedAdmin.js
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import pkg from "pg";

// CLEAR any existing PG environment variables first
Object.keys(process.env).forEach(key => {
  if (key.startsWith('PG')) {
    delete process.env[key];
  }
});

// Force-load .env.local for local database
dotenv.config({ path: ".env.local", override: true });

const { Pool } = pkg;

// Create a direct database connection using EXPLICIT local values
const pool = new Pool({
  user: "postgres", // Hardcoded to ensure local DB
  host: "localhost", // Hardcoded to ensure local DB
  database: "qams_local", // Hardcoded to ensure local DB
  password: "roitmahan", // Hardcoded to ensure local DB
  port: 5432, // Hardcoded to ensure local DB
  ssl: false // Local DB doesn't need SSL
});

const seedAdmin = async () => {
  try {
    // Admin details
    const email = "rohit1@gmail.com";
    const plainPassword = "password123";
    const name = "Super Admin";

    // Test connection first
    const client = await pool.connect();
    console.log("Connected to local database successfully");
    
    const testResult = await client.query('SELECT current_database(), version()');
    
    client.release();
    // Hash password
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    // Insert or update admin
    const query = `
      INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          status = 'active',
          updated_at = NOW()
      RETURNING user_id, email, role, status;
    `;

    const values = [name, email.toLowerCase(), passwordHash, "admin"];
    const { rows } = await pool.query(query, values);

    console.log(`   Email: ${email}`);
    console.log(`   Password: ${plainPassword}`);
  } catch (err) {
    console.error("Error seeding admin:", err.message);
    
    // More detailed error info
    if (err.code === 'ECONNREFUSED') {
      console.error("Make sure PostgreSQL is running on localhost:5432");
      console.error("Check if pgAdmin is running and database 'qams_local' exists");
    }
  } finally {
    await pool.end();
  }
};

seedAdmin();