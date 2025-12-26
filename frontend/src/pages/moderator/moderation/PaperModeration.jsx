import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../../components/AuthProvider';
import moderatorAPI from '../../../api/moderator.api';
import BloomAnalysis from './BloomAnalysis';
import './PaperModeration.css';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import WarningIcon from '@mui/icons-material/Warning';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const PaperModeration = ({ paperId, onBack, onComplete }) => {
  const auth = useContext(AuthContext);
  
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [coBreakdown, setCoBreakdown] = useState([]);
  const [existingModeration, setExistingModeration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showBloomAnalysis, setShowBloomAnalysis] = useState(false);
  
  // FIXED: Initialize ALL criteria 1-6 to YES (true), criterion 7 to NO (false)
  const [moderationData, setModerationData] = useState({
    questions_set_per_co: true,
    questions_set_per_co_comment: 'N/A',
    meets_level_standard: true,
    meets_level_standard_comment: 'N/A',
    covers_syllabus: true,
    covers_syllabus_comment: 'N/A',
    technically_accurate: true,
    technically_accurate_comment: 'N/A',
    edited_formatted_accurately: true,
    edited_formatted_comment: 'N/A',
    linguistically_accurate: true,
    linguistically_accurate_comment: 'N/A',
    verbatim_copy_check: false, // Only this one is NO
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
      
      console.log('Existing moderation from API:', data.data.existingModeration);
      
      // Only update comments from existing moderation, NOT the boolean values
      // This ensures YES stays selected by default
      if (data.data.existingModeration) {
        setModerationData(prev => {
          const updated = { ...prev };
          
          // Update comments only
          const commentFields = [
            'questions_set_per_co_comment',
            'meets_level_standard_comment',
            'covers_syllabus_comment',
            'technically_accurate_comment',
            'edited_formatted_comment',
            'linguistically_accurate_comment',
            'verbatim_copy_comment'
          ];
          
          commentFields.forEach(field => {
            const apiValue = data.data.existingModeration[field];
            if (apiValue !== undefined && apiValue !== null) {
              updated[field] = apiValue;
            }
          });
          
          // Update final decision
          if (data.data.existingModeration.status) {
            updated.final_decision = data.data.existingModeration.status;
          }
          
          console.log('Updated moderation data (comments only):', updated);
          return updated;
        });
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
    console.log(`Changing ${field} to:`, value);
    setModerationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCommentChange = (field, value) => {
    // If user clears the field completely, keep it as empty string
    if (value === '') {
      setModerationData(prev => ({
        ...prev,
        [field]: ''
      }));
    } else {
      setModerationData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCommentBlur = (field, value) => {
    // Only set to N/A if field is completely empty
    if (!value || value.trim() === '') {
      setModerationData(prev => ({
        ...prev,
        [field]: 'N/A'
      }));
    }
  };

  const canApprovePaper = () => {
    const total = questions.length;
    const changeRequested = questions.filter(q => q.status === 'change_requested').length;
    const pending = questions.filter(q => q.status === 'submitted' || q.status === 'under_review').length;
    return changeRequested === 0 && pending === 0;
  };

  const getApprovalMessage = () => {
    const total = questions.length;
    const changeRequested = questions.filter(q => q.status === 'change_requested').length;
    const pending = questions.filter(q => q.status === 'submitted' || q.status === 'under_review').length;
    
    if (changeRequested > 0) {
      return `Cannot approve paper: ${changeRequested} question(s) have changes requested.`;
    }
    if (pending > 0) {
      return `Cannot approve paper: ${pending} question(s) are pending review.`;
    }
    return "All questions are approved. You can approve the paper.";
  };

  const handleSubmitModeration = async () => {
    if (!moderationData.final_decision) {
      alert('Please select a final decision');
      return;
    }

    if (moderationData.final_decision === 'approved' && !canApprovePaper()) {
      alert(getApprovalMessage());
      return;
    }

    try {
      setSubmitting(true);
      const submissionData = {
        paper_id: paperId,
        ...moderationData
      };

      console.log('Submitting moderation data:', submissionData);
      await moderatorAPI.submitModerationReport(submissionData);
      
      onComplete();
    } catch (error) {
      console.error('Failed to submit moderation report:', error);
      alert(error.response?.data?.message || 'Failed to submit moderation report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading paper details...</div>;
  if (!paper) return <div className="error">Paper not found</div>;

  const totalQuestions = questions.length;
  const approvedQuestions = questions.filter(q => q.status === 'approved').length;

  return (
    <div className="paper-moderation-container">
      {/* Header */}
      <div className="moderation-header">
        <div className="header-main">
          <h1>Paper Moderation Report</h1>
          <div className="paper-info">
            <h2>{paper.title}</h2>
            <div className="paper-meta">
              <span className="course-name">{paper.course_code}: {paper.course_title}</span>
              <div className="quick-stats">
                <span className="question-count">{totalQuestions} Questions</span>
                <span className={`approval-count ${approvedQuestions === totalQuestions ? 'all-approved' : ''}`}>
                  {approvedQuestions} Approved
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="action-buttons">
            <button className="btn btn-back" onClick={onBack}>
              <ArrowBackIcon className="icon" /> Back to Questions
            </button>
            
            {questions.length > 0 && (
              <button 
                className={`btn btn-bloom ${showBloomAnalysis ? 'active' : ''}`}
                onClick={() => setShowBloomAnalysis(!showBloomAnalysis)}
              >
                <AssessmentIcon className="icon" />
                {showBloomAnalysis ? 'Hide Bloom Analysis' : 'Show Bloom Analysis'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bloom's Analysis Section */}
      {showBloomAnalysis && (
        <BloomAnalysis questions={questions} />
      )}

      {/* Moderation Criteria */}
      <div className="moderation-criteria">
        <h3>Moderation Criteria</h3>
        <p className="instructions">
          Please evaluate the question paper based on the following criteria:
        </p>

        <div className="criteria-list">
          {/* Criteria 1-6: All default to YES */}
          {[
            {id: 1, field: 'questions_set_per_co', label: 'Are questions appropriately set per Course Outcomes (COs)?', comment: 'questions_set_per_co_comment'},
            {id: 2, field: 'meets_level_standard', label: 'Does the question paper meet the level standard?', comment: 'meets_level_standard_comment'},
            {id: 3, field: 'covers_syllabus', label: 'Does the question paper adequately cover the syllabus?', comment: 'covers_syllabus_comment'},
            {id: 4, field: 'technically_accurate', label: 'Are the questions technically accurate?', comment: 'technically_accurate_comment'},
            {id: 5, field: 'edited_formatted_accurately', label: 'Is the paper properly edited and formatted?', comment: 'edited_formatted_comment'},
            {id: 6, field: 'linguistically_accurate', label: 'Are the questions linguistically accurate?', comment: 'linguistically_accurate_comment'},
          ].map(criterion => (
            <div key={criterion.id} className="criterion-item">
              <label className="criterion-question">
                {criterion.id}. {criterion.label}
              </label>
              <div className="criterion-options">
                <label className={`option ${moderationData[criterion.field] === true ? 'selected-yes' : ''}`}>
                  <input
                    type="radio"
                    name={criterion.field}
                    value="true"
                    checked={moderationData[criterion.field] === true}
                    onChange={(e) => handleCriteriaChange(criterion.field, true)}
                  />
                  <span className="option-label">Yes</span>
                </label>
                <label className={`option ${moderationData[criterion.field] === false ? 'selected-no' : ''}`}>
                  <input
                    type="radio"
                    name={criterion.field}
                    value="false"
                    checked={moderationData[criterion.field] === false}
                    onChange={(e) => handleCriteriaChange(criterion.field, false)}
                  />
                  <span className="option-label">No</span>
                </label>
              </div>
              <textarea
                placeholder="Comments (optional)"
                value={moderationData[criterion.comment]}
                onChange={(e) => handleCommentChange(criterion.comment, e.target.value)}
                onBlur={(e) => handleCommentBlur(criterion.comment, e.target.value)}
                className="comment-box"
              />
            </div>
          ))}

          {/* Criterion 7: Default to NO */}
          <div className="criterion-item">
            <label className="criterion-question">
              7. Is there any verbatim copy from textbooks/reference materials?
            </label>
            <div className="criterion-options">
              <label className={`option ${moderationData.verbatim_copy_check === false ? 'selected-no-good' : ''}`}>
                <input
                  type="radio"
                  name="verbatim_copy_check"
                  value="false"
                  checked={moderationData.verbatim_copy_check === false}
                  onChange={(e) => handleCriteriaChange('verbatim_copy_check', false)}
                />
                <span className="option-label">No</span>
              </label>
              <label className={`option ${moderationData.verbatim_copy_check === true ? 'selected-yes-bad' : ''}`}>
                <input
                  type="radio"
                  name="verbatim_copy_check"
                  value="true"
                  checked={moderationData.verbatim_copy_check === true}
                  onChange={(e) => handleCriteriaChange('verbatim_copy_check', true)}
                />
                <span className="option-label">Yes</span>
              </label>
            </div>
            <textarea
              placeholder="Comments (optional)"
              value={moderationData.verbatim_copy_comment}
              onChange={(e) => handleCommentChange('verbatim_copy_comment', e.target.value)}
              onBlur={(e) => handleCommentBlur('verbatim_copy_comment', e.target.value)}
              className="comment-box"
            />
          </div>
        </div>
      </div>

      {/* Final Decision */}
      <div className="final-decision">
        <h3>Final Decision</h3>
        
        {moderationData.final_decision === 'approved' && !canApprovePaper() && (
          <div className="approval-warning">
            <WarningIcon className="icon" />
            {getApprovalMessage()}
          </div>
        )}
        
        <div className="decision-options">
          <label className={`decision-option approve ${moderationData.final_decision === 'approved' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="final_decision"
              value="approved"
              checked={moderationData.final_decision === 'approved'}
              onChange={(e) => handleCriteriaChange('final_decision', e.target.value)}
            />
            <CheckIcon className="icon" />
            <div className="decision-content">
              <div className="decision-label">Approve Paper</div>
              <div className="decision-description">
                All {totalQuestions} questions must be approved
              </div>
            </div>
          </label>
          
          <label className={`decision-option reject ${moderationData.final_decision === 'rejected' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="final_decision"
              value="rejected"
              checked={moderationData.final_decision === 'rejected'}
              onChange={(e) => handleCriteriaChange('final_decision', e.target.value)}
            />
            <CloseIcon className="icon" />
            <div className="decision-content">
              <div className="decision-label">Reject Paper</div>
              <div className="decision-description">
                Paper status: Change Requested
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="submit-section">
        <button 
          className="btn-submit"
          onClick={handleSubmitModeration}
          disabled={submitting}
        >
          <SendIcon className="icon" />
          {submitting ? 'Submitting...' : 'Submit Moderation Report'}
        </button>
        <div className="submit-note">
          Once submitted, this report cannot be edited
        </div>
      </div>
    </div>
  );
};

export default PaperModeration;