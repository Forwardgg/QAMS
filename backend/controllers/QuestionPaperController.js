// backend/controllers/questionPaperController.js
import { QuestionPaper } from "../models/QuestionPaper.js";

export const createQuestionPaper = async (req, res) => {
  try {
    const {
      courseId,
      title,
      examType,
      semester,
      academicYear,
      fullMarks,
      duration
    } = req.body;

    const createdBy = req.user.user_id;

    const paper = await QuestionPaper.create({
      courseId,
      createdBy,
      title,
      examType,
      semester,
      academicYear,
      fullMarks,
      duration
    });

    res.status(201).json({
      success: true,
      message: "Question paper created successfully",
      data: paper
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllPapers = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const papers = await QuestionPaper.getAll(parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: papers,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getPapersByCourse = async (req, res) => {
  try {
    const { courseCode } = req.params;

    const papers = await QuestionPaper.getByCourseCode(courseCode);

    res.json({
      success: true,
      data: papers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// will change later. it will be searched  by course and CO of questions. the QP is linked to questions and questions to COs.
export const getPapersByCourseAndCO = async (req, res) => {
  try {
    const { courseCode, coNumber } = req.params;

    const papers = await QuestionPaper.getByCourseAndCO(courseCode, coNumber);

    res.json({
      success: true,
      data: papers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updatePaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const {
      title,
      examType,
      semester,
      academicYear,
      fullMarks,
      duration,
      status
    } = req.body;

    // Check if user is admin or owner of the paper
    if (req.user.role !== 'admin') {
      const isOwner = await QuestionPaper.isOwner(paperId, req.user.user_id);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only update your own papers."
        });
      }
    }

    const updatedPaper = await QuestionPaper.update(paperId, {
      title,
      examType,
      semester,
      academicYear,
      fullMarks,
      duration,
      status
    });

    res.json({
      success: true,
      message: "Question paper updated successfully",
      data: updatedPaper
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const deletePaper = async (req, res) => {
  try {
    const { paperId } = req.params;

    // Check if user is admin or owner of the paper
    if (req.user.role !== 'admin') {
      const isOwner = await QuestionPaper.isOwner(paperId, req.user.user_id);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only delete your own papers."
        });
      }
    }

    const deletedPaper = await QuestionPaper.delete(paperId);

    res.json({
      success: true,
      message: "Question paper deleted successfully",
      data: deletedPaper
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};