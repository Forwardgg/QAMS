import React, { useState, useEffect } from 'react';
import './QuestionPapersList.css';

const QuestionPaperList = ({ questionPapers, onEditClick, onDeleteClick, onPreviewClick}) => {
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    applyFiltersAndSort();
  }, [questionPapers, searchTerm, statusFilter, courseFilter, sortField, sortOrder]);

  const applyFiltersAndSort = () => {
    let filtered = [...questionPapers];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(paper =>
        paper.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.course_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.exam_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(paper => paper.status === statusFilter);
    }

    // Apply course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(paper => paper.course_code === courseFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredPapers(filtered);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      draft: 'status-draft',
      submitted: 'status-submitted',
      under_review: 'status-under-review',
      change_requested: 'status-change-requested',
      approved: 'status-approved'
    };
    
    const statusLabels = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      change_requested: 'Changes Requested',
      approved: 'Approved'
    };

    return (
      <span className={`status-badge ${statusClasses[status] || ''}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCourseFilter('all');
    setSortField('created_at');
    setSortOrder('desc');
  };

  const getUniqueCoursesFromPapers = () => {
    const courseMap = {};
    questionPapers.forEach(paper => {
      if (paper.course_code && paper.course_title) {
        courseMap[paper.course_code] = paper.course_title;
      }
    });
    return Object.entries(courseMap).map(([code, title]) => ({
      code,
      title
    }));
  };

  const availableCourses = getUniqueCoursesFromPapers();

  return (
    <div className="question-paper-list">
      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search papers by title, course, or exam type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="change_requested">Changes Requested</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Course:</label>
            <select 
              value={courseFilter} 
              onChange={(e) => setCourseFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Courses</option>
              {availableCourses.map(course => (
                <option key={course.code} value={course.code}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>

          <button onClick={clearFilters} className="btn-clear">
            Clear Filters
          </button>
        </div>

        <div className="results-info">
          Showing {filteredPapers.length} of {questionPapers.length} papers
        </div>
      </div>

      {/* Papers Table */}
      <div className="papers-table-container">
        <table className="papers-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('title')} className="sortable">
                Title {getSortIcon('title')}
              </th>
              <th onClick={() => handleSort('course_code')} className="sortable">
                Course {getSortIcon('course_code')}
              </th>
              <th onClick={() => handleSort('exam_type')} className="sortable">
                Exam Type {getSortIcon('exam_type')}
              </th>
              <th onClick={() => handleSort('academic_year')} className="sortable">
                Year/Semester {getSortIcon('academic_year')}
              </th>
              <th onClick={() => handleSort('full_marks')} className="sortable">
                Marks {getSortIcon('full_marks')}
              </th>
              <th onClick={() => handleSort('duration')} className="sortable">
                Duration {getSortIcon('duration')}
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPapers.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  {questionPapers.length === 0 
                    ? 'No question papers found. Create your first paper!' 
                    : 'No papers match your search criteria'
                  }
                </td>
              </tr>
            ) : (
              filteredPapers.map((paper) => (
                <tr key={paper.paper_id}>
                  <td className="paper-title">{paper.title}</td>
                  <td>
                    <div className="course-info">
                      <span className="course-code">{paper.course_code}</span>
                      <span className="course-title">{paper.course_title}</span>
                    </div>
                  </td>
                  <td>{paper.exam_type || '-'}</td>
                  <td>
                    {paper.academic_year && paper.semester 
                      ? `${paper.academic_year} - ${paper.semester}`
                      : paper.academic_year || paper.semester || '-'
                    }
                  </td>
                  <td className="text-center">{paper.full_marks || '-'}</td>
                  <td className="text-center">{paper.duration ? `${paper.duration} mins` : '-'}</td>
                  <td>{getStatusBadge(paper.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-preview"
                        onClick={() => onPreviewClick(paper)}
                        title="Preview"
                      >
                        👁️
                      </button>
                      <button 
                        className="btn-edit"
                        onClick={() => onEditClick(paper)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => onDeleteClick(paper)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestionPaperList;