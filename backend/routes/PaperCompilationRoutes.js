// backend/routes/PaperCompilationRoutes.js
import express from "express";
import { paperCompilationController } from "../controllers/PaperCompilationController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET paper template (instructor, admin)
router.get("/:paperId/template", 
  authorizeRoles("instructor", "admin"), 
  paperCompilationController.getPaperTemplate
);

// Generate PDF (instructor, admin)
router.post("/:paperId/generate-pdf", 
  authorizeRoles("instructor", "admin"), 
  paperCompilationController.generatePDF
);

// Submit for moderation (instructor, admin)
router.post("/:paperId/submit", 
  authorizeRoles("instructor", "admin"), 
  paperCompilationController.submitForModeration
);

export default router;