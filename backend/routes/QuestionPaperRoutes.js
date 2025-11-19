import express from "express";
import {
  createPaper,
  getAllPapers,
  getPaperById,
  updatePaper,
  deletePaper,
  submitPaper,
  approvePaper,
  rejectPaper,
} from "../controllers/QuestionPaperController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticate, authorizeRoles("admin", "instructor"), createPaper); // Create paper
router.get("/", authenticate, getAllPapers); // Get all papers
router.get("/:paperId", authenticate, getPaperById); // Get paper by ID
router.put("/:paperId", authenticate, authorizeRoles("admin", "instructor"), updatePaper); // Update paper
router.delete("/:paperId", authenticate, authorizeRoles("admin", "instructor"), deletePaper); // Delete paper
router.post("/:paperId/submit", authenticate, authorizeRoles("admin", "instructor"), submitPaper); // Submit paper
router.post("/:paperId/approve", authenticate, authorizeRoles("admin", "moderator"), approvePaper); // Approve paper
router.post("/:paperId/reject", authenticate, authorizeRoles("admin", "moderator"), rejectPaper); // Reject paper

export default router;