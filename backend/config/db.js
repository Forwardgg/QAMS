import pkg from "pg";
import dotenv from "dotenv";
import fs from "fs";

// Prefer .env.test if NODE_ENV=test
if (process.env.NODE_ENV === "test" && fs.existsSync(".env.test")) {
  dotenv.config({ path: ".env.test" });
} else if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config();
}

const { Pool } = pkg;

export const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: 5432,
  ssl: false
});
