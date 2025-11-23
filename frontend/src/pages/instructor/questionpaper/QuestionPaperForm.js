import React, { useState, useEffect } from 'react';
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
  const [formData, setFormData] = useState(initialFormData);
  const [courses, setCourses] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  useEffect(() => {
    if (mode === 'create') {
      fetchCourses();
    }
  }, [mode]);

  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getAll();
      const coursesData = response?.data?.rows || [];
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
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
      <div className="modal">
        <div className="modal-header">
          <h2>{mode === 'create' ? 'Create New Question Paper' : 'Edit Question Paper'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {!showDeleteConfirm ? (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {formError && <div className="form-error">{formError}</div>}
              
              <div className="form-group">
                <label>Paper Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter paper title..."
                  required
                />
              </div>

              {mode === 'create' && (
                <div className="form-group">
                  <label>Course *</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => handleInputChange('courseId', e.target.value)}
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.code} - {course.title}
                      </option>
                    ))}
                  </select>
                  {courses.length === 0 && (
                    <div className="form-warning">
                      No courses available. Please check if courses are properly configured.
                    </div>
                  )}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Exam Type</label>
                  <select
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
                  <label>Semester</label>
                  <input
                    type="text"
                    value={formData.semester}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
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
                    onChange={(e) => handleInputChange('academicYear', e.target.value)}
                    placeholder="e.g., 2024-25"
                  />
                </div>
                <div className="form-group">
                  <label>Full Marks</label>
                  <input
                    type="number"
                    value={formData.fullMarks}
                    onChange={(e) => handleInputChange('fullMarks', e.target.value)}
                    min="0"
                    max="100"
                    placeholder="e.g., 100"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
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
              <button type="submit" disabled={formLoading || (mode === 'create' && courses.length === 0)}>
                {formLoading ? 'Saving...' : (mode === 'create' ? 'Create Paper' : 'Update Paper')}
              </button>
            </div>
          </form>
        ) : (
          /* Delete Confirmation View */
          <div className="delete-confirmation">
            <div className="modal-body">
              <div className="delete-warning-icon">⚠️</div>
              <h3>Delete Question Paper</h3>
              <p>Are you sure you want to delete the paper:</p>
              <div className="paper-to-delete">
                <strong>"{paper?.title}"</strong>
              </div>
              <p className="delete-warning-text">
                This action cannot be undone. All questions associated with this paper will also be removed.
              </p>
              {formError && <div className="form-error">{formError}</div>}
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

export default QuestionPaperForm;