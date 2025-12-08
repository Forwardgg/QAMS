import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../components/AuthProvider';
import coAPI from '../../api/co.api';
import coursesAPI from '../../api/course.api';
import './CO.css';

const InstructorCO = () => {
  const auth = useContext(AuthContext);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBloomLevel, setSelectedBloomLevel] = useState(''); // NEW: Bloom level filter
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

  // Get bloom levels for filter
  const bloomLevels = coAPI.getAllBloomLevels ? coAPI.getAllBloomLevels() : [
    { value: 'L1', label: 'Level 1 (Remember)' },
    { value: 'L2', label: 'Level 2 (Understand)' },
    { value: 'L3', label: 'Level 3 (Apply)' },
    { value: 'L4', label: 'Level 4 (Analyze)' },
    { value: 'L5', label: 'Level 5 (Evaluate)' },
    { value: 'L6', label: 'Level 6 (Create)' }
  ];

  // Filter and sort course outcomes
  const filteredCOs = courseOutcomes
    .filter(co => {
      const matchesSearch = 
        co.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        co.course_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        co.co_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        co.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCourse = !selectedCourse || co.course_code === selectedCourse;
      
      // NEW: Filter by bloom level
      const matchesBloomLevel = !selectedBloomLevel || co.bloom_level === selectedBloomLevel;
      
      return matchesSearch && matchesCourse && matchesBloomLevel;
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
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCourse('');
    setSelectedBloomLevel(''); // NEW: Clear bloom level filter
  };

  // View CO details
  const handleView = (co) => {
    setViewingCO(co);
  };

  // Check if user can edit CO (for display purposes)
  const canEditCO = (co) => {
    return coAPI.canEditCO(co, auth.user);
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
    <div className="instructor-co-page">
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
            Refresh
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

        {/* NEW: Bloom Level Filter */}
        <div className="filter-group">
          <label>Filter by Bloom Level:</label>
          <select
            value={selectedBloomLevel}
            onChange={(e) => setSelectedBloomLevel(e.target.value)}
            className="bloom-select"
          >
            <option value="">All Levels</option>
            {bloomLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
        
        {(searchTerm || selectedCourse || selectedBloomLevel) && (
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
              <th 
                onClick={() => handleSort('bloom_level')}
                className="sortable-header"
              >
                Bloom Level {getSortIcon('bloom_level')}
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
                <td className="bloom-level">
                  <span className={`bloom-badge bloom-${co.bloom_level || 'L1'}`}>
                    {coAPI.getBloomLevelDisplay ? coAPI.getBloomLevelDisplay(co.bloom_level) : (co.bloom_level || 'L1')}
                  </span>
                </td>
                <td className="co-description">
                  <div className="description-text" title={co.description}>
                    {co.description.length > 150 
                      ? `${co.description.substring(0, 150)}...` 
                      : co.description
                    }
                  </div>
                </td>
                <td className="actions">
                  <button 
                    onClick={() => handleView(co)}
                    className="btn btn-view"
                    title="View details"
                  >
                    View
                  </button>
                  {canEditCO(co) && (
                    <span className="edit-badge" title="You can edit this CO">
                    </span>
                  )}
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
          {selectedBloomLevel && ` with Bloom Level ${selectedBloomLevel}`}
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
              
              {/* NEW: Bloom Level in details */}
              <div className="detail-row">
                <label>Bloom Level:</label>
                <span className={`bloom-badge-large bloom-${viewingCO.bloom_level || 'L1'}`}>
                  {coAPI.getBloomLevelDisplay ? coAPI.getBloomLevelDisplay(viewingCO.bloom_level) : (viewingCO.bloom_level || 'L1')}
                </span>
              </div>
              
              <div className="detail-row full-width">
                <label>Description:</label>
                <div className="description-content">
                  {viewingCO.description}
                </div>
              </div>
              
              <div className="meta-info">
                <div className="meta-item">
                  <span className="meta-label">Created:</span>
                  <span className="meta-value">
                    {new Date(viewingCO.created_at).toLocaleDateString()}
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

                {canEditCO(viewingCO) && (
                  <div className="permission-badge">
                    You have editing permissions for this course outcome
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

export default InstructorCO;