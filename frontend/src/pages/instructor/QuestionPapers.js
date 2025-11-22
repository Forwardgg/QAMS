import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../components/AuthProvider';
import questionPaperAPI from '../../api/questionPaper.api';
import courseAPI from '../../api/course.api';
import './QuestionPaper.css';

const QuestionPapers = () => {
  const { user } = useContext(AuthContext);
  const [questionPapers, setQuestionPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [courses, setCourses] = useState([]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    examType: '',
    semester: '',
    academicYear: '',
    fullMarks: '',
    duration: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchQuestionPapers();
    fetchCourses();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [questionPapers, searchTerm, statusFilter, courseFilter, sortField, sortOrder]);

  const fetchQuestionPapers = async () => {
    try {
      setLoading(true);
      const response = await questionPaperAPI.getAll();
      setQuestionPapers(response.data || response || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch question papers');
      console.error('Error fetching question papers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
  try {
    const response = await courseAPI.getAll();
    console.log('Courses API response:', response);
    
    // Direct access to the rows array
    const coursesData = response?.data?.rows || [];
    
    console.log('Courses data:', coursesData);
    setCourses(coursesData);
  } catch (err) {
    console.error('Error fetching courses:', err);
    setCourses([]);
  }
};

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

  // Create Paper Functions
  const handleCreateClick = () => {
    setFormData({
      title: '',
      courseId: '',
      examType: '',
      semester: '',
      academicYear: '',
      fullMarks: '',
      duration: ''
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      await questionPaperAPI.create({
        ...formData,
        courseId: parseInt(formData.courseId),
        fullMarks: formData.fullMarks ? parseInt(formData.fullMarks) : null,
        duration: formData.duration ? parseInt(formData.duration) : null
      });

      setShowCreateModal(false);
      fetchQuestionPapers(); // Refresh the list
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create question paper');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Paper Functions
  const handleEditClick = (paper) => {
    setSelectedPaper(paper);
    setFormData({
      title: paper.title || '',
      courseId: paper.course_id?.toString() || '',
      examType: paper.exam_type || '',
      semester: paper.semester || '',
      academicYear: paper.academic_year || '',
      fullMarks: paper.full_marks?.toString() || '',
      duration: paper.duration?.toString() || ''
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      await questionPaperAPI.update(selectedPaper.paper_id, {
        title: formData.title,
        examType: formData.examType,
        semester: formData.semester,
        academicYear: formData.academicYear,
        fullMarks: formData.fullMarks ? parseInt(formData.fullMarks) : null,
        duration: formData.duration ? parseInt(formData.duration) : null
      });

      setShowEditModal(false);
      setSelectedPaper(null);
      fetchQuestionPapers(); // Refresh the list
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update question paper');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Paper Functions
  const handleDeleteClick = (paper) => {
    setSelectedPaper(paper);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setFormLoading(true);
    try {
      await questionPaperAPI.delete(selectedPaper.paper_id);
      setShowDeleteModal(false);
      setSelectedPaper(null);
      fetchQuestionPapers(); // Refresh the list
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete question paper');
    } finally {
      setFormLoading(false);
    }
  };

  // Modal close functions
  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedPaper(null);
    setFormError('');
  };

  const availableCourses = getUniqueCoursesFromPapers();

  if (loading) {
    return (
      <div className="question-papers-container">
        <div className="loading">Loading question papers...</div>
      </div>
    );
  }

  return (
    <div className="question-papers-container">
      <div className="page-header">
        <h1>Question Papers</h1>
        <button className="btn-primary" onClick={handleCreateClick}>
          Create New Paper
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Filters and Search Section */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search papers..."
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
                  {course.code}
                </option>
              ))}
            </select>
          </div>

          <button onClick={clearFilters} className="btn-clear">
            Clear
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
                Course Code {getSortIcon('course_code')}
              </th>
              <th onClick={() => handleSort('course_title')} className="sortable">
                Course Title {getSortIcon('course_title')}
              </th>
              <th onClick={() => handleSort('exam_type')} className="sortable">
                Exam Type {getSortIcon('exam_type')}
              </th>
              <th onClick={() => handleSort('academic_year')} className="sortable">
                Year/Semester {getSortIcon('academic_year')}
              </th>
              <th onClick={() => handleSort('full_marks')} className="sortable">
                Full Marks {getSortIcon('full_marks')}
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
                <td colSpan="9" className="no-data">
                  {questionPapers.length === 0 
                    ? 'No question papers found' 
                    : 'No question papers found matching your criteria'
                  }
                </td>
              </tr>
            ) : (
              filteredPapers.map((paper) => (
                <tr key={paper.paper_id}>
                  <td className="paper-title">{paper.title}</td>
                  <td className="course-code">{paper.course_code}</td>
                  <td className="course-title">{paper.course_title}</td>
                  <td>{paper.exam_type || '-'}</td>
                  <td>
                    {paper.academic_year && paper.semester 
                      ? `${paper.academic_year} - ${paper.semester}`
                      : paper.academic_year || paper.semester || '-'
                    }
                  </td>
                  <td>{paper.full_marks || '-'}</td>
                  <td>{paper.duration ? `${paper.duration} mins` : '-'}</td>
                  <td>{getStatusBadge(paper.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEditClick(paper)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteClick(paper)}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Question Paper</h2>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Course *</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.code} - {course.title}
                      </option>
                    ))}
                  </select>
                  {courses.length === 0 && (
                    <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      No courses available. Please check if courses are properly configured.
                    </div>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Exam Type</label>
                    <input
                      type="text"
                      value={formData.examType}
                      onChange={(e) => setFormData({...formData, examType: e.target.value})}
                      placeholder="e.g., Midterm, Final"
                    />
                  </div>
                  <div className="form-group">
                    <label>Semester</label>
                    <input
                      type="text"
                      value={formData.semester}
                      onChange={(e) => setFormData({...formData, semester: e.target.value})}
                      placeholder="e.g., Fall 2024"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Academic Year</label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                      placeholder="e.g., 2024-25"
                    />
                  </div>
                  <div className="form-group">
                    <label>Full Marks</label>
                    <input
                      type="number"
                      value={formData.fullMarks}
                      onChange={(e) => setFormData({...formData, fullMarks: e.target.value})}
                      min="0"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    min="0"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModals}>Cancel</button>
                <button type="submit" disabled={formLoading || courses.length === 0}>
                  {formLoading ? 'Creating...' : 'Create Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Question Paper</h2>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Exam Type</label>
                    <input
                      type="text"
                      value={formData.examType}
                      onChange={(e) => setFormData({...formData, examType: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Semester</label>
                    <input
                      type="text"
                      value={formData.semester}
                      onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Academic Year</label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Full Marks</label>
                    <input
                      type="number"
                      value={formData.fullMarks}
                      onChange={(e) => setFormData({...formData, fullMarks: e.target.value})}
                      min="0"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    min="0"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModals}>Cancel</button>
                <button type="submit" disabled={formLoading}>
                  {formLoading ? 'Updating...' : 'Update Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPaper && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Delete Question Paper</h2>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the question paper "<strong>{selectedPaper.title}</strong>"?</p>
              <p>This action cannot be undone.</p>
              {formError && <div className="form-error">{formError}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" onClick={closeModals}>Cancel</button>
              <button 
                type="button" 
                onClick={handleDeleteConfirm} 
                disabled={formLoading}
                className="btn-danger"
              >
                {formLoading ? 'Deleting...' : 'Delete Paper'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPapers;