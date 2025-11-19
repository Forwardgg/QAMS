import express from "express";
import {
  addSubjectiveQuestion,
  addMCQQuestion,
  getQuestionsForPaper,
  getQuestionsForCourse,
  getQuestionsForCourseAndPaper,
  updateQuestion,
  deleteQuestion,
} from "../controllers/QuestionController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/subjective/:courseId", authenticate, authorizeRoles("admin", "instructor"), addSubjectiveQuestion); // Add subjective question
router.post("/mcq/:courseId", authenticate, authorizeRoles("admin", "instructor"), addMCQQuestion); // Add MCQ question
router.get("/paper/:paperId", getQuestionsForPaper); // Get questions for paper
router.get("/course/:courseId", getQuestionsForCourse); // Get questions for course
router.get("/course/:courseId/paper/:paperId", getQuestionsForCourseAndPaper); // Get questions for course & paper
router.put("/:questionId", authenticate, authorizeRoles("admin", "instructor"), updateQuestion); // Update question
router.delete("/:questionId", authenticate, authorizeRoles("admin", "instructor"), deleteQuestion); // Delete question

export default router;