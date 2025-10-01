// controllers/courseController.js
import { Course } from "../models/Course.js";

// Create course (admin or instructor)
export const createCourse = async (req, res) => {
  try {
    const { code, title, l, t, p } = req.body;
    const createdBy = req.user.user_id; // from auth middleware

    const course = await Course.create({ code, title, l, t, p, createdBy });
    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ success: false, message: "Failed to create course" });
  }
};

// Admin → get all courses with creators + count
export const getAllCoursesAdmin = async (req, res) => {
  try {
    const courses = await Course.getAll();
    res.json({ success: true, total: courses.length, courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ success: false, message: "Failed to fetch courses" });
  }
};

// Instructor → get only their own courses + count
export const getAllCoursesInstructor = async (req, res) => {
  try {
    const instructorId = req.user.user_id;
    const courses = await Course.getByCreator(instructorId);
    res.json({ success: true, total: courses.length, courses });
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res.status(500).json({ success: false, message: "Failed to fetch instructor courses" });
  }
};

// Everyone → public course list (code, title, ltp)
export const getCoursesPublic = async (req, res) => {
  try {
    const courses = await Course.getAll();
    const publicCourses = courses.map((c) => ({
      code: c.code,
      title: c.title,
      l: c.l,
      t: c.t,
      p: c.p,
    }));
    res.json({ success: true, courses: publicCourses });
  } catch (error) {
    console.error("Error fetching public courses:", error);
    res.status(500).json({ success: false, message: "Failed to fetch courses" });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, title, l, t, p } = req.body;
    const user = req.user;

    const course = await Course.getById(id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    // Ownership check
    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const updated = await Course.update(id, { code, title, l, t, p });
    res.json({ success: true, course: updated });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ success: false, message: "Failed to update course" });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const course = await Course.getById(id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    // Ownership check
    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Course.delete(id);
    res.json({ success: true, message: "Course deleted" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ success: false, message: "Failed to delete course" });
  }
};

export const getCourseByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const course = await Course.getByCode(code);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, course });
  } catch (error) {
    console.error("Error fetching course by code:", error);
    res.status(500).json({ success: false, message: "Failed to fetch course" });
  }
};

// Search courses by title (admin/instructor/public)
export const searchCoursesByTitle = async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ success: false, message: "Title query is required" });
    }

    const courses = await Course.searchByTitle(title);
    res.json({ success: true, total: courses.length, courses });
  } catch (error) {
    console.error("Error searching courses by title:", error);
    res.status(500).json({ success: false, message: "Failed to search courses" });
  }
};