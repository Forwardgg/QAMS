// routes/questionRoutes.js
import express from "express";
import {
  createQuestion,
  updateQuestion,
  getQuestion,
  getQuestionsByPaper,
  deleteQuestion,
  searchQuestions,
  updateQuestionSequence
} from "../controllers/QuestionController.js"; // FIX: Use correct filename
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Protected routes
router.post("/", authenticate, authorizeRoles("instructor", "admin"), createQuestion);
router.get("/search", authenticate, searchQuestions);
router.get("/paper/:paperId", authenticate, getQuestionsByPaper);
router.get("/:id", authenticate, getQuestion);
router.put("/:id", authenticate, authorizeRoles("instructor", "admin"), updateQuestion);
router.delete("/:id", authenticate, authorizeRoles("instructor", "admin"), deleteQuestion);
router.patch("/paper/:paperId/sequence", authenticate, authorizeRoles("instructor", "admin"), updateQuestionSequence);

export default router;