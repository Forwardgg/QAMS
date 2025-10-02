// jest.setup.js
import { pool } from "../backend/config/db.js";
import bcrypt from "bcrypt";

// Run once before all tests
beforeAll(async () => {
  await pool.query(`
    TRUNCATE 
      courses,
      users,
      course_outcomes,
      questions,
      options,
      question_media,
      question_papers,
      paper_questions,
      paper_moderation,
      question_moderation,
      logs
    RESTART IDENTITY CASCADE
  `);

  // Seed admin
  const adminHash = await bcrypt.hash("adminpassword", 6); // lower salt for faster tests
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
     ON CONFLICT (email) DO NOTHING`,
    ["Admin User", "admin@example.com", adminHash, "admin"]
  );

  // Seed instructor
  const instructorHash = await bcrypt.hash("instructorpassword", 6);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
     ON CONFLICT (email) DO NOTHING`,
    ["Seed Instructor", "seed_instructor@example.com", instructorHash, "instructor"]
  );
});

// Clean up pool once at the end
afterAll(async () => {
  await pool.end();
});
