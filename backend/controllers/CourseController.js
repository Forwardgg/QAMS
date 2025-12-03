// backend/controllers/CourseController.js
import { Course } from "../models/Course.js";

const parsePositiveInt = (v, fallback = undefined) => {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
};

export const getAllCourses = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 25);
    const search = req.query.search ?? req.query.q ?? "";
    const orderBy = req.query.orderBy ?? "created_at";
    const order = (req.query.order || "desc").toLowerCase();

    const data = await Course.getAllCourses({ page, limit, search, orderBy, order });
    return res.json(data);
  } catch (err) {
    console.error("getAllCourses error:", err?.message ?? err);
    return res.status(500).json({ error: "Server error while fetching courses" });
  }
};

export const getCourseById = async (req, res) => {
  const idRaw = req.params?.id;
  const id = Number.parseInt(idRaw, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid course id" });

  try {
    const course = await Course.getCourseById(id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    return res.json(course);
  } catch (err) {
    console.error("getCourseById error:", err?.message ?? err);
    return res.status(500).json({ error: "Server error while fetching course" });
  }
};

export const getCourseByCode = async (req, res) => {
  const code = req.params?.code;
  if (!code || String(code).trim() === "") return res.status(400).json({ error: "code is required" });

  try {
    const course = await Course.getCourseByCode(String(code).trim());
    if (!course) return res.status(404).json({ error: "Course not found" });
    return res.json(course);
  } catch (err) {
    console.error("getCourseByCode error:", err?.message ?? err);
    return res.status(500).json({ error: "Server error while fetching course" });
  }
};

// Updated: Added credit to createCourse
export const createCourse = async (req, res) => {
  const { code, title, syllabus, l, t, p, credit } = req.body ?? {};

  if (!code || !title || !syllabus) {
    return res.status(400).json({ error: "code, title and syllabus are required" });
  }

  try {
    const course = await Course.createCourse({ code, title, syllabus, l, t, p, credit });
    return res.status(201).json(course);
  } catch (err) {
    // handle unique code conflict from model
    if (err && (err.message || "").toLowerCase().includes("code already exists")) {
      return res.status(409).json({ error: "Course code already exists" });
    }
    console.error("createCourse error:", err?.message ?? err);
    return res.status(500).json({ error: "Server error while creating course" });
  }
};

// Updated: Added credit to updateCourse
export const updateCourse = async (req, res) => {
  const idRaw = req.params?.id;
  const id = Number.parseInt(idRaw, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid course id" });

  const payload = req.body ?? {};

  try {
    const course = await Course.updateCourse(id, payload);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // optional: include actor info if req.user exists (populated by auth middleware)
    const actor = req.user?.user_id ? { actorId: req.user.user_id } : undefined;

    return res.json({ course, actor });
  } catch (err) {
    if (err && (err.message || "").toLowerCase().includes("code already exists")) {
      return res.status(409).json({ error: "Course code already exists" });
    }
    console.error("updateCourse error:", err?.message ?? err);
    return res.status(500).json({ error: "Server error while updating course" });
  }
};

export const deleteCourse = async (req, res) => {
  const idRaw = req.params?.id;
  const id = Number.parseInt(idRaw, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid course id" });

  try {
    const course = await Course.deleteCourse(id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const actor = req.user?.user_id ? { actorId: req.user.user_id } : undefined;
    return res.json({ message: "Course deleted", course, actor });
  } catch (err) {
    console.error("deleteCourse error:", err?.message ?? err);
    return res.status(500).json({ error: "Server error while deleting course" });
  }
};

export const searchCourses = async (req, res) => {
  try {
    const q = req.query?.q ?? "";
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 25);

    const data = await Course.searchCourses({ q, page, limit });
    return res.json(data);
  } catch (err) {
    console.error("searchCourses error:", err?.message ?? err);
    return res.status(500).json({ error: "Server error while searching courses" });
  }
};