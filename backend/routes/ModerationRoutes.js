import express from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import {
  getPapersForModeration,
  getPaperDetails,
  startModeration,
  updateQuestionStatus,
  bulkUpdateQuestionStatus,
  submitModerationReport,
  getModerationHistory,
  getCOBreakdown
} from "../controllers/moderatorController.js";

const router = express.Router();

// Get papers available for moderation (filter by course)
router.get("/papers", 
  authenticate, 
  authorizeRoles("moderator"), 
  getPapersForModeration
);

// Get paper details with questions for moderation
router.get("/papers/:id", 
  authenticate, 
  authorizeRoles("moderator"), 
  getPaperDetails
);

// Start moderating a paper (changes status to under_review)
router.post("/papers/:id/start", 
  authenticate, 
  authorizeRoles("moderator"), 
  startModeration
);

// Update individual question status (approve/change_requested)
router.patch("/questions/:id", 
  authenticate, 
  authorizeRoles("moderator"), 
  updateQuestionStatus
);

// Bulk update question statuses
router.patch("/questions/bulk-status", 
  authenticate, 
  authorizeRoles("moderator"), 
  bulkUpdateQuestionStatus
);

// Submit final moderation report
router.post("/moderations", 
  authenticate, 
  authorizeRoles("moderator"), 
  submitModerationReport
);

// Get moderation history for current moderator
router.get("/moderations", 
  authenticate, 
  authorizeRoles("moderator"), 
  getModerationHistory
);

// Get questions grouped by CO for moderation report
router.get("/papers/:id/co-breakdown", 
  authenticate, 
  authorizeRoles("moderator"), 
  getCOBreakdown
);

export default router;