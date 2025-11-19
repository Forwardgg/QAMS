import express from "express";
import {
  claimPaperForModeration,
  getModerationForPaper,
  getMyModerations,
  approvePaperModeration,
  rejectPaperModeration,
} from "../controllers/PaperModerationController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/claim/:paperId",authenticate,authorizeRoles("moderator"),claimPaperForModeration);// Mod claims paper
router.get("/paper/:paperId",authenticate,authorizeRoles("admin", "instructor", "moderator"),getModerationForPaper);// Get all moderation records for a specific paper
router.get("/my",authenticate,authorizeRoles("moderator"),getMyModerations);// Get papers claimed by moderator
router.patch("/:id/approve",authenticate,authorizeRoles("moderator", "admin"),approvePaperModeration);// Approve a paper moderation record
router.patch("/:id/reject",authenticate,authorizeRoles("moderator", "admin"),rejectPaperModeration);// Reject a paper moderation record

export default router;
