// routes/coRoutes.js
import express from "express";
import {
  createCO,
  getCOsByCourse,
  getAllCoursesWithCOs,
  updateCO,
  deleteCO,
} from "../controllers/coController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Create CO (admin/instructor only)
router.post("/:courseId",authenticate,authorizeRoles("admin", "instructor"),createCO);
// Public routes
router.get("/course/:courseId", getCOsByCourse);   // Get COs for one course
router.get("/all", getAllCoursesWithCOs);          // Get all courses with COs

// Protected routes (admin or instructor)
router.put("/:coId", authenticate, authorizeRoles("admin", "instructor"), updateCO);
router.delete("/:coId", authenticate, authorizeRoles("admin", "instructor"), deleteCO);

export default router;
