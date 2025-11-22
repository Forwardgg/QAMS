import api from "./axios";

/**
 * --- COURSE API ---
 * Backend response structures:
 * - getAll/search: { rows: [], total: number, page: number, limit: number }
 * - getById/getByCode: { course_id, code, title, syllabus, l, t, p, created_at, updated_at }
 * - create: { course_id, code, title, syllabus, l, t, p, created_at, updated_at }
 * - update: { course: {...}, actor: { actorId } }
 * - delete: { message: "Course deleted", course: {...}, actor: { actorId } }
 */
const courseAPI = {
  /**
   * Create course (admin only)
   * POST /courses
   */
  create: (data) => api.post("/courses", data),

  /**
   * Get all courses (list with pagination + search)
   * GET /courses
   * Optional query params: page, limit, search, orderBy, order
   */
  getAll: (params = {}) => api.get("/courses", { params }),

  /**
   * Get course by ID
   * GET /courses/:id
   */
  getById: (id) => api.get(`/courses/${id}`),

  /**
   * Get course by code
   * GET /courses/code/:code
   */
  getByCode: (code) => api.get(`/courses/code/${code}`),

  /**
   * Search courses
   * GET /courses/search?q=
   */
  search: (q) => api.get("/courses/search", { params: { q } }),

  /**
   * Update course
   * PUT /courses/:id
   */
  update: (id, data) => api.put(`/courses/${id}`, data),

  /**
   * Delete course
   * DELETE /courses/:id
   */
  delete: (id) => api.delete(`/courses/${id}`),

  // -------------------------
  // --- Helper functions ---
  // -------------------------

  /**
   * Format L-T-P string
   */
  formatLTP: (course) => {
    if (!course) return "";
    return `${course.l || 0}-${course.t || 0}-${course.p || 0}`;
  },

  /**
   * Validate LTP values
   */
  validateLTP: (l, t, p) => {
    const isValid = (v) => Number.isInteger(v) && v >= 0 && v <= 9;
    return isValid(l) && isValid(t) && isValid(p);
  },

  /**
   * Check if user can edit course
   */
  canEditCourse: (course, user) => {
    if (!course || !user) return false;
    if (user.role === "admin") return true;
    if (user.role === "instructor" && course.created_by === user.id) return true;
    return false;
  },

  /**
   * Check if user can delete course
   */
  canDeleteCourse: (course, user) => {
    return courseAPI.canEditCourse(course, user);
  },

  /**
   * Extract public view of course
   */
  getPublicInfo: (course) => {
    if (!course) return null;
    return {
      code: course.code,
      title: course.title,
      l: course.l,
      t: course.t,
      p: course.p,
      ltp: courseAPI.formatLTP(course),
    };
  },

  /**
   * Sort courses
   */
  sortCourses: (courses, field = "code", direction = "asc") => {
    const sorted = [...courses];
    sorted.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      if (field === "created_at") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  },

  /**
   * Filter courses by L-T-P ranges
   */
  filterByLTP: (courses, filters = {}) => {
    return courses.filter((course) => {
      const { minL, maxL, minT, maxT, minP, maxP } = filters;

      if (minL !== undefined && course.l < minL) return false;
      if (maxL !== undefined && course.l > maxL) return false;
      if (minT !== undefined && course.t < minT) return false;
      if (maxT !== undefined && course.t > maxT) return false;
      if (minP !== undefined && course.p < minP) return false;
      if (maxP !== undefined && course.p > maxP) return false;

      return true;
    });
  },
};

export default courseAPI;