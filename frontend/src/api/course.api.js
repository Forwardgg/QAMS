// src/api/course.api.js
import api from "./axios";

/**
 * --- COURSE API ---
 */
const courseAPI = {
  /**
   * Create course (admin/instructor only)
   * Backend: POST /api/courses
   * @param {Object} data - Course data
   * @param {string} data.code - Course code
   * @param {string} data.title - Course title
   * @param {string} data.syllabus - Course syllabus
   * @param {number} data.l - Lecture hours (0-9)
   * @param {number} data.t - Tutorial hours (0-9)
   * @param {number} data.p - Practical hours (0-9)
   * @returns {Promise} { success, data }
   */
  create: (data) => api.post("/courses", data),

  /**
   * Get all courses (admin only)
   * Backend: GET /api/courses
   * @returns {Promise} { success, total, data }
   */
  getAllAdmin: () => api.get("/courses"),

  /**
   * Get instructor's own courses
   * Backend: GET /api/courses/mine
   * @returns {Promise} { success, total, data }
   */
  getMyCourses: () => api.get("/courses/mine"),

  /**
   * Get public course list
   * Backend: GET /api/courses/public
   * @returns {Promise} { success, data }
   */
  getPublic: () => api.get("/courses/public"),

  /**
   * Get course by code
   * Backend: GET /api/courses/code/:code
   * @param {string} code - Course code
   * @returns {Promise} { success, data }
   */
  getByCode: (code) => api.get(`/courses/code/${code}`),

  /**
   * Search courses by title
   * Backend: GET /api/courses/search?title=:title
   * @param {string} title - Search query
   * @returns {Promise} { success, total, data }
   */
  searchByTitle: (title) => api.get("/courses/search", { params: { title } }),

  /**
   * Update course (admin/all, instructor/own)
   * Backend: PUT /api/courses/:id
   * @param {number} id - Course ID
   * @param {Object} data - Course update data
   * @param {string} [data.code] - Course code
   * @param {string} [data.title] - Course title
   * @param {string} [data.syllabus] - Course syllabus
   * @param {number} [data.l] - Lecture hours (0-9)
   * @param {number} [data.t] - Tutorial hours (0-9)
   * @param {number} [data.p] - Practical hours (0-9)
   * @returns {Promise} { success, data }
   */
  update: (id, data) => api.put(`/courses/${id}`, data),

  /**
   * Delete course (admin/all, instructor/own)
   * Backend: DELETE /api/courses/:id
   * @param {number} id - Course ID
   * @returns {Promise} { success, data, message }
   */
  delete: (id) => api.delete(`/courses/${id}`),

  /**
   * Helpers for course data
   */

  /**
   * Format LTP display
   * @param {Object} course - Course object
   * @returns {string} Formatted LTP string
   */
  formatLTP: (course) => {
    if (!course) return '';
    return `${course.l || 0}-${course.t || 0}-${course.p || 0}`;
  },

  /**
   * Validate LTP values
   * @param {number} l - Lecture hours
   * @param {number} t - Tutorial hours
   * @param {number} p - Practical hours
   * @returns {boolean} True if valid
   */
  validateLTP: (l, t, p) => {
    const isValid = (val) => Number.isInteger(val) && val >= 0 && val <= 9;
    return isValid(l) && isValid(t) && isValid(p);
  },

  /**
   * Check if user can edit course
   * @param {Object} course - Course object
   * @param {Object} user - Current user object
   * @returns {boolean} True if user can edit
   */
  canEditCourse: (course, user) => {
    if (!course || !user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'instructor' && course.created_by === user.id) return true;
    return false;
  },

  /**
   * Check if user can delete course
   * @param {Object} course - Course object
   * @param {Object} user - Current user object
   * @returns {boolean} True if user can delete
   */
  canDeleteCourse: (course, user) => {
    return courseAPI.canEditCourse(course, user);
  },

  /**
   * Extract public course info (for sharing)
   * @param {Object} course - Full course object
   * @returns {Object} Public course info
   */
  getPublicInfo: (course) => {
    if (!course) return null;
    return {
      code: course.code,
      title: course.title,
      l: course.l,
      t: course.t,
      p: course.p,
      ltp: courseAPI.formatLTP(course)
    };
  },

  /**
   * Sort courses by various fields
   * @param {Array} courses - Courses array
   * @param {string} field - Field to sort by (code, title, created_at)
   * @param {string} direction - Sort direction (asc, desc)
   * @returns {Array} Sorted courses
   */
  sortCourses: (courses, field = 'code', direction = 'asc') => {
    const sorted = [...courses];
    sorted.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      // Handle different data types
      if (field === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  },

  /**
   * Filter courses by LTP range
   * @param {Array} courses - Courses array
   * @param {Object} filters - Filter criteria
   * @param {number} [filters.minL] - Minimum lecture hours
   * @param {number} [filters.maxL] - Maximum lecture hours
   * @param {number} [filters.minT] - Minimum tutorial hours
   * @param {number} [filters.maxT] - Maximum tutorial hours
   * @param {number} [filters.minP] - Minimum practical hours
   * @param {number} [filters.maxP] - Maximum practical hours
   * @returns {Array} Filtered courses
   */
  filterByLTP: (courses, filters = {}) => {
    return courses.filter(course => {
      const { minL, maxL, minT, maxT, minP, maxP } = filters;
      
      if (minL !== undefined && course.l < minL) return false;
      if (maxL !== undefined && course.l > maxL) return false;
      if (minT !== undefined && course.t < minT) return false;
      if (maxT !== undefined && course.t > maxT) return false;
      if (minP !== undefined && course.p < minP) return false;
      if (maxP !== undefined && course.p > maxP) return false;
      
      return true;
    });
  }
};

export default courseAPI;