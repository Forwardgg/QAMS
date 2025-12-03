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

  useEffect(() => {
    if (paperId) {
      loadPaperDetails();
    }
  }, [paperId]);

  const loadPaperDetails = async () => {
    setLoading(true);
    try {
      const response = await moderatorAPI.getPaperDetails(paperId);
      const data = response.data;
      
      setPaper(data.paper);
      
      // Check if main response has CO data
      const hasCO = data.questions?.some(q => q.co_number || q.co_id);
      console.log('Has CO data in main response?', hasCO);
      
      if (hasCO) {
        // Use CO data from main response
        setQuestions(data.questions || []);
      } else {
        // Try to get CO data from breakdown
        try {
          const coResponse = await moderatorAPI.getCOBreakdown(paperId);
          console.log('CO Breakdown response:', coResponse);
          
          if (coResponse.success && coResponse.data) {
            // Create a mapping of question_id to CO data
            const questionToCOMap = {};
            coResponse.data.forEach(co => {
              if (co.questions) {
                co.questions.forEach(q => {
                  questionToCOMap[q.question_id] = {
                    co_number: co.co_number,
                    co_description: co.co_description
                  };
                });
              }
            });
            
            // Map CO data to questions
            const questionsWithCO = data.questions.map(question => {
              const coData = questionToCOMap[question.question_id];
              return coData ? { ...question, ...coData } : question;
            });
            
            console.log('Questions with CO mapped:', questionsWithCO);
            setQuestions(questionsWithCO);
          } else {
            setQuestions(data.questions || []);
          }
        } catch (coError) {
          console.log('CO breakdown failed, using questions without CO data');
          setQuestions(data.questions || []);
        }
      }
    } catch (error) {
      console.error('Failed to load paper details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionStatusChange = async (questionId, newStatus) => {
    try {
      setSaving(true);
      await moderatorAPI.updateQuestionStatus(questionId, newStatus);
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

  const handleStartModeration = async () => {
    try {
      setSaving(true);
      await moderatorAPI.startModeration(paperId);
      await loadPaperDetails();
    } catch (error) {
      console.error('Failed to start moderation:', error);
    } finally {
      setSaving(false);
    }
  };

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

  const getApprovalStats = () => {
    const total = questions.length;
    const approved = questions.filter(q => q.status === 'approved').length;
    const changeRequested = questions.filter(q => q.status === 'change_requested').length;
    const pending = questions.filter(q => q.status === 'submitted' || q.status === 'under_review').length;
    return { total, approved, changeRequested, pending };
  };

  if (loading) return <div className="loading">Loading paper details...</div>;
  if (!paper) return <div className="error">Paper not found</div>;

  const stats = getApprovalStats();
  const hasCOData = questions.some(q => q.co_number || q.co_id);

  return (
    <div className="question-moderation-container">
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
            <button className="btn btn-start" onClick={handleStartModeration} disabled={saving}>
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

      <div className="approval-stats">
        <div className="stat-item"><div className="stat-number">{stats.total}</div><div className="stat-label">Total</div></div>
        <div className="stat-item approved"><div className="stat-number">{stats.approved}</div><div className="stat-label">Approved</div></div>
        <div className="stat-item change-requested"><div className="stat-number">{stats.changeRequested}</div><div className="stat-label">Changes</div></div>
        <div className="stat-item pending"><div className="stat-number">{stats.pending}</div><div className="stat-label">Pending</div></div>
      </div>

      <div className="questions-list">
        <h3>Questions Review</h3>
        <p className="instructions">
          Review each question and mark as ✅ Approved or ❌ Change Requested
          {hasCOData && ' • CO badges show Course Outcomes'}
          {' • Marks show question weightage'}
        </p>

        <div className="questions-container">
          {questions.map((question, index) => {
            const coNumber = question.co_number || question.co_id;
            
            return (
              <div key={question.question_id} className="question-item">
                <div className="question-header">
                  <div className="question-meta">
                    <span className="question-number">Q{index + 1}</span>
                    {/* NEW: Add marks display */}
                    {question.marks !== null && question.marks !== undefined && (
                      <span className="marks-badge" title={`Marks: ${question.marks}`}>
                        [{question.marks} marks]
                      </span>
                    )}
                    {/* ALWAYS show CO badge if available */}
                    {coNumber && <span className="co-badge">CO{coNumber}</span>}
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

                <div className="question-content" dangerouslySetInnerHTML={{ __html: question.content_html }} />

                {/* ALWAYS show CO info if available */}
                {coNumber && (
                  <div className="question-co-info">
                    <strong>Course Outcome:</strong> CO{coNumber}
                    {question.co_description && <span> - {question.co_description}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {questions.length === 0 && <div className="no-questions">No questions found</div>}
      </div>

      <div className="bottom-actions">
        <button className="btn btn-back" onClick={onBack}>← Back to Papers List</button>
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