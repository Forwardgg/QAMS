import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../components/AuthProvider';
import courseAPI from '../../api/course.api';
import './Courses.css';

const ModeratorCourses = () => {
  const auth = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('code');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewingCourse, setViewingCourse] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Load courses when page, limit, or search changes
  useEffect(() => {
    loadCourses();
  }, [pagination.page, pagination.limit, searchQuery]);

  // Load courses with pagination and search
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

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
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

  // View course details
  const handleView = (course) => {
    setViewingCourse(course);
  };

  // Check if user can edit course (for display purposes)
  const canEditCourse = (course) => {
    return courseAPI.canEditCourse(course, auth.user);
  };

  const sortedCourses = getSortedCourses();

  return (
    <div className="instructor-courses">
      <div className="courses-header">
        <h1>Course Catalog</h1>
        <p>Browse and view all available courses</p>
      </div>

      {/* Search Controls */}
      <div className="courses-controls">
        <form onSubmit={handleSearch} className="search-section">
          <input
            type="text"
            placeholder="Search courses by code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-search">
            Search
          </button>
        </form>

        {/* Pagination Limit Selector */}
        <div className="pagination-controls">
          <select 
            value={pagination.limit} 
            onChange={(e) => handleLimitChange(e.target.value)}
            className="limit-select"
            disabled={loading}
          >
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
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
                  <th 
                    className="sortable" 
                    onClick={() => handleSort('credit')}
                  >
                    Credits {sortField === 'credit' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Syllabus Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCourses.map(course => (
                  <tr key={course.course_id}>
                    <td className="course-code">
                      <strong>{course.code}</strong>
                    </td>
                    <td className="course-title">{course.title}</td>
                    <td className="course-ltp">
                      {courseAPI.formatLTP(course)}
                    </td>
                    <td className="course-credit">
                      {course.credit !== undefined && course.credit !== null 
                        ? course.credit
                        : '-'
                      }
                    </td>
                    <td className="syllabus-cell">
                      {course.syllabus ? (
                        <div className="syllabus-preview">
                          {course.syllabus.length > 100 
                            ? `${course.syllabus.substring(0, 100)}...`
                            : course.syllabus
                          }
                        </div>
                      ) : (
                        <span className="no-syllabus">No syllabus available</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-sm btn-view"
                        onClick={() => handleView(course)}
                        title="View course details"
                      >
                        View
                      </button>
                      {canEditCourse(course) && (
                        <span className="edit-badge" title="You can edit this course">
                          
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {courses.length === 0 && !loading && (
              <div className="no-courses">
                {searchQuery ? 'No courses found matching your search.' : 'No courses available.'}
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
                ← Previous
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
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Course View Modal */}
      {viewingCourse && (
        <div className="modal-overlay">
          <div className="modal-content view-modal">
            <div className="modal-header">
              <h2>Course Details</h2>
              <button 
                className="close-btn"
                onClick={() => setViewingCourse(null)}
              >
                ×
              </button>
            </div>
            
            <div className="course-details">
              <div className="detail-row">
                <label>Course Code:</label>
                <span className="detail-value">{viewingCourse.code}</span>
              </div>
              
              <div className="detail-row">
                <label>Course Title:</label>
                <span className="detail-value">{viewingCourse.title}</span>
              </div>
              
              <div className="detail-row">
                <label>L-T-P Hours:</label>
                <span className="ltp-badge">{courseAPI.formatLTP(viewingCourse)}</span>
              </div>
              
              <div className="ltp-breakdown">
                <div className="ltp-item">
                  <span className="ltp-label">Lecture:</span>
                  <span className="ltp-value">{viewingCourse.l} hours</span>
                </div>
                <div className="ltp-item">
                  <span className="ltp-label">Tutorial:</span>
                  <span className="ltp-value">{viewingCourse.t} hours</span>
                </div>
                <div className="ltp-item">
                  <span className="ltp-label">Practical:</span>
                  <span className="ltp-value">{viewingCourse.p} hours</span>
                </div>
              </div>
              
              {/* Added credit row */}
              <div className="detail-row">
                <label>Credits:</label>
                <span className="detail-value credit-badge">
                  {viewingCourse.credit !== undefined && viewingCourse.credit !== null 
                    ? `${viewingCourse.credit} credit${viewingCourse.credit === 1 ? '' : 's'}`
                    : 'Not set'
                  }
                </span>
              </div>
              
              <div className="detail-row full-width">
                <label>Syllabus:</label>
                <div className="syllabus-content">
                  {viewingCourse.syllabus || 'No syllabus provided.'}
                </div>
              </div>
              
              <div className="meta-info">
                <div className="meta-item">
                  <span className="meta-label">Created:</span>
                  <span className="meta-value">
                    {new Date(viewingCourse.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {viewingCourse.updated_at && (
                  <div className="meta-item">
                    <span className="meta-label">Last Updated:</span>
                    <span className="meta-value">
                      {new Date(viewingCourse.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {canEditCourse(viewingCourse) && (
                  <div className="permission-badge">
                    you have editing permissions for this course
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
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

export default ModeratorCourses;