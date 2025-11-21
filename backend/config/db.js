// config/db.js
import pkg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Clear existing PG env variables in test mode to prevent conflicts
if (process.env.NODE_ENV === "test") {
  // Remove previously loaded PG env vars
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('PG')) {
      delete process.env[key];
    }
  });
}

// appropriate env file (minimal change)
// priority: .env.test (when NODE_ENV=test) -> .env.local (only in development) -> .env
if (process.env.NODE_ENV === "test" && fs.existsSync(".env.test")) {
  dotenv.config({ path: ".env.test", override: true });
} else if (process.env.NODE_ENV === "development" && fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local", override: true });
} else {
  dotenv.config();
}

const { Pool } = pkg;

let ssl;

if (process.env.NODE_ENV === "test") {
  // no SSL for local db
  ssl = false;
  console.log('[db] Test environment - SSL disabled for local DB');
} else {
  // If PGSSLMODE=disable, skip SSL entirely
  if ((process.env.PGSSLMODE || '').toLowerCase() === 'disable') {
    ssl = false;
    console.log('[db] SSL disabled by PGSSLMODE');
  } else {
    // aiven
    const caPath = process.env.PGSSLROOTCERT
      ? path.resolve(process.env.PGSSLROOTCERT)
      : path.resolve("certs/ca.pem");

    if (fs.existsSync(caPath)) {
      ssl = {
        ca: fs.readFileSync(caPath, "utf8"),
        rejectUnauthorized: true,
      };
      console.log(`[db] Using CA file: ${caPath}`);
    } else {
      console.warn(`[db] CA file not found at ${caPath}. Falling back to insecure SSL.`);
      ssl = { require: true, rejectUnauthorized: false };
    }
  }
}

export const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  ssl,
});

// Add connection test function
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('[db] Connected to database:', process.env.PGDATABASE);
    client.release();
    return true;
  } catch (error) {
    console.error('[db] Connection failed:', error.message);
    return false;
  }
};