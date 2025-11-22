import React, { useState, useEffect } from 'react';
import coAPI from '../../api/co.api';
import coursesAPI from '../../api/course.api'; // Add this import
import './CO.css';

const CO = () => {
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [courses, setCourses] = useState([]); // Add courses state
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sortField, setSortField] = useState('co_number');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showForm, setShowForm] = useState(false);
  const [editingCO, setEditingCO] = useState(null);
  const [formData, setFormData] = useState({
    course_code: '', // Change from course_id to course_code
    co_number: '',
    description: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadAllCOs(), loadAllCourses()]);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAllCOs = async () => {
    const response = await coAPI.getAll();
    setCourseOutcomes(response.data?.rows || []);
  };

  const loadAllCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await coursesAPI.getAll();
      setCourses(response.data?.rows || response.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setCoursesLoading(false);
    }
  };

  // Get unique courses for filter dropdown from loaded courses
  const uniqueCourses = [...new Set(courses
    .map(course => course.code)
    .filter(Boolean)
  )].sort();

  // Filter and sort course outcomes
  const filteredCOs = courseOutcomes
    .filter(co => {
      const matchesSearch = 
        co.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        co.course_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        co.co_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        co.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCourse = !selectedCourse || co.course_code === selectedCourse;
      
      return matchesSearch && matchesCourse;
    });

  const sortedCOs = coAPI.sortCOs(filteredCOs, sortField, sortDirection);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCourse('');
  };

  // CRUD Functions - UPDATED
  const resetForm = () => {
    setFormData({
      course_code: '',
      co_number: '',
      description: ''
    });
    setEditingCO(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (co) => {
    setFormData({
      course_code: co.course_code, // Use course_code instead of course_id
      co_number: co.co_number,
      description: co.description
    });
    setEditingCO(co);
    setShowForm(true);
  };

  const handleDelete = async (co) => {
    if (!window.confirm(`Are you sure you want to delete ${coAPI.formatCO(co)}?`)) {
      return;
    }

    try {
      await coAPI.delete(co.co_id);
      await loadAllCOs();
    } catch (err) {
      alert('Failed to delete course outcome');
    }
  };

  // Helper function to get course_id from course_code
  const getCourseIdFromCode = (courseCode) => {
    const course = courses.find(c => c.code === courseCode);
    return course ? course.course_id : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    const errors = [];
    
    if (!formData.course_code || formData.course_code.trim() === '') {
      errors.push("Course code is required");
    }

    if (!formData.co_number || formData.co_number.trim() === '') {
      errors.push("CO number is required");
    } else if (!coAPI.validateCONumber(formData.co_number)) {
      errors.push("CO number must be in valid format (e.g., '1', '2.1', '3.2.1')");
    }

    if (!formData.description || formData.description.trim() === '') {
      errors.push("Description is required");
    } else if (formData.description.trim().length < 10) {
      errors.push("Description must be at least 10 characters long");
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    try {
      if (editingCO) {
        // For edit - course_id remains the same, only update co_number and description
        await coAPI.update(editingCO.co_id, {
          co_number: formData.co_number,
          description: formData.description
        });
      } else {
        // For create - convert course_code to course_id
        const courseId = getCourseIdFromCode(formData.course_code);
        
        if (!courseId) {
          alert('Invalid course code selected');
          return;
        }

        await coAPI.create({
          course_id: courseId, // Send course_id to backend
          co_number: formData.co_number,
          description: formData.description
        });
      }
      
      resetForm();
      await loadAllCOs();
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="co-page">
        <div className="loading">Loading course outcomes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="co-page">
        <div className="error">{error}</div>
        <button onClick={loadAllData} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="co-page">
      <div className="co-header">
        <div className="header-main">
          <h1>Course Outcomes Management</h1>
          <div className="co-stats">
            <span className="stat-total">Total: {courseOutcomes.length}</span>
            <span className="stat-filtered">Showing: {filteredCOs.length}</span>
            <span className="stat-courses">Courses: {uniqueCourses.length}</span>
          </div>
        </div>
        
        <div className="co-actions">
          <button onClick={handleCreate} className="create-btn">
            Create CO
          </button>
          <button onClick={loadAllData} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h2>{editingCO ? 'Edit' : 'Create'} Course Outcome</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Course Code *</label>
                {editingCO ? (
                  // Display course code as read-only when editing
                  <input
                    type="text"
                    value={formData.course_code}
                    readOnly
                    className="readonly-input"
                  />
                ) : (
                  // Dropdown for course selection when creating
                  <select
                    name="course_code"
                    value={formData.course_code}
                    onChange={handleChange}
                    required
                    className="course-select"
                    disabled={coursesLoading}
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.course_id} value={course.code}>
                        {course.code} - {course.title}
                      </option>
                    ))}
                  </select>
                )}
                {coursesLoading && <small>Loading courses...</small>}
                {!editingCO && !coursesLoading && (
                  <small>Select the course for this outcome</small>
                )}
              </div>

              <div className="form-group">
                <label>CO Number *</label>
                <input
                  type="text"
                  name="co_number"
                  value={formData.co_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 1, 2.1, 3.2.1"
                />
                <small>Format: 1, 2.1, 3.2.1, etc.</small>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Enter course outcome description..."
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingCO ? 'Update' : 'Create'} CO
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by course code, title, CO number, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <label>Filter by Course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="course-select"
          >
            <option value="">All Courses</option>
            {uniqueCourses.map(course => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>
        
        {(searchTerm || selectedCourse) && (
          <button onClick={clearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        )}
      </div>

      {/* Course Outcomes Table */}
      <div className="co-table-container">
        <table className="co-table">
          <thead>
            <tr>
              <th 
                onClick={() => handleSort('course_code')}
                className="sortable-header"
              >
                Course Code {getSortIcon('course_code')}
              </th>
              <th 
                onClick={() => handleSort('course_title')}
                className="sortable-header"
              >
                Course Title {getSortIcon('course_title')}
              </th>
              <th 
                onClick={() => handleSort('co_number')}
                className="sortable-header"
              >
                CO Number {getSortIcon('co_number')}
              </th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCOs.map(co => (
              <tr key={co.co_id} className="co-row">
                <td className="course-code">
                  <span className="code-badge">{co.course_code}</span>
                </td>
                <td className="course-title">
                  <div className="title-text" title={co.course_title}>
                    {co.course_title}
                  </div>
                </td>
                <td className="co-number">
                  <span className="co-badge">CO{co.co_number}</span>
                </td>
                <td className="co-description">
                  <div className="description-text" title={co.description}>
                    {co.description}
                  </div>
                </td>
                <td className="actions">
                  <button 
                    onClick={() => handleEdit(co)}
                    className="btn btn-edit"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(co)}
                    className="btn btn-delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedCOs.length === 0 && (
          <div className="no-data">
            {courseOutcomes.length === 0 
              ? <>No course outcomes found. <button onClick={handleCreate}>Create the first one</button></>
              : 'No course outcomes match your filters'
            }
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="co-footer">
        <div className="summary">
          Displaying {sortedCOs.length} of {courseOutcomes.length} course outcomes
          {selectedCourse && ` for course ${selectedCourse}`}
        </div>
      </div>
    </div>
  );
};

export default CO;