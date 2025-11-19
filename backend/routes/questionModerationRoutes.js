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

router.post("/claim/:paperId/:questionId", authenticate, authorizeRoles("moderator"), claimQuestionForModeration); // Claim question for moderation
router.get("/paper/:paperId", authenticate, authorizeRoles("admin", "instructor", "moderator"), getModerationForPaperQuestions); // Get moderations for paper
router.get("/question/:questionId", authenticate, authorizeRoles("admin", "instructor", "moderator"), getModerationForQuestion); // Get moderations for question
router.get("/my", authenticate, authorizeRoles("moderator"), getMyQuestionModerations); // Get my moderations
router.patch("/:id/approve", authenticate, authorizeRoles("moderator", "admin"), approveQuestionModeration); // Approve moderation
router.patch("/:id/reject", authenticate, authorizeRoles("moderator", "admin"), rejectQuestionModeration); // Reject moderation

export default router;