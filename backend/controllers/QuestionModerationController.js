import { QuestionModeration } from "../models/QuestionModeration.js";
import { QuestionPaper } from "../models/QuestionPaper.js";
import { Log } from "../models/Log.js";

// ------------------- CLAIM -------------------
// Moderator claims a question for review
export const claimQuestionForModeration = async (req, res) => {
  try {
    const { paperId, questionId } = req.params;
    const user = req.user;

    if (user.role !== "moderator") {
      return res.status(403).json({ success: false, message: "Only moderators can claim questions" });
    }

    const paper = await QuestionPaper.getById(paperId);
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });
    if (paper.status !== "submitted" && paper.status !== "approved") {
      return res.status(400).json({ success: false, message: "Only submitted papers can be moderated" });
    }

    const record = await QuestionModeration.create({
      paperId,
      questionId,
      moderatorId: user.user_id,
      status: "pending"
    });

    await Log.create({
      userId: user.user_id,
      action: "CLAIM_QUESTION",
      details: `Moderator ${user.user_id} claimed question ${questionId} in paper ${paperId}`
    });

    res.status(201).json({ success: true, moderation: record });
  } catch (error) {
    console.error("Error claiming question for moderation:", error);
    res.status(500).json({ success: false, message: "Failed to claim question for moderation" });
  }
};

// ------------------- GET -------------------
export const getModerationForPaperQuestions = async (req, res) => {
  try {
    const { paperId } = req.params;
    const moderations = await QuestionModeration.getByPaper(paperId);
    res.json({ success: true, total: moderations.length, moderations });
  } catch (error) {
    console.error("Error fetching question moderation by paper:", error);
    res.status(500).json({ success: false, message: "Failed to fetch question moderation" });
  }
};

export const getModerationForQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const moderations = await QuestionModeration.getByQuestion(questionId);
    res.json({ success: true, total: moderations.length, moderations });
  } catch (error) {
    console.error("Error fetching moderation for question:", error);
    res.status(500).json({ success: false, message: "Failed to fetch moderation for question" });
  }
};

export const getMyQuestionModerations = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "moderator") {
      return res.status(403).json({ success: false, message: "Only moderators can view this" });
    }

    const moderations = await QuestionModeration.getByModerator(user.user_id);
    res.json({ success: true, total: moderations.length, moderations });
  } catch (error) {
    console.error("Error fetching my question moderations:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your question moderations" });
  }
};

// ------------------- ACTIONS -------------------
export const approveQuestionModeration = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== "moderator" && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only moderator/admin can approve questions" });
    }

    const updated = await QuestionModeration.approve(id, req.body.comments || "");
    if (!updated) return res.status(404).json({ success: false, message: "Moderation record not found" });

    await Log.create({
      userId: user.user_id,
      action: "APPROVE_QUESTION",
      details: `User ${user.user_id} approved question moderation record ${id}`
    });

    res.json({ success: true, moderation: updated });
  } catch (error) {
    console.error("Error approving question moderation:", error);
    res.status(500).json({ success: false, message: "Failed to approve question" });
  }
};

export const rejectQuestionModeration = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== "moderator" && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only moderator/admin can reject questions" });
    }

    const updated = await QuestionModeration.reject(id, req.body.comments || "");
    if (!updated) return res.status(404).json({ success: false, message: "Moderation record not found" });

    await Log.create({
      userId: user.user_id,
      action: "REJECT_QUESTION",
      details: `User ${user.user_id} rejected question moderation record ${id}`
    });

    res.json({ success: true, moderation: updated });
  } catch (error) {
    console.error("Error rejecting question moderation:", error);
    res.status(500).json({ success: false, message: "Failed to reject question" });
  }
};
