import { PaperModeration } from "../models/PaperModeration.js";
import { QuestionPaper } from "../models/QuestionPaper.js";
import { Log } from "../models/Log.js";

export const claimPaperForModeration = async (req, res) => {
  try {
    const { paperId } = req.params;
    const user = req.user;

    if (user.role !== "moderator") {
      return res.status(403).json({ success: false, message: "Only moderators can claim papers" });
    }

    const paper = await QuestionPaper.getById(paperId);
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });
    if (paper.status !== "submitted") {
      return res.status(400).json({ success: false, message: "Only submitted papers can be claimed" });
    }

    // Check if this moderator already claimed
    const existing = await PaperModeration.getByModerator(user.user_id);
    if (existing.some((m) => m.paper_id == paperId)) {
      return res.status(400).json({ success: false, message: "You already claimed this paper" });
    }

    const record = await PaperModeration.create({
      paperId,
      moderatorId: user.user_id,
      status: "pending",
    });

    await Log.create({
      userId: user.user_id,
      action: "CLAIM_PAPER",
      details: `Moderator ${user.user_id} claimed paper ${paperId}`,
    });

    res.status(201).json({ success: true, moderation: record });
  } catch (error) {
    console.error("Error claiming paper for moderation:", error);
    res.status(500).json({ success: false, message: "Failed to claim paper" });
  }
};
// All moderation records for a paper
export const getModerationForPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const moderations = await PaperModeration.getByPaper(paperId);
    res.json({ success: true, total: moderations.length, moderations });
  } catch (error) {
    console.error("Error fetching paper moderation:", error);
    res.status(500).json({ success: false, message: "Failed to fetch moderation records" });
  }
};
// Papers claimed by current moderator
export const getMyModerations = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "moderator") {
      return res.status(403).json({ success: false, message: "Only moderators can view this" });
    }

    const moderations = await PaperModeration.getByModerator(user.user_id);
    res.json({ success: true, total: moderations.length, moderations });
  } catch (error) {
    console.error("Error fetching my moderations:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your moderations" });
  }
};
export const approvePaperModeration = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== "moderator" && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only moderator/admin can approve" });
    }

    const updated = await PaperModeration.approve(id, req.body.comments || "");
    if (!updated) return res.status(404).json({ success: false, message: "Moderation record not found" });

    await Log.create({
      userId: user.user_id,
      action: "APPROVE_PAPER",
      details: `User ${user.user_id} approved moderation record ${id}`,
    });

    res.json({ success: true, moderation: updated });
  } catch (error) {
    console.error("Error approving paper:", error);
    res.status(500).json({ success: false, message: "Failed to approve paper" });
  }
};
export const rejectPaperModeration = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== "moderator" && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only moderator/admin can reject" });
    }

    const updated = await PaperModeration.reject(id, req.body.comments || "");
    if (!updated) return res.status(404).json({ success: false, message: "Moderation record not found" });

    await Log.create({
      userId: user.user_id,
      action: "REJECT_PAPER",
      details: `User ${user.user_id} rejected moderation record ${id}`,
    });

    res.json({ success: true, moderation: updated });
  } catch (error) {
    console.error("Error rejecting paper:", error);
    res.status(500).json({ success: false, message: "Failed to reject paper" });
  }
};
