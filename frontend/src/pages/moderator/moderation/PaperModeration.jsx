// src/frontend/src/pages/moderator/moderation/PaperModeration.jsx
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../../components/AuthProvider';
import moderatorAPI from '../../../api/moderator.api';
import './PaperModeration.css';

const PaperModeration = ({ paperId, onBack, onComplete }) => {
  const auth = useContext(AuthContext);
  
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [coBreakdown, setCoBreakdown] = useState([]);
  const [existingModeration, setExistingModeration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Moderation criteria state
  const [moderationData, setModerationData] = useState({
    questions_set_per_co: null,
    questions_set_per_co_comment: 'N/A',
    meets_level_standard: null,
    meets_level_standard_comment: 'N/A',
    covers_syllabus: null,
    covers_syllabus_comment: 'N/A',
    technically_accurate: null,
    technically_accurate_comment: 'N/A',
    edited_formatted_accurately: null,
    edited_formatted_comment: 'N/A',
    linguistically_accurate: null,
    linguistically_accurate_comment: 'N/A',
    verbatim_copy_check: null,
    verbatim_copy_comment: 'N/A',
    final_decision: ''
  });

  // Load paper details and CO breakdown
  useEffect(() => {
    if (paperId) {
      loadPaperDetails();
      loadCOBreakdown();
    }
  }, [paperId]);

  const loadPaperDetails = async () => {
    setLoading(true);
    try {
      const data = await moderatorAPI.getPaperDetails(paperId);
      setPaper(data.data.paper);
      setQuestions(data.data.questions || []);
      setExistingModeration(data.data.existingModeration);
      
      // Pre-fill existing moderation data if available
      if (data.data.existingModeration) {
        setModerationData(prev => ({
          ...prev,
          ...data.data.existingModeration,
          final_decision: data.data.existingModeration.status
        }));
      }
    } catch (error) {
      console.error('Failed to load paper details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCOBreakdown = async () => {
    try {
      const data = await moderatorAPI.getCOBreakdown(paperId);
      setCoBreakdown(data.data || []);
    } catch (error) {
      console.error('Failed to load CO breakdown:', error);
    }
  };

  const handleCriteriaChange = (field, value) => {
    setModerationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCommentChange = (field, value) => {
    setModerationData(prev => ({
      ...prev,
      [field]: value || 'N/A'
    }));
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

  const canApprovePaper = () => {
    return stats.changeRequested === 0 && stats.pending === 0;
  };

  const getApprovalMessage = () => {
    if (stats.changeRequested > 0) {
      return `❌ Cannot approve paper: ${stats.changeRequested} question(s) have changes requested. All questions must be approved to approve the paper.`;
    }
    if (stats.pending > 0) {
      return `❌ Cannot approve paper: ${stats.pending} question(s) are pending review. All questions must be approved to approve the paper.`;
    }
    return "✅ All questions are approved. You can approve the paper.";
  };

  const handleSubmitModeration = async () => {
    if (!moderationData.final_decision) {
      alert('Please select a final decision');
      return;
    }

    // Add validation for paper approval
    if (moderationData.final_decision === 'approved' && !canApprovePaper()) {
      alert(getApprovalMessage());
      return;
    }

    // Validate that all criteria are answered
    const requiredFields = [
      'questions_set_per_co',
      'meets_level_standard', 
      'covers_syllabus',
      'technically_accurate',
      'edited_formatted_accurately',
      'linguistically_accurate',
      'verbatim_copy_check'
    ];

    const missingFields = requiredFields.filter(field => 
      moderationData[field] === null || moderationData[field] === ''
    );

    if (missingFields.length > 0) {
      alert('Please answer all moderation criteria before submitting');
      return;
    }

    try {
      setSubmitting(true);
      const submissionData = {
        paper_id: paperId,
        ...moderationData
      };

      await moderatorAPI.submitModerationReport(submissionData);
      
      // Call completion callback
      onComplete();
    } catch (error) {
      console.error('Failed to submit moderation report:', error);
      
      // Show specific backend error message if available
      if (error.response?.data?.message) {
        alert(`Failed to submit: ${error.response.data.message}`);
      } else {
        alert('Failed to submit moderation report. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="paper-moderation-container">
        <div className="loading">Loading paper details...</div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="paper-moderation-container">
        <div className="error">Paper not found</div>
      </div>
    );
  }

  const stats = getApprovalStats();

  return (
    <div className="paper-moderation-container">
      {/* Header */}
      <div className="moderation-header">
        <div className="header-main">
          <h1>Final Paper Moderation</h1>
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
          <button 
            className="btn btn-back"
            onClick={onBack}
          >
            ← Back to Questions
          </button>
        </div>
      </div>

      {/* Question Approval Summary */}
      <div className="approval-summary">
        <h3>Question Approval Summary</h3>
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
            <div className="stat-label">Pending</div>
          </div>
        </div>
        
        {/* Approval Status Message */}
        <div className="approval-status-message">
          {moderationData.final_decision === 'approved' && (
            <div className={canApprovePaper() ? "approval-success" : "approval-warning"}>
              {getApprovalMessage()}
            </div>
          )}
        </div>
      </div>

      {/* CO Breakdown */}
      <div className="co-breakdown-section">
        <h3>Course Outcomes Coverage</h3>
        <div className="co-breakdown-grid">
          {coBreakdown.map(co => (
            <div key={co.co_id} className="co-item">
              <div className="co-header">
                <span className="co-number">CO{co.co_number}</span>
                <span className="co-stats">
                  {co.approved_questions || 0}/{co.total_questions || 0} Approved
                </span>
              </div>
              <div className="co-description">
                {co.co_description}
              </div>
              {co.total_questions === 0 && (
                <div className="co-warning">No questions mapped</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Moderation Criteria */}
      <div className="moderation-criteria">
        <h3>Moderation Criteria</h3>
        <p className="instructions">
          Please evaluate the question paper based on the following criteria:
        </p>

        <div className="criteria-list">
          {/* Questions Set Per CO */}
          <div className="criterion-item">
            <label className="criterion-question">
              1. Are questions appropriately set per Course Outcomes (COs)?
            </label>
            <div className="criterion-options">
              <label className="option">
                <input
                  type="radio"
                  name="questions_set_per_co"
                  value={true}
                  checked={moderationData.questions_set_per_co === true}
                  onChange={(e) => handleCriteriaChange('questions_set_per_co', true)}
                />
                <span>Yes</span>
              </label>
              <label className="option">
                <input
                  type="radio"
                  name="questions_set_per_co"
                  value={false}
                  checked={moderationData.questions_set_per_co === false}
                  onChange={(e) => handleCriteriaChange('questions_set_per_co', false)}
                />
                <span>No</span>
              </label>
            </div>
            <textarea
              placeholder="Additional comments (optional)"
              value={moderationData.questions_set_per_co_comment}
              onChange={(e) => handleCommentChange('questions_set_per_co_comment', e.target.value)}
              className="comment-box"
            />
          </div>

          {/* Meets Level Standard */}
          <div className="criterion-item">
            <label className="criterion-question">
              2. Does the question paper meet the level standard?
            </label>
            <div className="criterion-options">
              <label className="option">
                <input
                  type="radio"
                  name="meets_level_standard"
                  value={true}
                  checked={moderationData.meets_level_standard === true}
                  onChange={(e) => handleCriteriaChange('meets_level_standard', true)}
                />
                <span>Yes</span>
              </label>
              <label className="option">
                <input
                  type="radio"
                  name="meets_level_standard"
                  value={false}
                  checked={moderationData.meets_level_standard === false}
                  onChange={(e) => handleCriteriaChange('meets_level_standard', false)}
                />
                <span>No</span>
              </label>
            </div>
            <textarea
              placeholder="Additional comments (optional)"
              value={moderationData.meets_level_standard_comment}
              onChange={(e) => handleCommentChange('meets_level_standard_comment', e.target.value)}
              className="comment-box"
            />
          </div>

          {/* Covers Syllabus */}
          <div className="criterion-item">
            <label className="criterion-question">
              3. Does the question paper adequately cover the syllabus?
            </label>
            <div className="criterion-options">
              <label className="option">
                <input
                  type="radio"
                  name="covers_syllabus"
                  value={true}
                  checked={moderationData.covers_syllabus === true}
                  onChange={(e) => handleCriteriaChange('covers_syllabus', true)}
                />
                <span>Yes</span>
              </label>
              <label className="option">
                <input
                  type="radio"
                  name="covers_syllabus"
                  value={false}
                  checked={moderationData.covers_syllabus === false}
                  onChange={(e) => handleCriteriaChange('covers_syllabus', false)}
                />
                <span>No</span>
              </label>
            </div>
            <textarea
              placeholder="Additional comments (optional)"
              value={moderationData.covers_syllabus_comment}
              onChange={(e) => handleCommentChange('covers_syllabus_comment', e.target.value)}
              className="comment-box"
            />
          </div>

          {/* Technically Accurate */}
          <div className="criterion-item">
            <label className="criterion-question">
              4. Are the questions technically accurate?
            </label>
            <div className="criterion-options">
              <label className="option">
                <input
                  type="radio"
                  name="technically_accurate"
                  value={true}
                  checked={moderationData.technically_accurate === true}
                  onChange={(e) => handleCriteriaChange('technically_accurate', true)}
                />
                <span>Yes</span>
              </label>
              <label className="option">
                <input
                  type="radio"
                  name="technically_accurate"
                  value={false}
                  checked={moderationData.technically_accurate === false}
                  onChange={(e) => handleCriteriaChange('technically_accurate', false)}
                />
                <span>No</span>
              </label>
            </div>
            <textarea
              placeholder="Additional comments (optional)"
              value={moderationData.technically_accurate_comment}
              onChange={(e) => handleCommentChange('technically_accurate_comment', e.target.value)}
              className="comment-box"
            />
          </div>

          {/* Edited and Formatted */}
          <div className="criterion-item">
            <label className="criterion-question">
              5. Is the paper properly edited and formatted?
            </label>
            <div className="criterion-options">
              <label className="option">
                <input
                  type="radio"
                  name="edited_formatted_accurately"
                  value={true}
                  checked={moderationData.edited_formatted_accurately === true}
                  onChange={(e) => handleCriteriaChange('edited_formatted_accurately', true)}
                />
                <span>Yes</span>
              </label>
              <label className="option">
                <input
                  type="radio"
                  name="edited_formatted_accurately"
                  value={false}
                  checked={moderationData.edited_formatted_accurately === false}
                  onChange={(e) => handleCriteriaChange('edited_formatted_accurately', false)}
                />
                <span>No</span>
              </label>
            </div>
            <textarea
              placeholder="Additional comments (optional)"
              value={moderationData.edited_formatted_comment}
              onChange={(e) => handleCommentChange('edited_formatted_comment', e.target.value)}
              className="comment-box"
            />
          </div>

          {/* Linguistically Accurate */}
          <div className="criterion-item">
            <label className="criterion-question">
              6. Are the questions linguistically accurate?
            </label>
            <div className="criterion-options">
              <label className="option">
                <input
                  type="radio"
                  name="linguistically_accurate"
                  value={true}
                  checked={moderationData.linguistically_accurate === true}
                  onChange={(e) => handleCriteriaChange('linguistically_accurate', true)}
                />
                <span>Yes</span>
              </label>
              <label className="option">
                <input
                  type="radio"
                  name="linguistically_accurate"
                  value={false}
                  checked={moderationData.linguistically_accurate === false}
                  onChange={(e) => handleCriteriaChange('linguistically_accurate', false)}
                />
                <span>No</span>
              </label>
            </div>
            <textarea
              placeholder="Additional comments (optional)"
              value={moderationData.linguistically_accurate_comment}
              onChange={(e) => handleCommentChange('linguistically_accurate_comment', e.target.value)}
              className="comment-box"
            />
          </div>

          {/* Verbatim Copy Check */}
          <div className="criterion-item">
            <label className="criterion-question">
              7. Is there any verbatim copy from textbooks/reference materials?
            </label>
            <div className="criterion-options">
              <label className="option">
                <input
                  type="radio"
                  name="verbatim_copy_check"
                  value={false}
                  checked={moderationData.verbatim_copy_check === false}
                  onChange={(e) => handleCriteriaChange('verbatim_copy_check', false)}
                />
                <span>No (Good)</span>
              </label>
              <label className="option">
                <input
                  type="radio"
                  name="verbatim_copy_check"
                  value={true}
                  checked={moderationData.verbatim_copy_check === true}
                  onChange={(e) => handleCriteriaChange('verbatim_copy_check', true)}
                />
                <span>Yes (Issue)</span>
              </label>
            </div>
            <textarea
              placeholder="Additional comments (optional)"
              value={moderationData.verbatim_copy_comment}
              onChange={(e) => handleCommentChange('verbatim_copy_comment', e.target.value)}
              className="comment-box"
            />
          </div>
        </div>
      </div>

      {/* Final Decision */}
      <div className="final-decision">
        <h3>Final Decision</h3>
        
        {/* Validation message */}
        {moderationData.final_decision === 'approved' && !canApprovePaper() && (
          <div className="approval-warning">
            {getApprovalMessage()}
          </div>
        )}
        
        <div className="decision-options">
          <label className="decision-option approve">
            <input
              type="radio"
              name="final_decision"
              value="approved"
              checked={moderationData.final_decision === 'approved'}
              onChange={(e) => handleCriteriaChange('final_decision', e.target.value)}
            />
            <span className="decision-label">✅ Approve Paper</span>
            <span className="decision-description">
              All questions must be approved to approve the paper. Questions with changes requested will block approval.
            </span>
          </label>
          
          <label className="decision-option reject">
            <input
              type="radio"
              name="final_decision"
              value="rejected"
              checked={moderationData.final_decision === 'rejected'}
              onChange={(e) => handleCriteriaChange('final_decision', e.target.value)}
            />
            <span className="decision-label">❌ Reject Paper</span>
            <span className="decision-description">
              Paper status will be "Change Requested". All question statuses remain as set.
            </span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="submit-section">
        <button 
          className="btn btn-submit"
          onClick={handleSubmitModeration}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Final Moderation Report'}
        </button>
        <p className="submit-note">
          Once submitted, this moderation report cannot be edited.
        </p>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-navigation">
        <button 
          className="btn btn-back"
          onClick={onBack}
        >
          ← Back to Questions
        </button>
      </div>
    </div>
  );
};

export default PaperModeration;