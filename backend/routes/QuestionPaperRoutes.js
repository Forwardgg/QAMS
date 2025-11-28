import express from "express";
import {
  createQuestionPaper,
  getAllPapers,
  getPapersByCourse,
  getPapersByCourseAndCO,
  updatePaper,
  deletePaper,
  submitForModeration
} from "../controllers/QuestionPaperController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Create question paper (instructor only)
router.post("/", authenticate, authorizeRoles("instructor"), createQuestionPaper);

// Get all papers (all authenticated users)
router.get("/", authenticate, getAllPapers);

// Get papers by course code (all authenticated users)
router.get("/course/:courseCode", authenticate, getPapersByCourse);

// Get papers by course code and CO number (all authenticated users)
router.get("/course/:courseCode/co/:coNumber", authenticate, getPapersByCourseAndCO);

// Submit for moderation — use :paperId to match controllers
router.post("/:paperId/submit-for-moderation", authenticate, authorizeRoles("instructor"), submitForModeration);

// Update & delete — admin or instructor (use same param name)
router.put("/:paperId", authenticate, authorizeRoles("admin", "instructor"), updatePaper);
router.delete("/:paperId", authenticate, authorizeRoles("admin", "instructor"), deletePaper);

export default router;
