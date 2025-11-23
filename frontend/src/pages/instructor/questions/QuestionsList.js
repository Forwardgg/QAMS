import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../../components/AuthProvider';
import questionPaperAPI from '../../../api/questionPaper.api';
import questionAPI from '../../../api/question.api';
import courseAPI from '../../../api/course.api';
import coAPI from '../../../api/co.api';
import './QuestionsList.css';

const QuestionsList = ({ onViewDetail, onCreateNew, onEditQuestion }) => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [questionPapers, setQuestionPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState('');
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [coFilter, setCoFilter] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchQuestionPapers();
      fetchCourseOutcomes();
    } else {
      setQuestionPapers([]);
      setQuestions([]);
      setCourseOutcomes([]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedPaper) {
      fetchQuestions();
    } else {
      setQuestions([]);
    }
  }, [selectedPaper]);

  useEffect(() => {
    applyFilters();
  }, [questions, searchTerm, typeFilter, coFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getAll();
      const coursesData = response?.data?.rows || response || [];
      setCourses(coursesData);
      setError('');
    } catch (err) {
      setError('Failed to fetch courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionPapers = async () => {
    try {
      setLoading(true);
      const response = await questionPaperAPI.getAll();
      const allPapers = response?.data || response || [];
      
      // Filter papers by selected course locally
      const filteredPapers = allPapers.filter(paper => 
        paper.course_code === selectedCourse
      );
      
      setQuestionPapers(filteredPapers);
      setSelectedPaper('');
      setError('');
    } catch (err) {
      setError('Failed to fetch question papers');
      console.error('Error fetching question papers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionAPI.getByCourseAndPaper(selectedCourse, selectedPaper);
      setQuestions(response?.data?.questions || response || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch questions');
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseOutcomes = async () => {
    try {
      const response = await coAPI.getByCourseCode(selectedCourse);
      setCourseOutcomes(response?.data || response || []);
    } catch (err) {
      console.error('Error fetching course outcomes:', err);
      setCourseOutcomes([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...questions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(question =>
        question.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(question => question.question_type === typeFilter);
    }

    // Apply CO filter
    if (coFilter !== 'all') {
      filtered = filtered.filter(question => question.co_number === coFilter);
    }

    setFilteredQuestions(filtered);
  };

  const getQuestionTypeBadge = (type) => {
    const typeClasses = {
      mcq: 'type-mcq',
      subjective: 'type-subjective'
    };
    
    const typeLabels = {
      mcq: 'MCQ',
      subjective: 'Subjective'
    };

    return (
      <span className={`type-badge ${typeClasses[type] || ''}`}>
        {typeLabels[type] || type}
      </span>
    );
  };

  const getCOBadge = (coNumber) => {
    return (
      <span className="co-badge">
        CO{coNumber || 'N/A'}
      </span>
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCoFilter('all');
  };

  const getSelectedPaperTitle = () => {
    const paper = questionPapers.find(p => p.paper_id == selectedPaper);
    return paper ? paper.title : `Paper ${selectedPaper}`;
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await questionAPI.delete(questionId);
        // Refresh questions list
        if (selectedPaper) {
          fetchQuestions();
        }
      } catch (err) {
        setError('Failed to delete question');
        console.error('Error deleting question:', err);
      }
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div className="loading">Loading courses...</div>
    );
  }

  return (
    <div className="questions-list-container">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Header with Add Button */}
      <div className="list-header">
        <div className="header-title">
          <h2>Question Bank</h2>
          {selectedPaper && (
            <p className="paper-info">Paper: <strong>{getSelectedPaperTitle()}</strong></p>
          )}
        </div>
        {selectedPaper && (
          <button 
            className="btn-primary btn-add-question"
            onClick={() => onCreateNew(selectedCourse, selectedPaper)}
          >
            <span className="btn-icon">+</span>
            Add New Question
          </button>
        )}
      </div>

      {/* Course and Paper Selection */}
      <div className="selection-section">
        <div className="form-row">
          <div className="form-group">
            <label>Select Course:</label>
            <select 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="form-select"
            >
              <option value="">Choose a course...</option>
              {courses.map(course => (
                <option key={course.course_id} value={course.code}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Question Paper:</label>
            <select 
              value={selectedPaper} 
              onChange={(e) => setSelectedPaper(e.target.value)}
              className="form-select"
              disabled={!selectedCourse}
            >
              <option value="">Choose a paper...</option>
              {questionPapers.map(paper => (
                <option key={paper.paper_id} value={paper.paper_id}>
                  {paper.title} ({paper.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filters Section - Only show when paper is selected */}
      {selectedPaper && (
        <div className="filters-section">
          <div className="filters-row">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search question content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <label>Question Type:</label>
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="mcq">MCQ</option>
                <option value="subjective">Subjective</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Course Outcome:</label>
              <select 
                value={coFilter} 
                onChange={(e) => setCoFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All COs</option>
                {courseOutcomes.map(co => (
                  <option key={co.co_id} value={co.co_number}>
                    CO{co.co_number}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={clearFilters} className="btn-clear">
              Clear Filters
            </button>
          </div>

          <div className="results-info">
            <span className="results-count">
              {filteredQuestions.length} of {questions.length} questions
            </span>
          </div>
        </div>
      )}

      {/* Questions Table */}
      {selectedPaper && (
        <div className="questions-table-container">
          {filteredQuestions.length === 0 ? (
            <div className="no-questions">
              {questions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>No questions yet</h3>
                  <p>Start building your question paper by adding the first question.</p>
                  <button 
                    className="btn-primary"
                    onClick={() => onCreateNew(selectedCourse, selectedPaper)}
                  >
                    + Add Your First Question
                  </button>
                </div>
              ) : (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <p>No questions found matching your criteria.</p>
                  <button onClick={clearFilters} className="btn-secondary">
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="questions-table">
              <thead>
                <tr>
                  <th>Question Content</th>
                  <th>Type</th>
                  <th>CO</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((question) => (
                  <tr key={question.question_id}>
                    <td className="question-content">
                      <div 
                        className="content-preview"
                        onClick={() => onViewDetail(question)}
                      >
                        {question.content?.length > 150 
                          ? `${question.content.substring(0, 150)}...` 
                          : question.content
                        }
                      </div>
                    </td>
                    <td>{getQuestionTypeBadge(question.question_type)}</td>
                    <td>{getCOBadge(question.co_number)}</td>
                    <td>
                      <span className={`status-badge status-${question.status}`}>
                        {question.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-view"
                          onClick={() => onViewDetail(question)}
                          title="View Details"
                        >
                          👁️ View
                        </button>
                        <button 
                          className="btn-edit"
                          onClick={() => onEditQuestion(question)}
                          title="Edit Question"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteQuestion(question.question_id)}
                          title="Delete Question"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!selectedPaper && selectedCourse && (
        <div className="no-paper-selected">
          <div className="empty-icon">📄</div>
          <p>Select a question paper to view and manage questions</p>
        </div>
      )}

      {!selectedCourse && (
        <div className="no-course-selected">
          <div className="empty-icon">📚</div>
          <p>Select a course to get started with question management</p>
        </div>
      )}
    </div>
  );
};

export default QuestionsList;