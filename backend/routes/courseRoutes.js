import express from "express";
import {
  getAllCourses,
  getCourseById,
  getCourseByCode,
  createCourse,
  updateCourse,
  deleteCourse,
  searchCourses,
} from "../controllers/CourseController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Public / authenticated (your choice)
router.get("/", getAllCourses);
router.get("/search", searchCourses);
router.get("/code/:code", getCourseByCode);
router.get("/:id", getCourseById);

// Admin-protected
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  createCourse
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  updateCourse
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  deleteCourse
);

export default router;