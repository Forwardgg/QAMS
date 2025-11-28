import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import courseAPI from '../../../api/course.api';
import './QuestionPaperForm.css';

const QuestionPaperForm = ({
  mode,
  formData: initialFormData,
  formLoading,
  formError,
  onSubmit,
  onClose,
  paper,
  onDelete
}) => {
  // Ensure initialFormData fields exist to avoid uncontrolled -> controlled warnings
  const normalizeInitial = (d = {}) => ({
    title: d.title ?? '',
    courseId: d.courseId ?? d.course_id ?? '',
    examType: d.examType ?? d.exam_type ?? '',
    semester: d.semester ?? '',
    academicYear: d.academicYear ?? d.academic_year ?? '',
    fullMarks: d.fullMarks ?? d.full_marks ?? '',
    duration: d.duration ?? '',
  });

  const [formData, setFormData] = useState(normalizeInitial(initialFormData));
  const [courses, setCourses] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Keep local formData in sync with parent-provided initialFormData
  useEffect(() => {
    setFormData(normalizeInitial(initialFormData));
  }, [initialFormData]);

  // Fetch courses on mount if creating (or if courses empty and in create mode)
  useEffect(() => {
    if (mode === 'create') {
      fetchCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const normalizeCoursesResponse = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.rows)) return response.data.rows;
    // try to find an array inside object
    const arr = Object.values(response).find(v => Array.isArray(v));
    return arr || [];
  };

  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getAll();
      const coursesData = normalizeCoursesResponse(response);
      setCourses(coursesData);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client-side validation
    if (!formData.title || formData.title.trim() === '') {
      // You may want to set a local form-level error state instead of relying on formError prop
      console.warn('Title is required');
      return;
    }

    if (mode === 'create' && (!formData.courseId || String(formData.courseId).trim() === '')) {
      console.warn('Course is required for creation');
      return;
    }

    // Prepare payload — ensure numeric fields are numbers or null
    const payload = {
      ...formData,
      courseId: formData.courseId === '' ? undefined
                : (Number.isNaN(Number(formData.courseId)) ? formData.courseId : Number(formData.courseId)),
      fullMarks: formData.fullMarks === '' ? null : (Number.isNaN(Number(formData.fullMarks)) ? null : Number(formData.fullMarks)),
      duration: formData.duration === '' ? null : (Number.isNaN(Number(formData.duration)) ? null : Number(formData.duration))
    };

    try {
      // onSubmit may be async — await it so calling component can show loading
      await onSubmit(payload);
    } catch (err) {
      // let parent handle error via formError prop; still log here for debugging
      console.error('Submit handler threw:', err);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (typeof onDelete !== 'function') {
      console.warn('onDelete handler not provided');
      setShowDeleteConfirm(false);
      return;
    }
    setDeleteLoading(true);
    try {
      await onDelete();
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="qp-modal-title">
        <div className="modal-header">
          <h2 id="qp-modal-title">{mode === 'create' ? 'Create New Question Paper' : 'Edit Question Paper'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {!showDeleteConfirm ? (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {formError && <div className="form-error" role="alert">{formError}</div>}

              <div className="form-group">
                <label htmlFor="paper-title">Paper Title *</label>
                <input
                  id="paper-title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter paper title..."
                  required
                />
              </div>

              {mode === 'create' && (
                <div className="form-group">
                  <label htmlFor="paper-course">Course *</label>
                  <select
                    id="paper-course"
                    name="courseId"
                    value={formData.courseId}
                    onChange={(e) => handleInputChange('courseId', e.target.value)}
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.course_id ?? course.id ?? `${course.code}-${course.title}`} value={course.course_id ?? course.id}>
                        {course.code ? `${course.code} - ${course.title}` : course.title}
                      </option>
                    ))}
                  </select>
                  {courses.length === 0 && (
                    <div className="form-warning" role="status">
                      No courses available. Please check if courses are properly configured.
                    </div>
                  )}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paper-exam-type">Exam Type</label>
                  <select
                    id="paper-exam-type"
                    name="examType"
                    value={formData.examType}
                    onChange={(e) => handleInputChange('examType', e.target.value)}
                  >
                    <option value="">Select exam type</option>
                    <option value="Midterm">Midterm</option>
                    <option value="Final">Final</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Practical">Practical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="paper-semester">Semester</label>
                  <input
                    id="paper-semester"
                    name="semester"
                    type="text"
                    value={formData.semester}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                    placeholder="e.g., Fall 2024"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paper-academic-year">Academic Year</label>
                  <input
                    id="paper-academic-year"
                    name="academicYear"
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => handleInputChange('academicYear', e.target.value)}
                    placeholder="e.g., 2024-25"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="paper-full-marks">Full Marks</label>
                  <input
                    id="paper-full-marks"
                    name="fullMarks"
                    type="number"
                    value={formData.fullMarks}
                    onChange={(e) => handleInputChange('fullMarks', e.target.value)}
                    min="0"
                    max="1000"
                    placeholder="e.g., 100"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="paper-duration">Duration (minutes)</label>
                <input
                  id="paper-duration"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  min="0"
                  placeholder="e.g., 180"
                />
              </div>

              {/* Delete Section - Only show in edit mode */}
              {mode === 'edit' && paper && (
                <div className="delete-section">
                  <h3>Danger Zone</h3>
                  <div className="delete-content">
                    <p>Once you delete this question paper, there is no going back. Please be certain.</p>
                    <button
                      type="button"
                      className="btn-delete-danger"
                      onClick={handleDeleteClick}
                    >
                      Delete Paper
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} disabled={formLoading}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading || (mode === 'create' && courses.length === 0)}
              >
                {formLoading ? 'Saving...' : (mode === 'create' ? 'Create Paper' : 'Update Paper')}
              </button>
            </div>
          </form>
        ) : (
          /* Delete Confirmation View */
          <div className="delete-confirmation">
            <div className="modal-body">
              <div className="delete-warning-icon" aria-hidden>⚠️</div>
              <h3>Delete Question Paper</h3>
              <p>Are you sure you want to delete the paper:</p>
              <div className="paper-to-delete">
                <strong>"{paper?.title}"</strong>
              </div>
              <p className="delete-warning-text">
                This action cannot be undone. All questions associated with this paper will also be removed.
              </p>
              {formError && <div className="form-error" role="alert">{formError}</div>}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={handleDeleteCancel}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-delete-danger"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Paper'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

QuestionPaperForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  formData: PropTypes.object,
  formLoading: PropTypes.bool,
  formError: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  paper: PropTypes.object,
  onDelete: PropTypes.func
};

export default QuestionPaperForm;
