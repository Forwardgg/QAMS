// backend/routes/uploadRoutes.js
import express from "express";
import multer from "multer";
import {
  uploadFile,
  getUploadConfig,
} from "../controllers/UploadController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Multer memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// --- Upload route with Multer error handling ---
router.post(
  "/",
  authenticate,
  authorizeRoles("instructor", "admin"),
  (req, res, next) => {
    upload.single("file")(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      }
      next(err);
    });
  },
  uploadFile
);

// --- Get Upload Config ---
router.get("/config", authenticate, getUploadConfig);

export default router;
