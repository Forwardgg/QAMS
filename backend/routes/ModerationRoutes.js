import express from "express";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

//router.post("/claim/:paperId",authenticate,authorizeRoles("moderator"),claimPaperForModeration);// Mod claims paper
//router.get("/paper/:paperId",authenticate,authorizeRoles("admin", "instructor", "moderator"),getModerationForPaper);// Get all moderation records for a specific paper
//router.get("/my",authenticate,authorizeRoles("moderator"),getMyModerations);// Get papers claimed by moderator
//router.patch("/:id/approve",authenticate,authorizeRoles("moderator", "admin"),approvePaperModeration);// Approve a paper moderation record
//router.patch("/:id/reject",authenticate,authorizeRoles("moderator", "admin"),rejectPaperModeration);// Reject a paper moderation record
//router.post("/claim/:paperId/:questionId", authenticate, authorizeRoles("moderator"), claimQuestionForModeration); // Claim question for moderation
//router.get("/paper/:paperId", authenticate, authorizeRoles("admin", "instructor", "moderator"), getModerationForPaperQuestions); // Get moderations for paper
//router.get("/question/:questionId", authenticate, authorizeRoles("admin", "instructor", "moderator"), getModerationForQuestion); // Get moderations for question
//router.get("/my", authenticate, authorizeRoles("moderator"), getMyQuestionModerations); // Get my moderations
//router.patch("/:id/approve", authenticate, authorizeRoles("moderator", "admin"), approveQuestionModeration); // Approve moderation
//router.patch("/:id/reject", authenticate, authorizeRoles("moderator", "admin"), rejectQuestionModeration); // Reject moderation

export default router;
