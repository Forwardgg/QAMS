// backend/routes/questionRoutes.js
import express from "express";
import { QuestionController } from "../controllers/QuestionController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Get all questions by course code (public)
router.get("/course/:courseCode", QuestionController.getQuestionsByCourseCode);

// Get all questions by course code and paper (public)  
router.get("/course/:courseCode/paper/:paperId", QuestionController.getQuestionsByCourseAndPaper);

// Get single question by ID (public)
router.get("/:questionId", QuestionController.getQuestionById);

// Create subjective question - instructor only
router.post("/subjective", authenticate, authorizeRoles("instructor"), QuestionController.createSubjectiveQuestion);

// Create objective question - instructor only
router.post("/objective", authenticate, authorizeRoles("instructor"), QuestionController.createObjectiveQuestion);

// Update question - instructor (own papers) or admin
router.put("/:questionId", authenticate, authorizeRoles("admin", "instructor"), QuestionController.updateQuestion);

// Delete question - instructor (own papers) or admin
router.delete("/:questionId", authenticate, authorizeRoles("admin", "instructor"), QuestionController.deleteQuestion);

export default router;