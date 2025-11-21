import { Question } from "../models/Question.js";
import { Option } from "../models/Option.js";
import { Course } from "../models/Course.js";
import { QuestionMedia } from "../models/QuestionMedia.js";
import { pool } from "../config/db.js";

// Utility to attach options + media
const attachExtras = async (questions) => {
  if (!questions || !questions.length) return [];

  const questionIds = questions.map((q) => q.question_id);

  // Batch fetch options for all MCQs
  const { rows: allOptions } = await pool.query(
    `SELECT option_id, question_id, option_text, is_correct
     FROM options
     WHERE question_id = ANY($1)
     ORDER BY option_id;`,
    [questionIds]
  );

  // Batch fetch media for all questions
  const { rows: allMedia } = await pool.query(
    `SELECT id, question_id, media_url, caption
     FROM question_media
     WHERE question_id = ANY($1)
     ORDER BY id;`,
    [questionIds]
  );

  // Group
  const optionsByQ = {};
  allOptions.forEach((opt) => {
    if (!optionsByQ[opt.question_id]) optionsByQ[opt.question_id] = [];
    optionsByQ[opt.question_id].push(opt);
  });

  const mediaByQ = {};
  allMedia.forEach((m) => {
    if (!mediaByQ[m.question_id]) mediaByQ[m.question_id] = [];
    mediaByQ[m.question_id].push(m);
  });

  // Attach
  return questions.map((q) => ({
    ...q,
    options: q.question_type === "mcq" ? optionsByQ[q.question_id] || [] : [],
    media: mediaByQ[q.question_id] || [],
  }));
};

export const addSubjectiveQuestion = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { content, coId, paperId = null, media = [] } = req.body;
    const user = req.user;

    if (!content || content.trim() === "") {
      return res.status(400).json({ success: false, message: "Question content is required" });
    }

    const course = await Course.getById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized to add questions to this course" });
    }

    const question = await Question.create({
      courseId: parseInt(courseId),
      paperId: paperId ? parseInt(paperId) : null,
      questionType: "subjective",
      content,
      coId: coId ? parseInt(coId) : null,
    });

    const mediaResults = [];
    for (const m of media) {
      const savedMedia = await QuestionMedia.create({
        questionId: question.question_id,
        mediaUrl: m.mediaUrl,
        caption: m.caption || "",
      });
      mediaResults.push(savedMedia);
    }

    // Attach empty options array for subjective questions
    question.options = [];
    question.media = mediaResults;

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    console.error("Error adding subjective question:", error);
    res.status(500).json({ success: false, message: "Failed to add question" });
  }
};

export const addMCQQuestion = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { content, coId, paperId = null, options, media = [] } = req.body;
    const user = req.user;

    const course = await Course.getById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized to add questions to this course" });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ success: false, message: "MCQ must have at least 2 options" });
    }
    if (!options.some((o) => o.isCorrect)) {
      return res.status(400).json({ success: false, message: "MCQ must have at least 1 correct option" });
    }

    const question = await Question.create({
      courseId: parseInt(courseId),
      paperId: paperId ? parseInt(paperId) : null,
      questionType: "mcq",
      content,
      coId: coId ? parseInt(coId) : null,
    });

    const optionResults = [];
    for (const opt of options) {
      const savedOption = await Option.create({
        questionId: question.question_id,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
      });
      optionResults.push(savedOption);
    }

    const mediaResults = [];
    for (const m of media) {
      const savedMedia = await QuestionMedia.create({
        questionId: question.question_id,
        mediaUrl: m.mediaUrl,
        caption: m.caption || "",
      });
      mediaResults.push(savedMedia);
    }

    question.options = optionResults;
    question.media = mediaResults;

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    console.error("Error adding MCQ question:", error);
    res.status(500).json({ success: false, message: "Failed to add MCQ question" });
  }
};

export const getQuestionsForPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    
    // Get all questions for the course first, then filter by paper
    const { rows: allQuestions } = await pool.query(
      `SELECT q.*, co.co_number
       FROM questions q
       LEFT JOIN course_outcomes co ON q.co_id = co.co_id
       WHERE q.paper_id = $1 AND q.is_active = true
       ORDER BY q.created_at DESC;`,
      [paperId]
    );

    const questions = await attachExtras(allQuestions);
    res.json({ success: true, total: questions.length, data: questions });
  } catch (error) {
    console.error("Error fetching paper questions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch paper questions" });
  }
};

export const getQuestionsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Use direct query since Question.getByCourse doesn't exist
    const { rows: questions } = await pool.query(
      `SELECT q.question_id, q.course_id, q.paper_id, q.question_type, q.content, q.co_id,
              q.status, q.is_active, q.created_at,
              co.co_number
       FROM questions q
       LEFT JOIN course_outcomes co ON q.co_id = co.co_id
       WHERE q.course_id = $1 AND q.is_active = true
       ORDER BY q.created_at DESC;`,
      [courseId]
    );

    const withExtras = await attachExtras(questions);
    res.json({ success: true, total: withExtras.length, data: withExtras });
  } catch (error) {
    console.error("Error fetching course questions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch course questions" });
  }
};

export const getQuestionsForCourseAndPaper = async (req, res) => {
  try {
    const { courseId, paperId } = req.params;
    
    const { rows: questions } = await pool.query(
      `SELECT q.*, co.co_number
       FROM questions q
       LEFT JOIN course_outcomes co ON q.co_id = co.co_id
       WHERE q.course_id = $1 AND q.paper_id = $2 AND q.is_active = true
       ORDER BY q.created_at DESC;`,
      [courseId, paperId]
    );

    const withExtras = await attachExtras(questions);
    res.json({ success: true, total: withExtras.length, data: withExtras });
  } catch (error) {
    console.error("Error fetching course+paper questions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch course+paper questions" });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content, coId, options, media } = req.body;
    const user = req.user;

    const question = await Question.getById(questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });

    // Check authorization via course ownership
    const course = await Course.getById(question.course_id);
    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized to update this question" });
    }

    const updated = await Question.update(questionId, { 
      content, 
      coId: coId ? parseInt(coId) : null 
    });

    let updatedOptions = [];
    if (question.question_type === "mcq" && Array.isArray(options)) {
      if (options.length < 2) {
        return res.status(400).json({ success: false, message: "MCQ must have at least 2 options" });
      }
      if (!options.some((o) => o.isCorrect)) {
        return res.status(400).json({ success: false, message: "MCQ must have at least 1 correct option" });
      }

      await Option.deleteByQuestion(questionId);
      for (const opt of options) {
        const savedOpt = await Option.create({
          questionId: parseInt(questionId),
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
        });
        updatedOptions.push(savedOpt);
      }
    }

    let updatedMedia = [];
    if (Array.isArray(media)) {
      await QuestionMedia.deleteByQuestion(questionId);
      for (const m of media) {
        const savedMedia = await QuestionMedia.create({
          questionId: parseInt(questionId),
          mediaUrl: m.mediaUrl,
          caption: m.caption || "",
        });
        updatedMedia.push(savedMedia);
      }
    }

    updated.options = updatedOptions;
    updated.media = updatedMedia;

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ success: false, message: "Failed to update question" });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const user = req.user;

    const question = await Question.getById(questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });

    // Check authorization via course ownership
    const course = await Course.getById(question.course_id);
    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this question" });
    }

    await Question.softDelete(questionId);

    // Clean up children
    await QuestionMedia.deleteByQuestion(questionId);
    if (question.question_type === "mcq") {
      await Option.deleteByQuestion(questionId);
    }

    res.json({ success: true, message: "Question deleted" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ success: false, message: "Failed to delete question" });
  }
};