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

router.post("/", authenticate, authorizeRoles("admin", "instructor"), createCourse); // create course
router.get("/", authenticate, authorizeRoles("admin"), getAllCoursesAdmin); // get all courses (admin)
router.get("/mine", authenticate, authorizeRoles("instructor"), getAllCoursesInstructor); // Instructor → get own courses
router.get("/public", getCoursesPublic); // Public → course code, title, LTP
router.get("/code/:code", getCourseByCode); // Get course by code (public)
router.get("/search", searchCoursesByTitle); // Search courses (public) - by title
router.put("/:id", authenticate, authorizeRoles("admin", "instructor"), updateCourse); // admin can update all, instructor only own
router.delete("/:id", authenticate, authorizeRoles("admin", "instructor"), deleteCourse); // admin can delete all, instructor only own

export default router;