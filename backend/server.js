// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { pool } from "./config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import coRoutes from "./routes/coRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import questionPaperRoutes from "./routes/QuestionPaperRoutes.js";
import ModerationRoutes from "./routes/ModerationRoutes.js";
import paperCompilationRoutes from "./routes/PaperCompilationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths directly (remove import from paths.js)
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const QUESTIONS_SUBFOLDER = 'images/questions';
const PAPERS_SUBFOLDER = 'images/papers';
const TEMP_SUBFOLDER = 'temp';

dotenv.config();

const app = express();

// -------------------- Basic middleware --------------------
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://frontend:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Serve static uploads directory
app.use('/uploads', express.static(UPLOADS_DIR));

// -------------------- Ensure uploads directory exists --------------------
const ensureUploadsDir = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('Uploads directory created at:', UPLOADS_DIR);
  }

  const subDirs = [
    QUESTIONS_SUBFOLDER,
    PAPERS_SUBFOLDER,
    TEMP_SUBFOLDER
  ];

  subDirs.forEach(dir => {
    const fullPath = path.join(UPLOADS_DIR, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log('Created subdirectory:', fullPath);
    }
  });
};

ensureUploadsDir();

// -------------------- App routes --------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/cos", coRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/papers", questionPaperRoutes);
app.use("/api/moderation", ModerationRoutes);
app.use("/api/paper", paperCompilationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/pdf", uploadRoutes);

// REMOVE THIS DUPLICATE UPLOAD ROUTE - it's already in uploadRoutes.js
// const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: UploadService.maxFileSize } });
// app.post('/api/upload/questions', upload.single('file'), async (req, res, next) => { ... });

// Health & DB test
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uploadsPath: UPLOADS_DIR
  });
});

app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/test-uploads", (req, res) => {
  res.json({
    uploadsPath: UPLOADS_DIR,
    absoluteUrl: `${req.protocol}://${req.get('host')}/uploads`,
    directories: {
      questions: `/uploads/${QUESTIONS_SUBFOLDER}/`,
      papers: `/uploads/${PAPERS_SUBFOLDER}/`,
      temp: `/uploads/${TEMP_SUBFOLDER}/`
    }
  });
});

// 404 Handler (must appear before error handler)
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error Handling Middleware (last)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack || err);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Server Start (avoid starting in test env)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Uploads directory: ${UPLOADS_DIR}`);
    console.log(`Uploads serving at: http://localhost:${PORT}/uploads`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;