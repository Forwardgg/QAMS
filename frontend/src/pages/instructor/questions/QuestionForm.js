import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../../components/AuthProvider';
import questionAPI from '../../../api/question.api';
import courseAPI from '../../../api/course.api';
import coAPI from '../../../api/co.api';
import questionPaperAPI from '../../../api/questionPaper.api';
import './QuestionForm.css';

const QuestionForm = ({ mode = 'create', question = null, courseCode = '', paperId = '', onBack, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    courseId: '',
    paperId: '',
    question_type: 'subjective',
    content: '',
    coId: '',
    options: [{ optionText: '', isCorrect: false }]
  });

  // Additional data
  const [courses, setCourses] = useState([]);
  const [questionPapers, setQuestionPapers] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Initialize form data - RUNS ONLY ONCE
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Always fetch courses first
        const coursesResponse = await courseAPI.getAll();
        const coursesData = coursesResponse?.data?.rows || coursesResponse || [];
        setCourses(coursesData);

        if (mode === 'create') {
          let initialCourseId = '';
          let initialPaperId = paperId ? paperId.toString() : '';

          // If courseCode is provided, find the corresponding courseId
          if (courseCode && coursesData.length > 0) {
            const course = coursesData.find(c => c.code === courseCode);
            if (course) {
              initialCourseId = course.course_id.toString();
              
              // Fetch papers and COs for this course
              const papersResponse = await questionPaperAPI.getAll();
              const allPapers = papersResponse?.data || papersResponse || [];
              const filteredPapers = allPapers.filter(paper => paper.course_code === courseCode);
              setQuestionPapers(filteredPapers);

              const coResponse = await coAPI.getByCourseCode(courseCode);
              setCourseOutcomes(coResponse?.data || coResponse || []);
            }
          }

          setFormData({
            courseId: initialCourseId,
            paperId: initialPaperId,
            question_type: 'subjective',
            content: '',
            coId: '',
            options: [{ optionText: '', isCorrect: false }]
          });

        } else if (mode === 'edit' && question) {
          // For edit mode, pre-fill with question data
          const initialData = {
            courseId: question.course_id?.toString() || '',
            paperId: question.paper_id?.toString() || '',
            question_type: question.question_type || 'subjective',
            content: question.content || '',
            coId: question.co_id?.toString() || '',
            options: question.options || [{ optionText: '', isCorrect: false }]
          };

          setFormData(initialData);

          // If we have a course ID, fetch related data
          if (question.course_id) {
            const course = coursesData.find(c => c.course_id == question.course_id);
            if (course) {
              const papersResponse = await questionPaperAPI.getAll();
              const allPapers = papersResponse?.data || papersResponse || [];
              const filteredPapers = allPapers.filter(paper => paper.course_code === course.code);
              setQuestionPapers(filteredPapers);

              const coResponse = await coAPI.getByCourseCode(course.code);
              setCourseOutcomes(coResponse?.data || coResponse || []);
            }
          }
        }

        setDataLoaded(true);
      } catch (err) {
        console.error('Error initializing form:', err);
        setError('Failed to load form data');
      }
    };

    initializeForm();
  }, [mode, question, courseCode, paperId]); // Only depend on props that should trigger re-initialization

  // Handle course change - fetch papers and COs
  const handleCourseChange = async (courseId) => {
    if (!courseId) {
      setQuestionPapers([]);
      setCourseOutcomes([]);
      return;
    }

    const course = courses.find(c => c.course_id == courseId);
    if (course) {
      try {
        const papersResponse = await questionPaperAPI.getAll();
        const allPapers = papersResponse?.data || papersResponse || [];
        const filteredPapers = allPapers.filter(paper => paper.course_code === course.code);
        setQuestionPapers(filteredPapers);

        const coResponse = await coAPI.getByCourseCode(course.code);
        setCourseOutcomes(coResponse?.data || coResponse || []);
      } catch (err) {
        console.error('Error fetching course data:', err);
        setQuestionPapers([]);
        setCourseOutcomes([]);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If course changes, fetch related data
    if (name === 'courseId') {
      handleCourseChange(value);
    }
  };

  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...formData.options];
    
    if (field === 'isCorrect') {
      // If setting to true, uncheck all others
      if (value === true) {
        updatedOptions.forEach(opt => opt.isCorrect = false);
      }
      updatedOptions[index][field] = value;
    } else {
      updatedOptions[index][field] = value;
    }
    
    setFormData(prev => ({
      ...prev,
      options: updatedOptions
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { optionText: '', isCorrect: false }]
    }));
  };

  const removeOption = (index) => {
    if (formData.options.length > 1) {
      const updatedOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        options: updatedOptions
      }));
    }
  };

  const validateForm = () => {
    if (!formData.courseId) {
      setError('Please select a course');
      return false;
    }

    if (!formData.paperId) {
      setError('Please select a question paper');
      return false;
    }

    if (!formData.content.trim()) {
      setError('Question content is required');
      return false;
    }

    if (formData.question_type === 'mcq') {
      // Validate MCQ options
      const validOptions = formData.options.filter(opt => opt.optionText.trim() !== '');
      if (validOptions.length < 2) {
        setError('MCQ questions must have at least 2 options');
        return false;
      }

      const hasCorrectOption = formData.options.some(opt => opt.isCorrect);
      if (!hasCorrectOption) {
        setError('MCQ questions must have at least one correct option');
        return false;
      }

      // Check for duplicate options
      const optionTexts = formData.options.map(opt => opt.optionText.trim().toLowerCase());
      const uniqueTexts = new Set(optionTexts);
      if (uniqueTexts.size !== optionTexts.length) {
        setError('MCQ options must be unique');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API
      const submitData = {
        courseId: parseInt(formData.courseId),
        paperId: parseInt(formData.paperId),
        question_type: formData.question_type,
        content: formData.content.trim(),
        coId: formData.coId ? parseInt(formData.coId) : null
      };

      if (formData.question_type === 'mcq') {
        submitData.options = formData.options
          .filter(opt => opt.optionText.trim() !== '')
          .map(opt => ({
            optionText: opt.optionText.trim(),
            isCorrect: opt.isCorrect
          }));
      }

      let response;
      if (mode === 'create') {
        if (formData.question_type === 'subjective') {
          response = await questionAPI.createSubjective(submitData);
        } else {
          response = await questionAPI.createObjective(submitData);
        }
        setSuccess('Question created successfully!');
      } else {
        response = await questionAPI.update(question.question_id, submitData);
        setSuccess('Question updated successfully!');
      }

      // Call success callback after a short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);

    } catch (err) {
      setError(err.message || `Failed to ${mode} question`);
    } finally {
      setLoading(false);
    }
  };

  if (!dataLoaded) {
    return (
      <div className="question-form-container">
        <div className="loading">Loading form...</div>
      </div>
    );
  }

  return (
    <div className="question-form-container">
      <div className="form-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to Questions
        </button>
        <h1>{mode === 'create' ? 'Create New Question' : 'Edit Question'}</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="question-form">
        <div className="form-card">
          {/* Basic Information Section */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="courseId">Course *</label>
                <select
                  id="courseId"
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleInputChange}
                  required
                  disabled={mode === 'edit'}
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="paperId">Question Paper *</label>
                <select
                  id="paperId"
                  name="paperId"
                  value={formData.paperId}
                  onChange={handleInputChange}
                  required
                  disabled={mode === 'edit'}
                >
                  <option value="">Select Paper</option>
                  {questionPapers.map(paper => (
                    <option key={paper.paper_id} value={paper.paper_id}>
                      {paper.title} ({paper.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="question_type">Question Type *</label>
                <select
                  id="question_type"
                  name="question_type"
                  value={formData.question_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="subjective">Subjective</option>
                  <option value="mcq">Multiple Choice (MCQ)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="coId">Course Outcome (CO)</label>
                <select
                  id="coId"
                  name="coId"
                  value={formData.coId}
                  onChange={handleInputChange}
                >
                  <option value="">Select CO (Optional)</option>
                  {courseOutcomes.map(co => (
                    <option key={co.co_id} value={co.co_id}>
                      CO{co.co_number} - {co.description?.substring(0, 50) || 'No description'}...
                    </option>
                  ))}
                </select>
                {courseOutcomes.length === 0 && formData.courseId && (
                  <p className="form-hint">No course outcomes defined for this course.</p>
                )}
              </div>
            </div>
          </div>

          {/* Question Content Section */}
          <div className="form-section">
            <h3>Question Content</h3>
            <div className="form-group">
              <label htmlFor="content">Question Text *</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Enter your question here..."
                rows="4"
                required
              />
            </div>
          </div>

          {/* MCQ Options Section */}
          {formData.question_type === 'mcq' && (
            <div className="form-section">
              <h3>Multiple Choice Options</h3>
              <div className="options-section">
                <div className="options-header">
                  <span>Options (Minimum 2 required)</span>
                  <button type="button" onClick={addOption} className="btn-add-option">
                    + Add Option
                  </button>
                </div>
                
                {formData.options.map((option, index) => (
                  <div key={index} className="option-row">
                    <div className="option-inputs">
                      <input
                        type="text"
                        placeholder={`Option ${index + 1}`}
                        value={option.optionText}
                        onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                        className="option-text-input"
                      />
                      
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Correct Answer
                      </label>
                    </div>
                    
                    {formData.options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="btn-remove-option"
                        title="Remove option"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" onClick={onBack} className="btn-cancel">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-submit"
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Question' : 'Update Question'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;