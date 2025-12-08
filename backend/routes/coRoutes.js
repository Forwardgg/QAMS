// routes/coRoutes.js
import express from "express";
import {
  getAllCourseOutcomes,
  getCourseOutcomesByCourseCode,
  getCourseOutcomeByNumber,
  getCourseOutcomeById,
  createCourseOutcome,
  updateCourseOutcome,
  deleteCourseOutcome,
  searchCourseOutcomes,
  getBloomLevels // Import the new function
} from "../controllers/coController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Get all COs
router.get("/", getAllCourseOutcomes);

// Search COs
router.get("/search", searchCourseOutcomes);

// Get available bloom levels
router.get("/bloom-levels", getBloomLevels); // NEW ROUTE

// Get COs by course code
router.get("/course/:code", getCourseOutcomesByCourseCode);

// Get specific CO by course ID and CO number
router.get("/course/:courseId/co/:coNumber", getCourseOutcomeByNumber);

// Get CO by ID
router.get("/:id", getCourseOutcomeById);

// Create CO (admin only)
router.post("/", authenticate, authorizeRoles("admin"), createCourseOutcome);

// Update CO (admin only)
router.put("/:id", authenticate, authorizeRoles("admin"), updateCourseOutcome);

// Delete CO (admin only)
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteCourseOutcome);

export default router;