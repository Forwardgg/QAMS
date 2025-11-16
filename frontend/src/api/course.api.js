// src/api/course.api.js
import api from "./axios"; // <-- Make sure this points to your axios setup

const courseAPI = {
  /**
   * Create a new course
   * POST /api/courses
   */
  create: (courseData) =>
    api.post("/courses", courseData).then((res) => res.data),

  /**
   * Get all courses (admin only)
   * GET /api/courses
   */
  getAll: () =>
    api.get("/courses").then((res) => res.data),

  /**
   * Get instructor's own courses
   * GET /api/courses/mine
   */
  getMine: () =>
    api.get("/courses/mine").then((res) => res.data),

  /**
   * Get public courses
   * GET /api/courses/public
   */
  getPublic: () =>
    api.get("/courses/public").then((res) => res.data),

  /**
   * Get course by code
   * GET /api/courses/code/:code
   */
  getByCode: (code) =>
    api.get(`/courses/code/${code}`).then((res) => res.data),

  /**
   * Search courses by title
   * GET /api/courses/search?title=...
   */
  searchByTitle: (title) =>
    api.get("/courses/search", { params: { title } }).then((res) => res.data),

  /**
   * Update an existing course
   * PUT /api/courses/:courseId
   */
  update: (courseId, courseData) =>
    api.put(`/courses/${courseId}`, courseData).then((res) => res.data),

  /**
   * Delete a course
   * DELETE /api/courses/:courseId
   */
  delete: (courseId) =>
    api.delete(`/courses/${courseId}`).then((res) => res.data),

  /**
   * Optionally get course by ID (backend must support it)
   * GET /api/courses/:id    <-- If you add this route later
   */
  getById: (courseId) =>
    api.get(`/courses/${courseId}`).then((res) => res.data),
};

export default courseAPI;
