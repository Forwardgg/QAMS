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


router.post("/:paperId/bulk",authenticate,authorizeRoles("admin", "instructor"),bulkAddQuestionsToPaper);// Bulk add questions to paper (must come before single add)
router.post("/:paperId/:questionId",authenticate,authorizeRoles("admin", "instructor"),addQuestionToPaper);// Add single question to paper
router.get("/:paperId", authenticate, getQuestionsInPaper);// Get all questions in a paper
router.put("/:pqId",authenticate,authorizeRoles("admin", "instructor"),updatePaperQuestion);// Update marks/sequence/section of a mapping
router.put("/:paperId/reorder",authenticate,authorizeRoles("admin", "instructor"),reorderPaperQuestions);// Reorder all questions in a paper
router.delete("/:pqId",authenticate,authorizeRoles("admin", "instructor"),removeQuestionFromPaper);// Remove a question from a paper

export default router;
