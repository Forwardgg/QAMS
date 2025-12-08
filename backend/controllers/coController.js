// backend/controllers/coController.js
import { CourseOutcome } from "../models/CourseOutcome.js";

const parsePositiveInt = (v, fallback = undefined) => {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
};

const logRequest = (req) => {
  try {
    // minimal sensitive info only (no tokens)
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - params:`, req.params, "query:", req.query, "user:", req.user ? { user_id: req.user.user_id, role: req.user.role } : undefined);
  } catch (e) {
    console.error("Failed to log request:", e);
  }
};

export const getAllCourseOutcomes = async (req, res) => {
  logRequest(req);
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 25);
    const orderBy = req.query.orderBy ?? "co_number";
    const order = (req.query.order || "asc").toLowerCase();

    const data = await CourseOutcome.getAllCourseOutcomes({ page, limit, orderBy, order });
    return res.json(data);
  } catch (err) {
    console.error("getAllCourseOutcomes error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while fetching course outcomes" });
  }
};

export const getCourseOutcomesByCourseCode = async (req, res) => {
  logRequest(req);
  const courseCode = req.params?.code;
  if (!courseCode || String(courseCode).trim() === "") {
    return res.status(400).json({ error: "Course code is required" });
  }

  try {
    const outcomes = await CourseOutcome.getCourseOutcomesByCourseCode(String(courseCode).trim());
    return res.json(outcomes);
  } catch (err) {
    console.error("getCourseOutcomesByCourseCode error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while fetching course outcomes" });
  }
};

export const getCourseOutcomeByNumber = async (req, res) => {
  logRequest(req);
  const courseIdRaw = req.params?.courseId;
  const coNumber = req.params?.coNumber;
  
  const courseId = Number.parseInt(courseIdRaw, 10);
  if (Number.isNaN(courseId)) return res.status(400).json({ error: "Invalid course id" });
  if (!coNumber || String(coNumber).trim() === "") {
    return res.status(400).json({ error: "CO number is required" });
  }

  try {
    const outcome = await CourseOutcome.getCourseOutcomeByNumber(courseId, String(coNumber).trim());
    if (!outcome) return res.status(404).json({ error: "Course outcome not found" });
    return res.json(outcome);
  } catch (err) {
    console.error("getCourseOutcomeByNumber error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while fetching course outcome" });
  }
};

export const getCourseOutcomeById = async (req, res) => {
  logRequest(req);
  const idRaw = req.params?.id;
  const id = Number.parseInt(idRaw, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid course outcome id" });

  try {
    const outcome = await CourseOutcome.getCourseOutcomeById(id);
    if (!outcome) return res.status(404).json({ error: "Course outcome not found" });
    return res.json(outcome);
  } catch (err) {
    console.error("getCourseOutcomeById error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while fetching course outcome" });
  }
};

export const createCourseOutcome = async (req, res) => {
  // log writes as well (includes user info from auth middleware)
  logRequest(req);
  const { course_id, co_number, description, bloom_level = 'L1' } = req.body ?? {};

  if (!course_id || !co_number || !description) {
    return res.status(400).json({ error: "course_id, co_number and description are required" });
  }

  try {
    const outcome = await CourseOutcome.createCourseOutcome({ 
      course_id: Number(course_id), 
      co_number, 
      description,
      bloom_level
    });
    return res.status(201).json(outcome);
  } catch (err) {
    if (err && (err.message || "").toLowerCase().includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    if (err && (err.message || "").toLowerCase().includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    if (err && err.message && err.message.includes("bloom_level must be one of")) {
      return res.status(400).json({ error: err.message });
    }
    console.error("createCourseOutcome error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while creating course outcome" });
  }
};

export const updateCourseOutcome = async (req, res) => {
  logRequest(req);
  const idRaw = req.params?.id;
  const id = Number.parseInt(idRaw, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid course outcome id" });

  const payload = req.body ?? {};

  try {
    const outcome = await CourseOutcome.updateCourseOutcome(id, payload);
    if (!outcome) return res.status(404).json({ error: "Course outcome not found" });

    const actor = req.user?.user_id ? { actorId: req.user.user_id } : undefined;
    return res.json({ outcome, actor });
  } catch (err) {
    if (err && (err.message || "").toLowerCase().includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    if (err && err.message && err.message.includes("bloom_level must be one of")) {
      return res.status(400).json({ error: err.message });
    }
    console.error("updateCourseOutcome error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while updating course outcome" });
  }
};

export const deleteCourseOutcome = async (req, res) => {
  logRequest(req);
  const idRaw = req.params?.id;
  const id = Number.parseInt(idRaw, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid course outcome id" });

  try {
    const outcome = await CourseOutcome.deleteCourseOutcome(id);
    if (!outcome) return res.status(404).json({ error: "Course outcome not found" });

    const actor = req.user?.user_id ? { actorId: req.user.user_id } : undefined;
    return res.json({ message: "Course outcome deleted", outcome, actor });
  } catch (err) {
    console.error("deleteCourseOutcome error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while deleting course outcome" });
  }
};

export const searchCourseOutcomes = async (req, res) => {
  logRequest(req);
  try {
    const courseCode = req.query?.courseCode ?? "";
    const coNumber = req.query?.coNumber ?? "";
    const bloomLevel = req.query?.bloomLevel ?? ""; // Added bloom level search
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 25);

    const data = await CourseOutcome.searchCourseOutcomes({ 
      courseCode, 
      coNumber, 
      bloomLevel, // Added to search
      page, 
      limit 
    });
    return res.json(data);
  } catch (err) {
    console.error("searchCourseOutcomes error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while searching course outcomes" });
  }
};

// NEW: Add endpoint to get valid bloom levels
export const getBloomLevels = async (req, res) => {
  logRequest(req);
  try {
    const bloomLevels = CourseOutcome.getBloomLevels();
    return res.json({ bloomLevels });
  } catch (err) {
    console.error("getBloomLevels error:", err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: "Server error while fetching bloom levels" });
  }
};