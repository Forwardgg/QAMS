// backend/controllers/QuestionController.js
import { Question } from '../models/Question.js';
import { Course } from '../models/Course.js';
import { QuestionPaper } from '../models/QuestionPaper.js';
import { Option } from '../models/Option.js';
import { QuestionMedia } from '../models/QuestionMedia.js';

export class QuestionController {

  // 1. Get all questions by course code
  static async getQuestionsByCourseCode(req, res) {
    try {
      const { courseCode } = req.params;
      if (!courseCode || String(courseCode).trim() === "") {
        return res.status(400).json({ success: false, message: 'Course code is required' });
      }

      // Verify course exists
      const course = await Course.getCourseByCode(courseCode);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const questions = await Question.getByCourseCode(courseCode);

      return res.status(200).json({
        success: true,
        data: { course, questions, count: Array.isArray(questions) ? questions.length : 0 }
      });
    } catch (error) {
      console.error('Error getting questions by course code:', error);
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  // 2. Get all questions by course code and question paper
  static async getQuestionsByCourseAndPaper(req, res) {
    try {
      const { courseCode, paperId } = req.params;
      if (!courseCode || String(courseCode).trim() === "" || !paperId) {
        return res.status(400).json({ success: false, message: 'Course code and paper ID are required' });
      }

      const paperIdNum = Number.parseInt(paperId, 10);
      if (Number.isNaN(paperIdNum)) {
        return res.status(400).json({ success: false, message: 'Invalid paper ID' });
      }

      // Verify course exists
      const course = await Course.getCourseByCode(courseCode);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const questions = await Question.getByCourseCodeAndPaper(courseCode, paperIdNum);

      return res.status(200).json({
        success: true,
        data: { course, paperId: paperIdNum, questions, count: Array.isArray(questions) ? questions.length : 0 }
      });
    } catch (error) {
      console.error('Error getting questions by course and paper:', error);
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  // 3. Create subjective question - instructor only (for their own QuestionPaper)
  static async createSubjectiveQuestion(req, res) {
    try {
      const courseIdRaw = req.body.courseId ?? req.body.course_id;
      const paperIdRaw = req.body.paperId ?? req.body.paper_id;
      const content = req.body.content;
      const coIdRaw = req.body.coId ?? req.body.co_id ?? null;

      const userId = req.user?.user_id; // middleware provides user_id
      const userRole = req.user?.role;

      // Check role (middleware authorizeRoles also enforces, but double-check)
      if (userRole !== 'instructor') {
        return res.status(403).json({ success: false, message: 'Only instructors can create questions' });
      }

      // Validate fields and parse integers
      const courseId = Number.parseInt(courseIdRaw, 10);
      const paperId = Number.parseInt(paperIdRaw, 10);
      const coId = coIdRaw === null || coIdRaw === undefined ? null : Number.parseInt(coIdRaw, 10);

      if (Number.isNaN(courseId) || Number.isNaN(paperId) || !content || String(content).trim() === "") {
        return res.status(400).json({ success: false, message: 'courseId, paperId, and content are required and must be valid' });
      }

      // Verify paper ownership (ensure we pass integers)
      const isOwner = await QuestionPaper.isOwner(paperId, userId);
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'You can only create questions for your own question papers' });
      }

      const question = await Question.createSubjective({
        courseId,
        paperId,
        content,
        coId: coId ?? null,
        createdBy: userId
      });

      return res.status(201).json({ success: true, message: 'Subjective question created successfully', data: question });
    } catch (error) {
      console.error('Error creating subjective question:', error);
      return res.status(500).json({ success: false, message: 'Failed to create subjective question', error: error.message });
    }
  }

  // 4. Create objective question - instructor only (for their own QuestionPaper)
  static async createObjectiveQuestion(req, res) {
    try {
      const courseIdRaw = req.body.courseId ?? req.body.course_id;
      const paperIdRaw = req.body.paperId ?? req.body.paper_id;
      const content = req.body.content;
      const coIdRaw = req.body.coId ?? req.body.co_id ?? null;
      const options = req.body.options;

      const userId = req.user?.user_id;
      const userRole = req.user?.role;

      if (userRole !== 'instructor') {
        return res.status(403).json({ success: false, message: 'Only instructors can create questions' });
      }

      const courseId = Number.parseInt(courseIdRaw, 10);
      const paperId = Number.parseInt(paperIdRaw, 10);
      const coId = coIdRaw === null || coIdRaw === undefined ? null : Number.parseInt(coIdRaw, 10);

      if (Number.isNaN(courseId) || Number.isNaN(paperId) || !content || String(content).trim() === "") {
        return res.status(400).json({ success: false, message: 'courseId, paperId, and content are required and must be valid' });
      }

      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ success: false, message: 'At least 2 options are required for objective questions' });
      }

      // Validate options minimal shape here (more validation occurs in model)
      const hasCorrect = options.some(opt => {
        const val = opt.is_correct ?? opt.isCorrect ?? opt.correct ?? false;
        return Boolean(val) || String(val).toLowerCase() === 'true' || String(val) === '1';
      });
      if (!hasCorrect) {
        return res.status(400).json({ success: false, message: 'At least one option must be marked correct' });
      }

      // Verify paper ownership
      const isOwner = await QuestionPaper.isOwner(paperId, userId);
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'You can only create questions for your own question papers' });
      }

      const question = await Question.createObjective({
        courseId,
        paperId,
        content,
        coId: coId ?? null,
        options,
        createdBy: userId
      });

      return res.status(201).json({ success: true, message: 'Objective question created successfully', data: question });
    } catch (error) {
      console.error('Error creating objective question:', error);
      return res.status(500).json({ success: false, message: 'Failed to create objective question', error: error.message });
    }
  }

  // 5. Update question - instructor (for their own QuestionPaper) or admin
  static async updateQuestion(req, res) {
    try {
      const questionIdRaw = req.params.questionId;
      const updates = req.body ?? {};
      const userId = req.user?.user_id;
      const userRole = req.user?.role;

      if (!questionIdRaw) {
        return res.status(400).json({ success: false, message: 'Question ID is required' });
      }

      const questionId = Number.parseInt(questionIdRaw, 10);
      if (Number.isNaN(questionId)) {
        return res.status(400).json({ success: false, message: 'Invalid question ID' });
      }

      // Get existing question to check ownership
      const existingQuestion = await Question.getById(questionId);
      if (!existingQuestion) {
        return res.status(404).json({ success: false, message: 'Question not found' });
      }

      // If user is not admin and question belongs to a paper, check that user owns that paper
      if (userRole !== 'admin' && existingQuestion.paper_id) {
        const isOwner = await QuestionPaper.isOwner(Number(existingQuestion.paper_id), userId);
        if (!isOwner) {
          return res.status(403).json({ success: false, message: 'You can only update questions in your own question papers' });
        }
      }

      const updatedQuestion = await Question.update(questionId, updates, userId, userRole);

      return res.status(200).json({ success: true, message: 'Question updated successfully', data: updatedQuestion });
    } catch (error) {
      console.error('Error updating question:', error);
      return res.status(500).json({ success: false, message: 'Failed to update question', error: error.message });
    }
  }

  // 6. Delete question - instructor (for their own QuestionPaper) or admin
  static async deleteQuestion(req, res) {
    try {
      const questionIdRaw = req.params.questionId;
      const userId = req.user?.user_id;
      const userRole = req.user?.role;

      if (!questionIdRaw) {
        return res.status(400).json({ success: false, message: 'Question ID is required' });
      }

      const questionId = Number.parseInt(questionIdRaw, 10);
      if (Number.isNaN(questionId)) {
        return res.status(400).json({ success: false, message: 'Invalid question ID' });
      }

      // Get existing question to check ownership
      const existingQuestion = await Question.getById(questionId);
      if (!existingQuestion) {
        return res.status(404).json({ success: false, message: 'Question not found' });
      }

      // If user is not admin and question belongs to a paper, check ownership
      if (userRole !== 'admin' && existingQuestion.paper_id) {
        const isOwner = await QuestionPaper.isOwner(Number(existingQuestion.paper_id), userId);
        if (!isOwner) {
          return res.status(403).json({ success: false, message: 'You can only delete questions from your own question papers' });
        }
      }

      const result = await Question.delete(questionId, userId, userRole);

      return res.status(200).json({ success: true, message: 'Question deleted successfully', data: result });
    } catch (error) {
      console.error('Error deleting question:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete question', error: error.message });
    }
  }

  // Bonus: Get single question by ID with full details
  static async getQuestionById(req, res) {
    try {
      const questionIdRaw = req.params.questionId;
      if (!questionIdRaw) {
        return res.status(400).json({ success: false, message: 'Question ID is required' });
      }

      const questionId = Number.parseInt(questionIdRaw, 10);
      if (Number.isNaN(questionId)) {
        return res.status(400).json({ success: false, message: 'Invalid question ID' });
      }

      const question = await Question.getById(questionId);
      if (!question) {
        return res.status(404).json({ success: false, message: 'Question not found' });
      }

      return res.status(200).json({ success: true, data: question });
    } catch (error) {
      console.error('Error getting question by ID:', error);
      return res.status(500).json({ success: false, message: 'Failed to get question', error: error.message });
    }
  }
}
