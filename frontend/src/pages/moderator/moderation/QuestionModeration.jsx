import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../../components/AuthProvider';
import moderatorAPI from '../../../api/moderator.api';
import BloomAnalysis from './BloomAnalysis';
import './QuestionModeration.css';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const QuestionModeration = ({ paperId, onBack, onContinue }) => {
  const auth = useContext(AuthContext);
  
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showBloomAnalysis, setShowBloomAnalysis] = useState(false);
  const [showAcceptAllConfirm, setShowAcceptAllConfirm] = useState(false);
  const [showRejectAllConfirm, setShowRejectAllConfirm] = useState(false);

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
      
      if (hasCO) {
        // Use CO data from main response
        setQuestions(data.questions || []);
      } else {
        // Try to get CO data from breakdown
        try {
          const coResponse = await moderatorAPI.getCOBreakdown(paperId);
          
          if (coResponse.success && coResponse.data) {
            // Create a mapping of question_id to CO data
            const questionToCOMap = {};
            coResponse.data.forEach(co => {
              if (co.questions) {
                co.questions.forEach(q => {
                  questionToCOMap[q.question_id] = {
                    co_number: co.co_number,
                    co_description: co.co_description,
                    bloom_level: co.bloom_level
                  };
                });
              }
            });
            
            // Map CO data to questions
            const questionsWithCO = data.questions.map(question => {
              const coData = questionToCOMap[question.question_id];
              return coData ? { ...question, ...coData } : question;
            });
            
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

  const handleAcceptAll = async () => {
    try {
      setSaving(true);
      
      // Update all questions to approved
      const updatePromises = questions.map(question => 
        moderatorAPI.updateQuestionStatus(question.question_id, 'approved')
      );
      
      await Promise.all(updatePromises);
      
      // Update local state
      setQuestions(prev => prev.map(q => ({ ...q, status: 'approved' })));
      setHasChanges(true);
      setShowAcceptAllConfirm(false);
      
    } catch (error) {
      console.error('Failed to accept all questions:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRejectAll = async () => {
    try {
      setSaving(true);
      
      // Update all questions to change_requested
      const updatePromises = questions.map(question => 
        moderatorAPI.updateQuestionStatus(question.question_id, 'change_requested')
      );
      
      await Promise.all(updatePromises);
      
      // Update local state
      setQuestions(prev => prev.map(q => ({ ...q, status: 'change_requested' })));
      setHasChanges(true);
      setShowRejectAllConfirm(false);
      
    } catch (error) {
      console.error('Failed to reject all questions:', error);
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

  const toggleBloomAnalysis = () => {
    setShowBloomAnalysis(!showBloomAnalysis);
  };

  if (loading) return <div className="loading">Loading paper details...</div>;
  if (!paper) return <div className="error">Paper not found</div>;

  const stats = getApprovalStats();
  const hasCOData = questions.some(q => q.co_number || q.co_id);
  const hasBloomData = questions.some(q => q.bloom_level);
  const moderationStarted = paper.status !== 'submitted';
  const allApproved = questions.length > 0 && questions.every(q => q.status === 'approved');
  const allRejected = questions.length > 0 && questions.every(q => q.status === 'change_requested');

  return (
    <div className="question-moderation-container">
      {/* Header */}
      <div className="moderation-header">
        <div className="header-main">
          <h1>Question Moderation</h1>
          <div className="paper-info">
            <h2>{paper.title}</h2>
            <div className="paper-meta">
              <span className="course-code">{paper.course_code}: {paper.course_title}</span>
              <div className="quick-stats">
                <div className="quick-stat total">
                  <span className="stat-count">{stats.total}</span>
                  <span className="stat-label">Total</span>
                </div>
                <div className="quick-stat approved">
                  <span className="stat-count">{stats.approved}</span>
                  <span className="stat-label">Approved</span>
                </div>
                <div className="quick-stat pending">
                  <span className="stat-count">{stats.pending}</span>
                  <span className="stat-label">Pending</span>
                </div>
                <div className="quick-stat change-requested">
                  <span className="stat-count">{stats.changeRequested}</span>
                  <span className="stat-label">Changes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          {paper.status === 'submitted' && (
            <button className="btn btn-start" onClick={handleStartModeration} disabled={saving}>
              <PlayArrowIcon style={{ fontSize: '1rem', marginRight: '4px' }} />
              {saving ? 'Starting...' : 'Start Moderation'}
            </button>
          )}
          
          <button 
            className="btn btn-continue"
            onClick={onContinue}
            disabled={saving || (paper.status === 'submitted' && !hasChanges)}
          >
            Create Moderation Report
            <ArrowForwardIcon style={{ fontSize: '1rem', marginLeft: '4px' }} />
          </button>

          {hasBloomData && (
            <button 
              className={`btn btn-toggle ${showBloomAnalysis ? 'active' : ''}`}
              onClick={toggleBloomAnalysis}
            >
              <AssessmentIcon style={{ fontSize: '1rem', marginRight: '4px' }} />
              {showBloomAnalysis ? 'Hide Bloom Analysis' : 'Show Bloom Analysis'}
            </button>
          )}
        </div>
      </div>

      {/* Removed old approval stats box */}

      {/* Bloom's Analysis Section (Toggleable) */}
      {showBloomAnalysis && hasBloomData && (
        <BloomAnalysis questions={questions} />
      )}

      {/* Questions List */}
      <div className="questions-list">
        <div className="questions-header">
          <div className="questions-header-left">
            <h3>Questions Review</h3>
            <p className="instructions">
              Review each question and mark as Approved or Change Requested
            </p>
          </div>
          
          {moderationStarted && questions.length > 0 && (
            <div className="questions-header-right">
              <div className="bulk-actions">
                <button
                  className="btn btn-approve-all"
                  onClick={() => setShowAcceptAllConfirm(true)}
                  disabled={saving || allApproved}
                >
                  <CheckCircleIcon style={{ fontSize: '1rem', marginRight: '4px' }} />
                  Accept All
                </button>
                <button
                  className="btn btn-reject-all"
                  onClick={() => setShowRejectAllConfirm(true)}
                  disabled={saving || allRejected}
                >
                  <CancelIcon style={{ fontSize: '1rem', marginRight: '4px' }} />
                  Reject All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Accept All Confirmation */}
        {showAcceptAllConfirm && (
          <div className="confirmation-modal">
            <div className="confirmation-content">
              <h4>Accept All Questions?</h4>
              <p>This will mark all {questions.length} questions as <strong>Approved</strong>.</p>
              <p>This action cannot be undone.</p>
              <div className="confirmation-actions">
                <button className="btn btn-cancel" onClick={() => setShowAcceptAllConfirm(false)} disabled={saving}>
                  Cancel
                </button>
                <button className="btn btn-confirm-accept" onClick={handleAcceptAll} disabled={saving}>
                  {saving ? 'Processing...' : 'Yes, Accept All'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject All Confirmation */}
        {showRejectAllConfirm && (
          <div className="confirmation-modal">
            <div className="confirmation-content">
              <h4>Reject All Questions?</h4>
              <p>This will mark all {questions.length} questions as <strong>Change Requested</strong>.</p>
              <p>This action cannot be undone.</p>
              <div className="confirmation-actions">
                <button className="btn btn-cancel" onClick={() => setShowRejectAllConfirm(false)} disabled={saving}>
                  Cancel
                </button>
                <button className="btn btn-confirm-reject" onClick={handleRejectAll} disabled={saving}>
                  {saving ? 'Processing...' : 'Yes, Reject All'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="questions-container">
          {questions.map((question, index) => {
            const coNumber = question.co_number || question.co_id;
            const bloomLevel = question.bloom_level;
            
            return (
              <div key={question.question_id} className="question-item">
                <div className="question-header">
                  <div className="question-meta">
                    <span className="question-number">Q{index + 1}</span>
                    {/* Marks display */}
                    {question.marks !== null && question.marks !== undefined && (
                      <span className="marks-badge" title={`Marks: ${question.marks}`}>
                        {question.marks} marks
                      </span>
                    )}
                    {/* CO badge */}
                    {coNumber && <span className="co-badge">CO{coNumber}</span>}
                    <span className={`question-status ${getStatusBadgeClass(question.status)}`}>
                      {question.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="question-actions">
                    <button
                      className={`btn btn-approve ${question.status === 'approved' ? 'active' : ''}`}
                      onClick={() => handleQuestionStatusChange(question.question_id, 'approved')}
                      disabled={saving || !moderationStarted}
                    >
                      <CheckIcon style={{ fontSize: '1rem', marginRight: '4px' }} />
                      Approve
                    </button>
                    <button
                      className={`btn btn-reject ${question.status === 'change_requested' ? 'active' : ''}`}
                      onClick={() => handleQuestionStatusChange(question.question_id, 'change_requested')}
                      disabled={saving || !moderationStarted}
                    >
                      <CloseIcon style={{ fontSize: '1rem', marginRight: '4px' }} />
                      Request Changes
                    </button>
                  </div>
                </div>

                <div className="question-content" dangerouslySetInnerHTML={{ __html: question.content_html }} />

                {/* CO and Bloom's info */}
                {(coNumber || bloomLevel) && (
                  <div className="question-co-info">
                    {coNumber && (
                      <>
                        <strong>Course Outcome:</strong> CO{coNumber}
                        {question.co_description && <span className="co-description"> - {question.co_description}</span>}
                        {bloomLevel && ' • '}
                      </>
                    )}
                    {bloomLevel && (
                      <>
                        <strong>Bloom's Level:</strong> {bloomLevel}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {questions.length === 0 && <div className="no-questions">No questions found</div>}
      </div>

      <div className="bottom-actions">
        <button className="btn btn-back" onClick={onBack}>
          <ArrowBackIcon style={{ fontSize: '1rem', marginRight: '4px' }} />
          Back to Papers List
        </button>
        <button 
          className="btn btn-primary" 
          onClick={onContinue}
          disabled={saving || (paper.status === 'submitted' && !hasChanges)}
        >
          Create Moderation Report
          <ArrowForwardIcon style={{ fontSize: '1rem', marginLeft: '4px' }} />
        </button>
      </div>
    </div>
  );
};

export default QuestionModeration;