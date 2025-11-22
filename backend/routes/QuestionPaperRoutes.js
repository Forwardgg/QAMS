import express from "express";
import {
  createQuestionPaper,
  getAllPapers,
  getPapersByCourse,
  getPapersByCourseAndCO,
  updatePaper,
  deletePaper
} from "../controllers/questionPaperController.js";
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

// Update paper (admin, instructor - their own paper)
router.put("/:paperId", authenticate, authorizeRoles("admin", "instructor"), updatePaper);

// Delete paper (admin, instructor - their own paper)
router.delete("/:paperId", authenticate, authorizeRoles("admin", "instructor"), deletePaper);

export default router;