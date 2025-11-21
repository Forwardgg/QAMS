import { Course } from "../models/Course.js";

export const createCourse = async (req, res) => {
  try {
    const { code, title, syllabus, l, t, p } = req.body;
    const createdBy = req.user.user_id;

    // Validate LTP values (0-9 range as per model)
    if (![l, t, p].every((n) => Number.isInteger(n) && n >= 0 && n <= 9)) {
      return res.status(400).json({ success: false, message: "L-T-P values must be integers between 0-9" });
    }

    const course = await Course.create({ code, title, syllabus, l, t, p, createdBy });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    if (error.message === "Course code already exists.") {
      return res.status(409).json({ success: false, message: "Course code already exists" });
    }
    console.error("Error creating course:", error);
    res.status(500).json({ success: false, message: "Failed to create course" });
  }
};

// Admin → get all courses
export const getAllCoursesAdmin = async (req, res) => {
  try {
    const courses = await Course.getAll();
    res.json({ success: true, total: courses.length, data: courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ success: false, message: "Failed to fetch courses" });
  }
};

// Instructor → get only their own courses
export const getAllCoursesInstructor = async (req, res) => {
  try {
    const instructorId = req.user.user_id;
    const courses = await Course.getByCreator(instructorId);
    res.json({ success: true, total: courses.length, data: courses });
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res.status(500).json({ success: false, message: "Failed to fetch instructor courses" });
  }
};

// Everyone → public list
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
    res.json({ success: true, data: publicCourses });
  } catch (error) {
    console.error("Error fetching public courses:", error);
    res.status(500).json({ success: false, message: "Failed to fetch courses" });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, title, syllabus, l, t, p } = req.body;
    const user = req.user;

    const course = await Course.getById(id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized to update this course" });
    }

    const updated = await Course.update(id, { code, title, syllabus, l, t, p });
    if (!updated) return res.status(404).json({ success: false, message: "Course not found" });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.message === "Course code already exists.") {
      return res.status(409).json({ success: false, message: "Course code already exists" });
    }
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

    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this course" });
    }

    const deleted = await Course.delete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Course not found" });

    res.json({ success: true, data: deleted, message: `Deleted course ${deleted.code}` });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ success: false, message: "Failed to delete course" });
  }
};

// Get by code
export const getCourseByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const course = await Course.getByCode(code);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    res.json({ success: true, data: course });
  } catch (error) {
    console.error("Error fetching course by code:", error);
    res.status(500).json({ success: false, message: "Failed to fetch course" });
  }
};

// Search by title
export const searchCoursesByTitle = async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ success: false, message: "Title query parameter is required" });
    }

    const courses = await Course.searchByTitle(title);
    res.json({ success: true, total: courses.length, data: courses });
  } catch (error) {
    console.error("Error searching courses by title:", error);
    res.status(500).json({ success: false, message: "Failed to search courses" });
  }
};