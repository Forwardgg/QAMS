// frontend/src/pages/instructor/questionpaper/QuestionPapersList.js
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './QuestionPapersList.css';

const QuestionPaperList = ({ 
  questionPapers = [], 
  onEditClick = () => {}, 
  onDeleteClick = () => {}, 
  onPreviewClick = () => {},
  onSubmitForModeration = () => {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Utility: safely stringify a field for search/comparison
  const asStr = (v) => (v === undefined || v === null) ? '' : String(v);

  // derive unique courses (memoized)
  const availableCourses = useMemo(() => {
    const courseMap = {};
    (questionPapers || []).forEach(paper => {
      if (paper.course_code && paper.course_title) {
        courseMap[paper.course_code] = paper.course_title;
      }
    });
    return Object.entries(courseMap).map(([code, title]) => ({ code, title }));
  }, [questionPapers]);

  // compute filtered & sorted papers (memoized)
  const filteredPapers = useMemo(() => {
    let filtered = Array.isArray(questionPapers) ? [...questionPapers] : [];

    const q = asStr(searchTerm).toLowerCase().trim();

    if (q) {
      filtered = filtered.filter(paper => {
        const checks = [
          asStr(paper.title).toLowerCase(),
          asStr(paper.course_code).toLowerCase(),
          asStr(paper.course_title).toLowerCase(),
          asStr(paper.exam_type).toLowerCase()
        ];
        return checks.some(str => str.includes(q));
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(paper => paper.status === statusFilter);
    }

    if (courseFilter !== 'all') {
      filtered = filtered.filter(paper => paper.course_code === courseFilter);
    }

    // Sorting: numeric fields sorted numerically, dates parsed, otherwise string
    const numericFields = new Set(['full_marks', 'duration']);
    const dateFields = new Set(['created_at', 'updated_at']);

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (numericFields.has(sortField)) {
        aVal = Number(aVal ?? 0);
        bVal = Number(bVal ?? 0);
      } else if (dateFields.has(sortField)) {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = asStr(aVal).toLowerCase();
        bVal = asStr(bVal).toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [questionPapers, searchTerm, statusFilter, courseFilter, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
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
              aria-label="Search question papers"
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

          <button onClick={clearFilters} className="btn-clear" type="button">
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
              <th onClick={() => handleSort('title')} className="sortable" role="button" tabIndex={0}>
                Title {getSortIcon('title')}
              </th>
              <th onClick={() => handleSort('course_code')} className="sortable" role="button" tabIndex={0}>
                Course {getSortIcon('course_code')}
              </th>
              <th onClick={() => handleSort('exam_type')} className="sortable" role="button" tabIndex={0}>
                Exam Type {getSortIcon('exam_type')}
              </th>
              <th onClick={() => handleSort('academic_year')} className="sortable" role="button" tabIndex={0}>
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
                  <td className="text-center">{paper.full_marks ?? '-'}</td>
                  <td className="text-center">{paper.duration ? `${paper.duration} mins` : '-'}</td>
                  <td>{getStatusBadge(paper.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        type="button"
                        className="btn-preview"
                        onClick={() => onPreviewClick(paper)}
                        title="Preview"
                        aria-label={`Preview ${paper.title}`}
                      >
                        👁️
                      </button>
                      <button 
                        type="button"
                        className="btn-edit"
                        onClick={() => onEditClick(paper)}
                        title="Edit"
                        aria-label={`Edit ${paper.title}`}
                      >
                        ✏️
                      </button>
                      
                      {/* Submit for Moderation Button */}
                      {paper.status === 'draft' && (
                        <button 
                          type="button"
                          className="btn-submit"
                          onClick={() => onSubmitForModeration(paper)}
                          title="Submit for Moderation"
                          aria-label={`Submit ${paper.title} for moderation`}
                        >
                          📤
                        </button>
                      )}
                      
                      <button 
                        type="button"
                        className="btn-delete"
                        onClick={() => onDeleteClick(paper)}
                        title="Delete"
                        aria-label={`Delete ${paper.title}`}
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

QuestionPaperList.propTypes = {
  questionPapers: PropTypes.array,
  onEditClick: PropTypes.func,
  onDeleteClick: PropTypes.func,
  onPreviewClick: PropTypes.func,
  onSubmitForModeration: PropTypes.func
};

export default QuestionPaperList;
