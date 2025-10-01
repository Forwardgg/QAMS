import express from "express";
import {
  createCourse,
  getAllCoursesAdmin,
  getAllCoursesInstructor,
  getCoursesPublic,
  updateCourse,
  deleteCourse,
  getCourseByCode,
  searchCoursesByTitle
} from "../controllers/CourseController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Create course (admin or instructor)
router.post("/", authenticate, authorizeRoles("admin", "instructor"), createCourse);

// Admin → get all courses with total
router.get("/admin", authenticate, authorizeRoles("admin"), getAllCoursesAdmin);

// Instructor → get own courses with total
router.get("/instructor", authenticate, authorizeRoles("instructor"), getAllCoursesInstructor);

// Public → everyone can see course code, title, ltp
router.get("/public", getCoursesPublic);

// Search by code (everyone can access)
router.get("/code/:code", getCourseByCode);

// Search by title (everyone can access)
router.get("/search", searchCoursesByTitle);

// Update (admin can update all, instructor only own)
router.put("/:id", authenticate, authorizeRoles("admin", "instructor"), updateCourse);

// Delete (admin can delete all, instructor only own)
router.delete("/:id", authenticate, authorizeRoles("admin", "instructor"), deleteCourse);

export default router;
