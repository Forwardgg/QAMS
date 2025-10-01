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

// Moderator claims a paper
router.post(
  "/claim/:paperId",
  authenticate,
  authorizeRoles("moderator"),
  claimPaperForModeration
);

// Get moderation records for a paper (admin, instructor, moderator)
router.get(
  "/paper/:paperId",
  authenticate,
  authorizeRoles("admin", "instructor", "moderator"),
  getModerationForPaper
);

// Get papers claimed by logged-in moderator
router.get(
  "/my",
  authenticate,
  authorizeRoles("moderator"),
  getMyModerations
);

// Moderator/Admin approves or rejects
router.post(
  "/:id/approve",
  authenticate,
  authorizeRoles("moderator", "admin"),
  approvePaperModeration
);

router.post(
  "/:id/reject",
  authenticate,
  authorizeRoles("moderator", "admin"),
  rejectPaperModeration
);

export default router;
