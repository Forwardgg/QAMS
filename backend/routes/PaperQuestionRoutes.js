// routes/paperQuestionRoutes.js
import express from "express";
import {
  addQuestionToPaper,
  getQuestionsInPaper,
  updatePaperQuestion,
  removeQuestionFromPaper,
  reorderPaperQuestions,
  bulkAddQuestionsToPaper
} from "../controllers/PaperQuestionController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// ------------------- ADD -------------------
// Add question to paper
router.post(
  "/:paperId/:questionId",
  authenticate,
  authorizeRoles("admin", "instructor"),
  addQuestionToPaper
);

// ------------------- GET -------------------
// Get all questions in a paper
router.get("/:paperId", authenticate, getQuestionsInPaper);

// ------------------- UPDATE -------------------
// Update marks/sequence/section of a question in paper
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin", "instructor"),
  updatePaperQuestion
);

// ------------------- DELETE -------------------
// Remove a question from paper
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin", "instructor"),
  removeQuestionFromPaper
);

// Reorder questions in a paper
router.post(
  "/:paperId/reorder",
  authenticate,
  authorizeRoles("admin", "instructor"),
  reorderPaperQuestions
);

// Bulk add questions
router.post(
  "/:paperId/bulk",
  authenticate,
  authorizeRoles("admin", "instructor"),
  bulkAddQuestionsToPaper
);

export default router;
