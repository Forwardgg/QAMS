import React, { useState, useEffect } from 'react';
import questionAPI from '../../../api/question.api';
import './QuestionDetail.css';

const QuestionDetail = ({ question, onBack, onEdit }) => {
  const [fullQuestion, setFullQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (question) {
      fetchFullQuestionDetails();
    }
  }, [question]);

  const fetchFullQuestionDetails = async () => {
    try {
      setLoading(true);
      const response = await questionAPI.getById(question.question_id);
      setFullQuestion(response.data || response);
      setError('');
    } catch (err) {
      setError('Failed to load question details');
      console.error('Error fetching question details:', err);
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge status-${status}`}>
        {status}
      </span>
    );
  };

  const displayQuestion = fullQuestion || question;

  if (loading) {
    return (
      <div className="question-detail-container">
        <div className="loading">Loading question details...</div>
      </div>
    );
  }

  return (
    <div className="question-detail-container">
      {/* Header Actions */}
      <div className="detail-header-actions">
        <button className="btn-back" onClick={onBack}>
          ← Back to List
        </button>
        <div className="action-buttons">
          <button 
            className="btn-edit"
            onClick={() => onEdit(displayQuestion)}
          >
            ✏️
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Question Details Card */}
      <div className="detail-card">
        <div className="detail-card-header">
          <h2>Question Details</h2>
          <div className="question-meta">
            <span>ID: {displayQuestion.question_id}</span>
          </div>
        </div>

        <div className="detail-card-body">
          {/* Basic Information */}
          <div className="detail-section">
            <div className="detail-grid">
              <div className="detail-item">
                <label>Question Type:</label>
                <div>{getQuestionTypeBadge(displayQuestion.question_type)}</div>
              </div>
              <div className="detail-item">
                <label>Course Outcome:</label>
                <div>{getCOBadge(displayQuestion.co_number)}</div>
              </div>
              <div className="detail-item">
                <label>Status:</label>
                <div>{getStatusBadge(displayQuestion.status)}</div>
              </div>
              <div className="detail-item">
                <label>Created:</label>
                <div>{new Date(displayQuestion.created_at).toLocaleString()}</div>
              </div>
              {displayQuestion.updated_at && (
                <div className="detail-item">
                  <label>Last Updated:</label>
                  <div>{new Date(displayQuestion.updated_at).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>

          {/* Question Content */}
          <div className="detail-section">
            <label className="section-label">Question Content:</label>
            <div className="content-full">
              {displayQuestion.content}
            </div>
          </div>

          {/* MCQ Options */}
          {displayQuestion.question_type === 'mcq' && displayQuestion.options && (
            <div className="detail-section">
              <label className="section-label">Options:</label>
              <div className="options-list">
                {displayQuestion.options.map((option, index) => (
                  <div 
                    key={option.option_id} 
                    className={`option-item ${option.is_correct ? 'correct' : ''}`}
                  >
                    <span className="option-number">{index + 1}.</span>
                    <span className="option-text">{option.option_text}</span>
                    {option.is_correct && (
                      <span className="correct-badge">✓ Correct Answer</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media Attachments */}
          {displayQuestion.media && displayQuestion.media.length > 0 && (
            <div className="detail-section">
              <label className="section-label">Attachments:</label>
              <div className="media-list">
                {displayQuestion.media.map(media => (
                  <div key={media.media_id} className="media-item">
                    <div className="media-info">
                      <span className="media-type">{media.media_type || 'File'}:</span>
                      <span className="media-caption">{media.caption || 'No caption'}</span>
                    </div>
                    <a 
                      href={media.media_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="media-link"
                    >
                      📎 View Attachment
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Course and Paper Info */}
          <div className="detail-section">
            <label className="section-label">Context:</label>
            <div className="context-info">
              <div className="context-item">
                <strong>Course:</strong> {displayQuestion.course_code} - {displayQuestion.course_title}
              </div>
              {displayQuestion.paper_title && (
                <div className="context-item">
                  <strong>Question Paper:</strong> {displayQuestion.paper_title}
                </div>
              )}
              {displayQuestion.author_name && (
                <div className="context-item">
                  <strong>Author:</strong> {displayQuestion.author_name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="detail-card-footer">
          <button className="btn-secondary" onClick={onBack}>
            Back to List
          </button>
          <button 
            className="btn-primary"
            onClick={() => onEdit(displayQuestion)}
          >
            ✏️ Edit Question
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetail;