import express from "express";
import {
  claimQuestionForModeration,
  getModerationForPaperQuestions,
  getModerationForQuestion,
  getMyQuestionModerations,
  approveQuestionModeration,
  rejectQuestionModeration,
} from "../controllers/QuestionModerationController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Moderator claims a question inside a paper
router.post(
  "/claim/:paperId/:questionId",
  authenticate,
  authorizeRoles("moderator"),
  claimQuestionForModeration
);

// Get moderation records for all questions in a paper
router.get(
  "/paper/:paperId",
  authenticate,
  authorizeRoles("admin", "instructor", "moderator"),
  getModerationForPaperQuestions
);

// Get moderation records for a specific question
router.get(
  "/question/:questionId",
  authenticate,
  authorizeRoles("admin", "instructor", "moderator"),
  getModerationForQuestion
);

// Get logged-in moderator's question moderations
router.get(
  "/my",
  authenticate,
  authorizeRoles("moderator"),
  getMyQuestionModerations
);

// Approve / Reject moderation
router.post(
  "/:id/approve",
  authenticate,
  authorizeRoles("moderator", "admin"),
  approveQuestionModeration
);

router.post(
  "/:id/reject",
  authenticate,
  authorizeRoles("moderator", "admin"),
  rejectQuestionModeration
);

export default router;
