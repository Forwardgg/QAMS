import { QuestionPaper } from "../models/QuestionPaper.js";
import { Course } from "../models/Course.js";

export const createPaper = async (req, res) => {
  try {
    const { courseId, title, examType, semester, academicYear, fullMarks, duration } = req.body;
    const user = req.user;

    const course = await Course.getById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    // Ownership check: instructor can only create for their course
    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized to create paper for this course" });
    }

    const paper = await QuestionPaper.create({
      courseId,
      instructorId: user.user_id,
      title,
      examType,
      semester,
      academicYear,
      fullMarks,
      duration
    });

    res.status(201).json({ success: true, paper });
  } catch (error) {
    console.error("Error creating paper:", error);
    res.status(500).json({ success: false, message: "Failed to create paper" });
  }
};

// ------------------- GET -------------------

// Admin: all papers, Instructor: own, Moderator: assigned (simplified as all for now)
export const getAllPapers = async (req, res) => {
  try {
    const user = req.user;
    let papers;

    if (user.role === "admin") {
      papers = await QuestionPaper.getAll();
    } else if (user.role === "instructor") {
      papers = (await QuestionPaper.getAll()).filter((p) => p.instructor_id === user.user_id);
    } else if (user.role === "moderator") {
      // later: filter by paper_moderation table
      papers = await QuestionPaper.getAll();
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, total: papers.length, papers });
  } catch (error) {
    console.error("Error fetching papers:", error);
    res.status(500).json({ success: false, message: "Failed to fetch papers" });
  }
};

export const getPaperById = async (req, res) => {
  try {
    const { paperId } = req.params;
    const user = req.user;

    const paper = await QuestionPaper.getById(paperId);
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });

    // Permissions
    if (user.role === "instructor" && paper.instructor_id !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.json({ success: true, paper });
  } catch (error) {
    console.error("Error fetching paper:", error);
    res.status(500).json({ success: false, message: "Failed to fetch paper" });
  }
};

export const updatePaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const user = req.user;

    const paper = await QuestionPaper.getById(paperId);
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });

    if (user.role === "instructor") {
      if (paper.instructor_id !== user.user_id || paper.status !== "draft") {
        return res.status(403).json({ success: false, message: "Instructors can only update their own draft papers" });
      }
    }

    const updated = await QuestionPaper.update(paperId, req.body);
    res.json({ success: true, paper: updated });
  } catch (error) {
    console.error("Error updating paper:", error);
    res.status(500).json({ success: false, message: "Failed to update paper" });
  }
};

export const deletePaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const user = req.user;

    const paper = await QuestionPaper.getById(paperId);
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });

    if (user.role === "instructor") {
      if (paper.instructor_id !== user.user_id || paper.status !== "draft") {
        return res.status(403).json({ success: false, message: "Instructors can only delete their own draft papers" });
      }
    }

    await QuestionPaper.delete(paperId);
    res.json({ success: true, message: "Paper deleted" });
  } catch (error) {
    console.error("Error deleting paper:", error);
    res.status(500).json({ success: false, message: "Failed to delete paper" });
  }
};

export const submitPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const user = req.user;

    const paper = await QuestionPaper.getById(paperId);
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });

    if (user.role === "instructor" && paper.instructor_id !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const updated = await QuestionPaper.submit(paperId);
    res.json({ success: true, paper: updated });
  } catch (error) {
    console.error("Error submitting paper:", error);
    res.status(500).json({ success: false, message: "Failed to submit paper" });
  }
};

export const approvePaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const user = req.user;

    if (!["admin", "moderator"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Only admins/moderators can approve papers" });
    }

    const updated = await QuestionPaper.approve(paperId);
    res.json({ success: true, paper: updated });
  } catch (error) {
    console.error("Error approving paper:", error);
    res.status(500).json({ success: false, message: "Failed to approve paper" });
  }
};

export const rejectPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const user = req.user;

    if (!["admin", "moderator"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Only admins/moderators can reject papers" });
    }

    const updated = await QuestionPaper.reject(paperId);
    res.json({ success: true, paper: updated });
  } catch (error) {
    console.error("Error rejecting paper:", error);
    res.status(500).json({ success: false, message: "Failed to reject paper" });
  }
};
