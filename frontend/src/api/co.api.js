import api from "./axios";

/**
 * --- COURSE OUTCOME API ---
 * Backend response structures:
 * - getAll/search: { rows: [], total: number, page: number, limit: number }
 * - getById: { co_id, course_id, co_number, description, course_code, course_title, created_at }
 * - getByCourseCode: [{ co_id, course_id, co_number, description, course_code, course_title, created_at }]
 * - create: { co_id, course_id, co_number, description, course_code, created_at }
 * - update: { outcome: {...}, actor: { actorId } }
 * - delete: { message: "Course outcome deleted", outcome: {...}, actor: { actorId } }
 */
const coAPI = {
  /**
   * Create course outcome (admin only)
   * POST /cos
   */
  create: (data) => api.post("/cos", data),

  /**
   * Get all course outcomes (list with pagination)
   * GET /cos
   * Optional query params: page, limit, orderBy, order
   */
  getAll: (params = {}) => api.get("/cos", { params }),

  /**
   * Search course outcomes
   * GET /cos/search
   * Optional query params: courseCode, coNumber, page, limit
   */
  search: (params = {}) => api.get("/cos/search", { params }),

  /**
   * Get course outcomes by course code
   * GET /cos/course/:code
   */
  getByCourseCode: (code) => api.get(`/cos/course/${code}`),

  /**
   * Get course outcome by course ID and CO number
   * GET /cos/course/:courseId/co/:coNumber
   */
  getByCourseAndNumber: (courseId, coNumber) => api.get(`/cos/course/${courseId}/co/${coNumber}`),

  /**
   * Get course outcome by ID
   * GET /cos/:id
   */
  getById: (id) => api.get(`/cos/${id}`),

  /**
   * Update course outcome (admin only)
   * PUT /cos/:id
   */
  update: (id, data) => api.put(`/cos/${id}`, data),

  /**
   * Delete course outcome (admin only)
   * DELETE /cos/:id
   */
  delete: (id) => api.delete(`/cos/${id}`),

  // -------------------------
  // --- Helper functions ---
  // -------------------------

  /**
   * Format CO display name
   */
  formatCO: (co) => {
    if (!co) return "";
    return `CO${co.co_number}`;
  },

  /**
   * Format full CO info with course
   */
  formatFullCO: (co) => {
    if (!co) return "";
    return `${co.course_code} - CO${co.co_number}`;
  },

  /**
   * Validate CO number format
   */
  validateCONumber: (coNumber) => {
    if (!coNumber || typeof coNumber !== "string") return false;
    // Allow formats like: "1", "2.1", "3.2.1", "CO1", "CO2.1"
    const cleaned = coNumber.replace(/^CO/i, "").trim();
    return /^[0-9]+(\.[0-9]+)*$/.test(cleaned);
  },

  /**
   * Check if user can edit course outcome
   */
  canEditCO: (co, user) => {
    if (!co || !user) return false;
    return user.role === "admin"; // Only admin can edit COs
  },

  /**
   * Check if user can delete course outcome
   */
  canDeleteCO: (co, user) => {
    return coAPI.canEditCO(co, user);
  },

  /**
   * Extract public view of course outcome
   */
  getPublicInfo: (co) => {
    if (!co) return null;
    return {
      co_id: co.co_id,
      co_number: co.co_number,
      co_display: coAPI.formatCO(co),
      description: co.description,
      course_code: co.course_code,
      course_title: co.course_title,
    };
  },

  /**
   * Sort course outcomes
   */
  sortCOs: (cos, field = "co_number", direction = "asc") => {
    const sorted = [...cos];
    sorted.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      // Special handling for CO numbers (e.g., "1", "2.1", "3.2.1")
      if (field === "co_number") {
        const aParts = aVal.split('.').map(Number);
        const bParts = bVal.split('.').map(Number);
        
        const maxLength = Math.max(aParts.length, bParts.length);
        for (let i = 0; i < maxLength; i++) {
          const aPart = aParts[i] || 0;
          const bPart = bParts[i] || 0;
          if (aPart !== bPart) {
            return direction === "asc" ? aPart - bPart : bPart - aPart;
          }
        }
        return 0;
      }

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
   * Filter course outcomes by course
   */
  filterByCourse: (cos, courseCode) => {
    if (!courseCode) return cos;
    return cos.filter(co => 
      co.course_code?.toLowerCase().includes(courseCode.toLowerCase())
    );
  },

  /**
   * Group course outcomes by course
   */
  groupByCourse: (cos) => {
    const grouped = {};
    cos.forEach(co => {
      const courseKey = co.course_code;
      if (!grouped[courseKey]) {
        grouped[courseKey] = {
          course_code: co.course_code,
          course_title: co.course_title,
          outcomes: []
        };
      }
      grouped[courseKey].outcomes.push(co);
    });
    return grouped;
  },

  /**
   * Get CO statistics for a course
   */
  getCOStats: (cos) => {
    const stats = {
      total: cos.length,
      byCourse: {},
      coursesCount: 0
    };

    const grouped = coAPI.groupByCourse(cos);
    stats.coursesCount = Object.keys(grouped).length;
    
    Object.keys(grouped).forEach(courseCode => {
      stats.byCourse[courseCode] = {
        count: grouped[courseCode].outcomes.length,
        course_title: grouped[courseCode].course_title
      };
    });

    return stats;
  },

  /**
   * Validate CO data before creation/update
   */
  validateCOData: (data) => {
    const errors = [];

    if (!data.course_id) {
      errors.push("Course ID is required");
    }

    if (!data.co_number || data.co_number.trim() === "") {
      errors.push("CO number is required");
    } else if (!coAPI.validateCONumber(data.co_number)) {
      errors.push("CO number must be in valid format (e.g., '1', '2.1', '3.2.1')");
    }

    if (!data.description || data.description.trim() === "") {
      errors.push("Description is required");
    } else if (data.description.trim().length < 10) {
      errors.push("Description must be at least 10 characters long");
    }

    return errors;
  },

  /**
   * Generate next CO number for a course
   */
  suggestNextCONumber: (existingCOs) => {
    if (!existingCOs || existingCOs.length === 0) return "1";
    
    const numbers = existingCOs.map(co => {
      const parts = co.co_number.split('.').map(Number);
      return parts[0]; // Get the main CO number
    });
    
    const maxNumber = Math.max(...numbers);
    return String(maxNumber + 1);
  }
};

export default coAPI;