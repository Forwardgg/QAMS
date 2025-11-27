// src/frontend/src/pages/moderator/moderation/QuestionModeration.jsx
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../../components/AuthProvider';
import moderatorAPI from '../../../api/moderator.api';
import './QuestionModeration.css';

const QuestionModeration = ({ paperId, onBack, onContinue }) => {
  const auth = useContext(AuthContext);
  
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load paper and questions
  useEffect(() => {
    if (paperId) {
      loadPaperDetails();
    }
  }, [paperId]);

  const loadPaperDetails = async () => {
    setLoading(true);
    try {
      const data = await moderatorAPI.getPaperDetails(paperId);
      setPaper(data.data.paper);
      setQuestions(data.data.questions || []);
    } catch (error) {
      console.error('Failed to load paper details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update question status
  const handleQuestionStatusChange = async (questionId, newStatus) => {
    try {
      setSaving(true);
      await moderatorAPI.updateQuestionStatus(questionId, newStatus);
      
      // Update local state
      setQuestions(prev => prev.map(q => 
        q.question_id === questionId ? { ...q, status: newStatus } : q
      ));
      
      setHasChanges(true);
    } catch (error) {
      console.error('Failed to update question status:', error);
    } finally {
      setSaving(false);
    }
  };

  // Start moderation if not already started
  const handleStartModeration = async () => {
    try {
      setSaving(true);
      await moderatorAPI.startModeration(paperId);
      // Reload paper details to get updated status
      await loadPaperDetails();
    } catch (error) {
      console.error('Failed to start moderation:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      draft: 'status-draft',
      submitted: 'status-submitted',
      under_review: 'status-under-review',
      change_requested: 'status-change-requested',
      approved: 'status-approved'
    };
    return statusClasses[status] || 'status-default';
  };

  // Get approval stats
  const getApprovalStats = () => {
    const total = questions.length;
    const approved = questions.filter(q => q.status === 'approved').length;
    const changeRequested = questions.filter(q => q.status === 'change_requested').length;
    const pending = questions.filter(q => q.status === 'submitted' || q.status === 'under_review').length;
    
    return { total, approved, changeRequested, pending };
  };

  if (loading) {
    return (
      <div className="question-moderation-container">
        <div className="loading">Loading paper details...</div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="question-moderation-container">
        <div className="error">Paper not found</div>
      </div>
    );
  }

  const stats = getApprovalStats();

  return (
    <div className="question-moderation-container">
      {/* Header */}
      <div className="moderation-header">
        <div className="header-main">
          <h1>Question Moderation</h1>
          <div className="paper-info">
            <h2>{paper.title}</h2>
            <div className="paper-meta">
              <span className="course-code">{paper.course_code}</span>
              <span className="course-title">{paper.course_title}</span>
              <span className={`paper-status ${getStatusBadgeClass(paper.status)}`}>
                {paper.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          {paper.status === 'submitted' && (
            <button 
              className="btn btn-start"
              onClick={handleStartModeration}
              disabled={saving}
            >
              {saving ? 'Starting...' : 'Start Moderation'}
            </button>
          )}
          
          <button 
            className="btn btn-continue"
            onClick={onContinue}
            disabled={saving || (paper.status === 'submitted' && !hasChanges)}
          >
            Continue to Paper Moderation →
          </button>
        </div>
      </div>

      {/* Approval Stats */}
      <div className="approval-stats">
        <div className="stat-item">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Questions</div>
        </div>
        <div className="stat-item approved">
          <div className="stat-number">{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-item change-requested">
          <div className="stat-number">{stats.changeRequested}</div>
          <div className="stat-label">Changes Requested</div>
        </div>
        <div className="stat-item pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending Review</div>
        </div>
      </div>

      {/* Questions List */}
      <div className="questions-list">
        <h3>Questions Review</h3>
        <p className="instructions">
          Review each question and mark as ✅ Approved or ❌ Change Requested
        </p>

        <div className="questions-container">
          {questions.map((question, index) => (
            <div key={question.question_id} className="question-item">
              <div className="question-header">
                <div className="question-meta">
                  <span className="question-number">Q{index + 1}</span>
                  {question.co_number && (
                    <span className="co-badge">CO{question.co_number}</span>
                  )}
                  <span className={`question-status ${getStatusBadgeClass(question.status)}`}>
                    {question.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="question-actions">
                  <button
                    className={`btn btn-approve ${question.status === 'approved' ? 'active' : ''}`}
                    onClick={() => handleQuestionStatusChange(question.question_id, 'approved')}
                    disabled={saving || paper.status === 'submitted'}
                  >
                    ✅ Approve
                  </button>
                  <button
                    className={`btn btn-reject ${question.status === 'change_requested' ? 'active' : ''}`}
                    onClick={() => handleQuestionStatusChange(question.question_id, 'change_requested')}
                    disabled={saving || paper.status === 'submitted'}
                  >
                    ❌ Request Changes
                  </button>
                </div>
              </div>

              <div 
                className="question-content"
                dangerouslySetInnerHTML={{ __html: question.content_html }}
              />
            </div>
          ))}
        </div>

        {questions.length === 0 && (
          <div className="no-questions">
            No questions found for this paper.
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="bottom-actions">
        <button 
          className="btn btn-back"
          onClick={onBack}
        >
          ← Back to Papers List
        </button>
        <button 
          className="btn btn-primary"
          onClick={onContinue}
          disabled={saving || (paper.status === 'submitted' && !hasChanges)}
        >
          Continue to Paper Moderation →
        </button>
      </div>
    </div>
  );
};

export default QuestionModeration;