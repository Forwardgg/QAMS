import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../components/AuthProvider';
import courseAPI from '../../api/course.api';
import './Courses.css';

const Courses = () => {
  const auth = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('code');
  const [sortDirection, setSortDirection] = useState('asc');
  const [courseCodeSearch, setCourseCodeSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [viewingCourse, setViewingCourse] = useState(null); // Modal view state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    syllabus: '',
    l: 0,
    t: 0,
    p: 0
  });
  const [formErrors, setFormErrors] = useState({});

  // Load courses when page or limit changes
  useEffect(() => {
    loadCourses();
  }, [pagination.page, pagination.limit]);

  // Load courses with pagination
  const loadCourses = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchQuery && { search: searchQuery })
      };

      const response = await courseAPI.getAll(params);
      if (response.data && response.data.rows) {
        setCourses(response.data.rows);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          totalPages: Math.ceil(response.data.total / prev.limit)
        }));
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
      alert('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Search courses by title
  const handleSearch = async () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadCourses();
  };

  // Get course by specific code
  const handleGetByCode = async () => {
    if (!courseCodeSearch.trim()) {
      alert('Please enter a course code');
      return;
    }

    setLoading(true);
    try {
      const response = await courseAPI.getByCode(courseCodeSearch.trim());
      if (response.data) {
        setCourses([response.data]);
        setPagination(prev => ({
          ...prev,
          total: 1,
          totalPages: 1,
          page: 1
        }));
      }
    } catch (error) {
      if (error.response?.status === 404) {
        alert('Course not found');
        setCourses([]);
        setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));
      } else {
        console.error('Failed to get course:', error);
        alert('Failed to get course');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sorted courses
  const getSortedCourses = () => {
    return courseAPI.sortCourses(courses, sortField, sortDirection);
  };

  // Reset to show all courses
  const handleShowAll = () => {
    setSearchQuery('');
    setCourseCodeSearch('');
    setPagination(prev => ({ ...prev, page: 1 }));
    loadCourses();
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ 
      ...prev, 
      limit: parseInt(newLimit), 
      page: 1 
    }));
  };

  // Form handling
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'l' || name === 't' || name === 'p' ? parseInt(value) || 0 : value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.code.trim()) errors.code = 'Course code is required';
    if (!formData.title.trim()) errors.title = 'Course title is required';
    if (!formData.syllabus.trim()) errors.syllabus = 'Syllabus is required';
    
    if (!courseAPI.validateLTP(formData.l, formData.t, formData.p)) {
      errors.ltp = 'LTP hours must be between 0-9';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingCourse) {
        const response = await courseAPI.update(editingCourse.course_id, formData);
        if (response.data && response.data.course) {
          setCourses(prev => prev.map(course =>
            course.course_id === editingCourse.course_id ? response.data.course : course
          ));
          alert('Course updated successfully!');
        }
      } else {
        const response = await courseAPI.create(formData);
        if (response.data) {
          setCourses(prev => [response.data, ...prev]);
          alert('Course created successfully!');
        }
      }
      
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to save course:', error);
      alert(error.response?.data?.error || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      syllabus: '',
      l: 0,
      t: 0,
      p: 0
    });
    setEditingCourse(null);
    setFormErrors({});
  };

  const handleEdit = (course) => {
    setFormData({
      code: course.code,
      title: course.title,
      syllabus: course.syllabus,
      l: course.l,
      t: course.t,
      p: course.p
    });
    setEditingCourse(course);
    setShowForm(true);
  };

  const handleView = (course) => {
    setViewingCourse(course);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await courseAPI.delete(courseId);
      if (response.data) {
        setCourses(prev => prev.filter(course => course.course_id !== courseId));
        alert('Course deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert(error.response?.data?.error || 'Failed to delete course');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCourses.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedCourses.length} selected courses?`)) return;

    setLoading(true);
    try {
      for (const courseId of selectedCourses) {
        await courseAPI.delete(courseId);
      }
      
      setCourses(prev => prev.filter(course => !selectedCourses.includes(course.course_id)));
      setSelectedCourses([]);
      alert(`${selectedCourses.length} courses deleted successfully!`);
    } catch (error) {
      console.error('Failed to delete courses:', error);
      alert('Failed to delete some courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = (courseId) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCourses(courses.map(course => course.course_id));
    } else {
      setSelectedCourses([]);
    }
  };

  const sortedCourses = getSortedCourses();

  return (
    <div className="courses-management">
      <div className="courses-header">
        <h1>Course Management</h1>
        <div className="courses-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            disabled={loading}
          >
            + Add Course
          </button>
          {selectedCourses.length > 0 && (
            <button
              className="btn btn-danger"
              onClick={handleBulkDelete}
              disabled={loading}
            >
              Delete Selected ({selectedCourses.length})
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="courses-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="btn btn-search">
            Search Title
          </button>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Get by course code..."
            value={courseCodeSearch}
            onChange={(e) => setCourseCodeSearch(e.target.value)}
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && handleGetByCode()}
          />
          <button onClick={handleGetByCode} className="btn btn-primary">
            Get by Code
          </button>
        </div>

        <button onClick={handleShowAll} className="btn btn-secondary">
          Show All
        </button>

        {/* Pagination Limit Selector */}
        <div className="pagination-controls">
          <select 
            value={pagination.limit} 
            onChange={(e) => handleLimitChange(e.target.value)}
            className="limit-select"
            disabled={loading}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading courses...</div>
      ) : (
        <>
          <div className="courses-table-container">
            <table className="courses-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedCourses.length > 0 && selectedCourses.length === courses.length}
                    />
                  </th>
                  <th 
                    className="sortable" 
                    onClick={() => handleSort('code')}
                  >
                    Course Code {sortField === 'code' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable" 
                    onClick={() => handleSort('title')}
                  >
                    Course Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable" 
                    onClick={() => handleSort('l')}
                  >
                    L-T-P {sortField === 'l' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Syllabus</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCourses.map(course => (
                  <tr key={course.course_id} className={selectedCourses.includes(course.course_id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.course_id)}
                        onChange={() => handleSelectCourse(course.course_id)}
                      />
                    </td>
                    <td className="course-code">{course.code}</td>
                    <td className="course-title">{course.title}</td>
                    <td className="course-ltp">{courseAPI.formatLTP(course)}</td>
                    <td className="syllabus-cell">
                      {course.syllabus && course.syllabus.length > 100 
                        ? `${course.syllabus.substring(0, 100)}...`
                        : course.syllabus
                      }
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-sm btn-view"
                        onClick={() => handleView(course)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(course)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(course.course_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {courses.length === 0 && !loading && (
              <div className="no-courses">
                No courses found
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                className="btn btn-pagination"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages} 
                ({pagination.total} total courses)
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || loading}
                className="btn btn-pagination"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Course Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Course Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleFormChange}
                  className={formErrors.code ? 'error' : ''}
                  placeholder="e.g., CS101"
                />
                {formErrors.code && <span className="error-text">{formErrors.code}</span>}
              </div>

              <div className="form-group">
                <label>Course Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className={formErrors.title ? 'error' : ''}
                  placeholder="e.g., Introduction to Computer Science"
                />
                {formErrors.title && <span className="error-text">{formErrors.title}</span>}
              </div>

              <div className="form-group">
                <label>Syllabus *</label>
                <textarea
                  name="syllabus"
                  value={formData.syllabus}
                  onChange={handleFormChange}
                  rows="4"
                  className={formErrors.syllabus ? 'error' : ''}
                  placeholder="Course description and learning objectives..."
                />
                {formErrors.syllabus && <span className="error-text">{formErrors.syllabus}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Lecture Hours (0-9) *</label>
                  <input
                    type="number"
                    name="l"
                    min="0"
                    max="9"
                    value={formData.l}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-group">
                  <label>Tutorial Hours (0-9) *</label>
                  <input
                    type="number"
                    name="t"
                    min="0"
                    max="9"
                    value={formData.t}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-group">
                  <label>Practical Hours (0-9) *</label>
                  <input
                    type="number"
                    name="p"
                    min="0"
                    max="9"
                    value={formData.p}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {formErrors.ltp && <span className="error-text">{formErrors.ltp}</span>}

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingCourse ? 'Update Course' : 'Create Course')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course View Modal */}
      {viewingCourse && (
        <div className="modal-overlay">
          <div className="modal-content view-modal">
            <h2>Course Details</h2>
            
            <div className="course-details">
              <div className="detail-row">
                <label>Course Code:</label>
                <span>{viewingCourse.code}</span>
              </div>
              
              <div className="detail-row">
                <label>Course Title:</label>
                <span>{viewingCourse.title}</span>
              </div>
              
              <div className="detail-row">
                <label>L-T-P Hours:</label>
                <span className="ltp-badge">{courseAPI.formatLTP(viewingCourse)}</span>
              </div>
              
              <div className="detail-row">
                <label>Lecture Hours:</label>
                <span>{viewingCourse.l}</span>
              </div>
              
              <div className="detail-row">
                <label>Tutorial Hours:</label>
                <span>{viewingCourse.t}</span>
              </div>
              
              <div className="detail-row">
                <label>Practical Hours:</label>
                <span>{viewingCourse.p}</span>
              </div>
              
              <div className="detail-row full-width">
                <label>Syllabus:</label>
                <div className="syllabus-content">
                  {viewingCourse.syllabus}
                </div>
              </div>
              
              <div className="detail-row">
                <label>Created:</label>
                <span>{new Date(viewingCourse.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="detail-row">
                <label>Last Updated:</label>
                <span>{new Date(viewingCourse.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setViewingCourse(null)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;