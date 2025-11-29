// src/pages/admin/Moderation/ModReport.js
import React from 'react';
import './ModReport.css';

const ModReport = ({ moderation }) => {
  const BooleanIndicator = ({ value }) => {
    if (value === null || value === undefined) {
      return <span className="not-evaluated">Not Evaluated</span>;
    }
    return value ? (
      <span className="criterion-pass">✓ Yes</span>
    ) : (
      <span className="criterion-fail">✗ No</span>
    );
  };

  const CommentDisplay = ({ comment }) => {
    if (!comment || comment === 'N/A' || comment === '') {
      return <span className="no-comment">No comments provided</span>;
    }
    return <span className="comment-text">{comment}</span>;
  };

  return (
    <div className="mod-report">
      <div className="mod-report-header">
        <h3>Moderation Report</h3>
        <button className="btn-primary print-btn" onClick={() => window.print()}>
          📄 Print Moderation Report
        </button>
      </div>

      <div className="criteria-section">
        <h4>Moderation Criteria</h4>
        <div className="criteria-grid">
          {/* Questions Set per CO */}
          <div className="criterion-card">
            <div className="criterion-header">
              <label>Questions Set per Course Outcomes</label>
              <BooleanIndicator value={moderation.questions_set_per_co} />
            </div>
            <div className="criterion-comment">
              <strong>Comments:</strong> <CommentDisplay comment={moderation.questions_set_per_co_comment} />
            </div>
          </div>

          {/* Meets Level Standard */}
          <div className="criterion-card">
            <div className="criterion-header">
              <label>Meets Level Standard</label>
              <BooleanIndicator value={moderation.meets_level_standard} />
            </div>
            <div className="criterion-comment">
              <strong>Comments:</strong> <CommentDisplay comment={moderation.meets_level_standard_comment} />
            </div>
          </div>

          {/* Covers Syllabus */}
          <div className="criterion-card">
            <div className="criterion-header">
              <label>Covers Syllabus Adequately</label>
              <BooleanIndicator value={moderation.covers_syllabus} />
            </div>
            <div className="criterion-comment">
              <strong>Comments:</strong> <CommentDisplay comment={moderation.covers_syllabus_comment} />
            </div>
          </div>

          {/* Technically Accurate */}
          <div className="criterion-card">
            <div className="criterion-header">
              <label>Technically Accurate</label>
              <BooleanIndicator value={moderation.technically_accurate} />
            </div>
            <div className="criterion-comment">
              <strong>Comments:</strong> <CommentDisplay comment={moderation.technically_accurate_comment} />
            </div>
          </div>

          {/* Edited & Formatted Accurately */}
          <div className="criterion-card">
            <div className="criterion-header">
              <label>Edited & Formatted Accurately</label>
              <BooleanIndicator value={moderation.edited_formatted_accurately} />
            </div>
            <div className="criterion-comment">
              <strong>Comments:</strong> <CommentDisplay comment={moderation.edited_formatted_comment} />
            </div>
          </div>

          {/* Linguistically Accurate */}
          <div className="criterion-card">
            <div className="criterion-header">
              <label>Linguistically Accurate</label>
              <BooleanIndicator value={moderation.linguistically_accurate} />
            </div>
            <div className="criterion-comment">
              <strong>Comments:</strong> <CommentDisplay comment={moderation.linguistically_accurate_comment} />
            </div>
          </div>

          {/* Verbatim Copy Check */}
          <div className="criterion-card">
            <div className="criterion-header">
              <label>Verbatim Copy Check</label>
              <BooleanIndicator value={moderation.verbatim_copy_check} />
            </div>
            <div className="criterion-comment">
              <strong>Comments:</strong> <CommentDisplay comment={moderation.verbatim_copy_comment} />
            </div>
          </div>
        </div>
      </div>

      {/* Final Decision Section */}
      <div className="final-decision-section">
        <h4>Final Decision</h4>
        <div className="decision-card">
          <div className="decision-header">
            <span className="decision-label">Overall Status:</span>
            <span className={`decision-badge decision-${moderation.status}`}>
              {moderation.status.toUpperCase()}
            </span>
          </div>
          <div className="decision-meta">
            <p><strong>Moderator:</strong> {moderation.moderator_name} ({moderation.moderator_email})</p>
            <p><strong>Moderated on:</strong> {new Date(moderation.updated_at).toLocaleString()}</p>
            <p><strong>Paper Version:</strong> {moderation.paper_version}</p>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="summary-section">
        <h4>Summary</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Total Criteria:</span>
            <span className="summary-value">7</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Passed:</span>
            <span className="summary-value passed">
              {[
                moderation.questions_set_per_co,
                moderation.meets_level_standard,
                moderation.covers_syllabus,
                moderation.technically_accurate,
                moderation.edited_formatted_accurately,
                moderation.linguistically_accurate,
                moderation.verbatim_copy_check
              ].filter(Boolean).length}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Failed:</span>
            <span className="summary-value failed">
              {[
                moderation.questions_set_per_co,
                moderation.meets_level_standard,
                moderation.covers_syllabus,
                moderation.technically_accurate,
                moderation.edited_formatted_accurately,
                moderation.linguistically_accurate,
                moderation.verbatim_copy_check
              ].filter(val => val === false).length}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Not Evaluated:</span>
            <span className="summary-value not-evaluated">
              {[
                moderation.questions_set_per_co,
                moderation.meets_level_standard,
                moderation.covers_syllabus,
                moderation.technically_accurate,
                moderation.edited_formatted_accurately,
                moderation.linguistically_accurate,
                moderation.verbatim_copy_check
              ].filter(val => val === null || val === undefined).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModReport;