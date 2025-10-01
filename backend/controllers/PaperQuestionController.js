import { PaperQuestion } from "../models/PaperQuestion.js";
import { QuestionPaper } from "../models/QuestionPaper.js";
import { Log } from "../models/Log.js";

// ------------------- ADD -------------------
export const addQuestionToPaper = async (req, res) => {
  try {
    const { paperId, questionId } = req.params;
    const { sequence, marks, section } = req.body;
    const user = req.user;

    // Check paper ownership
    const paper = await QuestionPaper.getById(paperId);
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });
    if (user.role === "instructor" && paper.instructor_id !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Prevent duplicate
    const exists = await PaperQuestion.exists(paperId, questionId);
    if (exists) {
      return res.status(400).json({ success: false, message: "Question already exists in this paper" });
    }

    const added = await PaperQuestion.add({ paperId, questionId, sequence, marks, section });

    // Log
    await Log.create({
      userId: user.user_id,
      action: "ADD_QUESTION_TO_PAPER",
      details: `User ${user.user_id} added question ${questionId} to paper ${paperId} (seq ${sequence}, marks ${marks}, section ${section})`
    });

    res.status(201).json({ success: true, paperQuestion: added });
  } catch (error) {
    console.error("Error adding question to paper:", error);
    res.status(500).json({ success: false, message: "Failed to add question to paper" });
  }
};

// ------------------- GET -------------------
export const getQuestionsInPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const user = req.user;

    const paper = await QuestionPaper.getById(paperId);
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });
    if (user.role === "instructor" && paper.instructor_id !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const questions = await PaperQuestion.getByPaper(paperId);
    res.json({ success: true, total: questions.length, questions });
  } catch (error) {
    console.error("Error fetching paper questions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch paper questions" });
  }
};

// ------------------- UPDATE -------------------
export const updatePaperQuestion = async (req, res) => {
  try {
    const { id } = req.params; // paper_questions.id
    const { sequence, marks, section } = req.body;
    const user = req.user;

    const pq = await PaperQuestion.getById(id);
    if (!pq) return res.status(404).json({ success: false, message: "Paper question not found" });

    const paper = await QuestionPaper.getById(pq.paper_id);
    if (!paper) return res.status(404).json({ success: false, message: "Parent paper not found" });
    if (user.role === "instructor" && paper.instructor_id !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const updated = await PaperQuestion.update(id, { sequence, marks, section });

    await Log.create({
      userId: user.user_id,
      action: "UPDATE_PAPER_QUESTION",
      details: `User ${user.user_id} updated paper_question ${id} → seq ${sequence}, marks ${marks}, section ${section}`
    });

    res.json({ success: true, paperQuestion: updated });
  } catch (error) {
    console.error("Error updating paper question:", error);
    res.status(500).json({ success: false, message: "Failed to update paper question" });
  }
};

// ------------------- REMOVE -------------------
export const removeQuestionFromPaper = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const pq = await PaperQuestion.getById(id);
    if (!pq) return res.status(404).json({ success: false, message: "Paper question not found" });

    const paper = await QuestionPaper.getById(pq.paper_id);
    if (!paper) return res.status(404).json({ success: false, message: "Parent paper not found" });
    if (user.role === "instructor" && paper.instructor_id !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await PaperQuestion.remove(id);
    await PaperQuestion.reorder(pq.paper_id); // keep sequence clean

    await Log.create({
      userId: user.user_id,
      action: "REMOVE_QUESTION_FROM_PAPER",
      details: `User ${user.user_id} removed paper_question ${id} from paper ${pq.paper_id}`
    });

    res.json({ success: true, message: "Question removed from paper and sequence reordered" });
  } catch (error) {
    console.error("Error removing question from paper:", error);
    res.status(500).json({ success: false, message: "Failed to remove question from paper" });
  }
};

// ------------------- REORDER -------------------
export const reorderPaperQuestions = async (req, res) => {
  try {
    const { paperId } = req.params;
    const user = req.user;

    const paper = await QuestionPaper.getById(paperId);
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });
    if (user.role === "instructor" && paper.instructor_id !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const reordered = await PaperQuestion.reorder(paperId);

    await Log.create({
      userId: user.user_id,
      action: "REORDER_PAPER_QUESTIONS",
      details: `User ${user.user_id} reordered questions in paper ${paperId}`
    });

    res.json({ success: true, total: reordered.length, questions: reordered });
  } catch (error) {
    console.error("Error reordering paper questions:", error);
    res.status(500).json({ success: false, message: "Failed to reorder paper questions" });
  }
};

// ------------------- BULK ADD -------------------
export const bulkAddQuestionsToPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const { questions } = req.body; // array of { questionId, sequence, marks, section }
    const user = req.user;

    const paper = await QuestionPaper.getById(paperId);
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });

    if (user.role === "instructor" && paper.instructor_id !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Prevent duplicates
    for (const q of questions) {
      const exists = await PaperQuestion.exists(paperId, q.questionId);
      if (exists) {
        return res.status(400).json({ 
          success: false, 
          message: `Question ${q.questionId} already exists in paper ${paperId}` 
        });
      }
    }

    const added = await PaperQuestion.bulkAdd(paperId, questions);

    await Log.create({
      userId: user.user_id,
      action: "BULK_ADD_QUESTIONS_TO_PAPER",
      details: `User ${user.user_id} added ${added.length} questions to paper ${paperId}`
    });

    res.status(201).json({ success: true, total: added.length, paperQuestions: added });
  } catch (error) {
    console.error("Error bulk adding questions to paper:", error);
    res.status(500).json({ success: false, message: "Failed to bulk add questions to paper" });
  }
};

