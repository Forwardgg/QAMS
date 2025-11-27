import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../components/AuthProvider';
import coAPI from '../../api/co.api';
import coursesAPI from '../../api/course.api';
import './CO.css';

const ModeratorCO = () => {
  const auth = useContext(AuthContext);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sortField, setSortField] = useState('co_number');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewingCO, setViewingCO] = useState(null);

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
      const response = await coursesAPI.getAll();
      setCourses(response.data?.rows || response.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  // Get unique courses for filter dropdown
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

  const sortedCOs = [...filteredCOs].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'course_code') {
      aValue = a.course_code;
      bValue = b.course_code;
    } else if (sortField === 'course_title') {
      aValue = a.course_title;
      bValue = b.course_title;
    } else if (sortField === 'co_number') {
      aValue = a.co_number;
      bValue = b.co_number;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

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

  // View CO details
  const handleView = (co) => {
    setViewingCO(co);
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
    <div className="moderator-co-page">
      <div className="co-header">
        <div className="header-main">
          <h1>Course Outcomes</h1>
          <p>Browse and view course learning outcomes</p>
          <div className="co-stats">
            <span className="stat-total">Total COs: {courseOutcomes.length}</span>
            <span className="stat-courses">Courses: {uniqueCourses.length}</span>
            <span className="stat-filtered">Showing: {filteredCOs.length}</span>
          </div>
        </div>
        
        <div className="co-actions">
          <button onClick={loadAllData} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Search Course Outcomes:</label>
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
                    {co.description && co.description.length > 150 
                      ? `${co.description.substring(0, 150)}...` 
                      : co.description || 'No description available'
                    }
                  </div>
                </td>
                <td className="actions">
                  <button 
                    onClick={() => handleView(co)}
                    className="btn btn-view"
                    title="View details"
                  >
                    👁️ View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedCOs.length === 0 && (
          <div className="no-data">
            {courseOutcomes.length === 0 
              ? 'No course outcomes available.'
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

      {/* CO View Modal */}
      {viewingCO && (
        <div className="modal-overlay">
          <div className="modal-content view-modal">
            <div className="modal-header">
              <h2>Course Outcome Details</h2>
              <button 
                className="close-btn"
                onClick={() => setViewingCO(null)}
              >
                ×
              </button>
            </div>
            
            <div className="co-details">
              <div className="detail-row">
                <label>Course Code:</label>
                <span className="detail-value">{viewingCO.course_code}</span>
              </div>
              
              <div className="detail-row">
                <label>Course Title:</label>
                <span className="detail-value">{viewingCO.course_title}</span>
              </div>
              
              <div className="detail-row">
                <label>CO Number:</label>
                <span className="co-badge-large">CO{viewingCO.co_number}</span>
              </div>
              
              <div className="detail-row full-width">
                <label>Description:</label>
                <div className="description-content">
                  {viewingCO.description || 'No description available'}
                </div>
              </div>
              
              <div className="meta-info">
                <div className="meta-item">
                  <span className="meta-label">Created:</span>
                  <span className="meta-value">
                    {viewingCO.created_at ? new Date(viewingCO.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                {viewingCO.updated_at && (
                  <div className="meta-item">
                    <span className="meta-label">Last Updated:</span>
                    <span className="meta-value">
                      {new Date(viewingCO.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                onClick={() => setViewingCO(null)}
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

export default ModeratorCO;