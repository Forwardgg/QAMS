// src/components/moderation/ModReportModal.js
import React, { useState } from 'react';
import moderatorAPI from '../../../api/moderator.api';
import './ModReportModal.css';

const ModReportModal = ({ isOpen, onClose, moderation, paperData }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState({ type: '', text: '' });

  // Debug logging
  console.log('ModReportModal rendered:', { isOpen, moderation });

  if (!isOpen) return null;

  const BooleanIndicator = ({ value, criterionId }) => {
    if (value === null || value === undefined) {
      return <span className="not-evaluated">Not Evaluated</span>;
    }
    
    // Special case for verbatim copy check (criterion 7)
    if (criterionId === 7) {
      return value ? (
        <span className="criterion-fail">✗ Yes</span>
      ) : (
        <span className="criterion-pass">✓ No</span>
      );
    }
    
    // For all other criteria
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

  const criteria = [
    {
      id: 1,
      question: "Whether the question paper is set as per the COs?",
      field: 'questions_set_per_co',
      commentField: 'questions_set_per_co_comment'
    },
    {
      id: 2,
      question: "Does the question paper meet the standard of the level of the students?",
      field: 'meets_level_standard',
      commentField: 'meets_level_standard_comment'
    },
    {
      id: 3,
      question: "Does the question paper covers the syllabus specified for the exam?",
      field: 'covers_syllabus',
      commentField: 'covers_syllabus_comment'
    },
    {
      id: 4,
      question: "Whether the question paper is technically accurate?",
      field: 'technically_accurate',
      commentField: 'technically_accurate_comment'
    },
    {
      id: 5,
      question: "Whether the question paper is edited and formatted accurately?",
      field: 'edited_formatted_accurately',
      commentField: 'edited_formatted_comment'
    },
    {
      id: 6,
      question: "Whether the question paper is linguistically accurate?",
      field: 'linguistically_accurate',
      commentField: 'linguistically_accurate_comment'
    },
    {
      id: 7,
      question: "Whether any question is verbatim copy from any of the question papers of the course of last two years?",
      field: 'verbatim_copy_check',
      commentField: 'verbatim_copy_comment'
    }
  ];

  const handleGenerateReportPdf = async () => {
    if (!moderation?.moderation_id) {
      setPdfMessage({ type: 'error', text: 'Moderation ID not found' });
      return;
    }

    setIsGeneratingPdf(true);
    setPdfMessage({ type: '', text: '' });

    try {
      const response = await moderatorAPI.generateModerationReportPdf(moderation.moderation_id);
      
      const pdfBlob = new Blob([response], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moderation-report-${moderation.course_code || 'paper'}-${moderation.semester || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setPdfMessage({ type: 'success', text: 'Moderation report PDF generated and downloaded successfully!' });
    } catch (error) {
      console.error('Moderation report PDF generation error:', error);
      setPdfMessage({ 
        type: 'error', 
        text: error.message || 'Failed to generate moderation report PDF. Please try again.' 
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="mod-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Moderation Report</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="header">
            <div className="school">SCHOOL OF ENGINEERING</div>
            <div className="university">TEZPUR UNIVERSITY</div>
            <div className="department">DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING</div>
          </div>

          <div className="separator"></div>

          <div className="report-title">MODERATION REPORT</div>

          <div className="info-grid">
            <div className="info-label">Paper Title:</div>
            <div>{moderation?.paper_title || 'N/A'}</div>
            
            <div className="info-label">Semester:</div>
            <div>{moderation?.semester || 'N/A'}</div>
            
            <div className="info-label">Course Name:</div>
            <div>{moderation?.course_title || 'N/A'}</div>
            
            <div className="info-label">Course Code:</div>
            <div>{moderation?.course_code || 'N/A'}</div>
            
            <div className="info-label">Moderation Date:</div>
            <div>{moderation ? new Date(moderation.updated_at || moderation.created_at).toLocaleDateString() : 'N/A'}</div>
            
            <div className="info-label">Moderation Status:</div>
            <div className={`status-badge status-${moderation?.status || 'pending'}`}>
              {(moderation?.status || 'N/A').toUpperCase()}
            </div>
          </div>

          <div className="criteria-section">
            <h3>Moderation Criteria</h3>
            <table className="criteria-table">
              <tbody>
                {criteria.map(criterion => (
                  <React.Fragment key={criterion.id}>
                    <tr>
                      <td className="col-number">{criterion.id}</td>
                      <td className="col-question">{criterion.question}</td>
                      <td className="col-answer">
                        <BooleanIndicator 
                          value={moderation?.[criterion.field]} 
                          criterionId={criterion.id} 
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="col-number"></td>
                      <td className="comment-cell">
                        Comments of the moderator if any:
                        <div className="comment-text">
                          <CommentDisplay comment={moderation?.[criterion.commentField]} />
                        </div>
                      </td>
                      <td className="col-answer"></td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="moderator-section">
            <div className="moderator-title">Name of Moderator(s):</div>
            <div className="moderator-list">
              1. {moderation?.moderator_name || 'Moderator Name'}<br />
              2.<br />
              3.
            </div>
          </div>

          <div className="hod-signature">
            Signature of HoD
          </div>

          <div className="pdf-generation-section">
            <button 
              className="btn-primary generate-pdf-btn" 
              onClick={handleGenerateReportPdf}
              disabled={isGeneratingPdf || !moderation?.moderation_id}
            >
              {isGeneratingPdf ? '🔄 Generating PDF...' : '📋 Generate Formal Report PDF'}
            </button>
            
            {pdfMessage.text && (
              <div className={`pdf-message ${pdfMessage.type}`}>
                {pdfMessage.text}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModReportModal;