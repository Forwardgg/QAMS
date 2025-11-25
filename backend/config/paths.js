// backend/config/paths.js
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Expose a single canonical uploads folder used by server and service
export const UPLOADS_DIR = path.join(__dirname, '..', 'uploads'); // backend/uploads
export const QUESTIONS_SUBFOLDER = 'images/questions';
export const PAPERS_SUBFOLDER = 'images/papers';
export const TEMP_SUBFOLDER = 'temp';
