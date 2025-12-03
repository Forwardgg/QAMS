import api from "./axios";

/**
 * --- COURSE API ---
 * Backend response structures:
 * - getAll/search: { rows: [], total: number, page: number, limit: number }
 * - getById/getByCode: { course_id, code, title, syllabus, l, t, p, credit, created_at, updated_at } // Updated
 * - create: { course_id, code, title, syllabus, l, t, p, credit, created_at, updated_at } // Updated
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
   * Format credit display
   */
  formatCredit: (course) => {
    if (!course) return "";
    return course.credit !== undefined ? `${course.credit} credit${course.credit === 1 ? '' : 's'}` : "Not set";
  },

  /**
   * Validate LTP values
   */
  validateLTP: (l, t, p) => {
    const isValid = (v) => Number.isInteger(v) && v >= 0 && v <= 9;
    return isValid(l) && isValid(t) && isValid(p);
  },

  /**
   * Validate credit value
   */
  validateCredit: (credit) => {
    return Number.isInteger(credit) && credit >= 0 && credit <= 9;
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
      credit: course.credit, // Added
      ltp: courseAPI.formatLTP(course),
      creditDisplay: courseAPI.formatCredit(course), // Added
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
      const { minL, maxL, minT, maxT, minP, maxP, minCredit, maxCredit } = filters; // Updated

      if (minL !== undefined && course.l < minL) return false;
      if (maxL !== undefined && course.l > maxL) return false;
      if (minT !== undefined && course.t < minT) return false;
      if (maxT !== undefined && course.t > maxT) return false;
      if (minP !== undefined && course.p < minP) return false;
      if (maxP !== undefined && course.p > maxP) return false;
      
      // Credit filtering
      if (minCredit !== undefined && course.credit < minCredit) return false;
      if (maxCredit !== undefined && course.credit > maxCredit) return false;

      return true;
    });
  },

  /**
   * Get course summary statistics
   */
  getStatistics: (courses) => {
    if (!courses || !Array.isArray(courses)) return null;
    
    const stats = {
      total: courses.length,
      totalCredits: 0,
      averageCredit: 0,
      creditDistribution: {},
    };

    courses.forEach(course => {
      if (course.credit !== undefined) {
        stats.totalCredits += course.credit;
        stats.creditDistribution[course.credit] = (stats.creditDistribution[course.credit] || 0) + 1;
      }
    });

    if (courses.length > 0) {
      stats.averageCredit = (stats.totalCredits / courses.length).toFixed(1);
    }

    return stats;
  },

  /**
   * Validate course data before submission
   */
  validateCourseData: (data) => {
    const errors = {};
    
    if (!data.code || data.code.trim() === '') {
      errors.code = 'Course code is required';
    }
    
    if (!data.title || data.title.trim() === '') {
      errors.title = 'Course title is required';
    }
    
    if (!data.syllabus || data.syllabus.trim() === '') {
      errors.syllabus = 'Syllabus is required';
    }
    
    if (data.l !== undefined && !courseAPI.validateLTP(data.l, 0, 0)) {
      errors.l = 'L must be between 0-9';
    }
    
    if (data.t !== undefined && !courseAPI.validateLTP(0, data.t, 0)) {
      errors.t = 'T must be between 0-9';
    }
    
    if (data.p !== undefined && !courseAPI.validateLTP(0, 0, data.p)) {
      errors.p = 'P must be between 0-9';
    }
    
    if (data.credit !== undefined && !courseAPI.validateCredit(data.credit)) {
      errors.credit = 'Credit must be between 0-9';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },
};

export default courseAPI;