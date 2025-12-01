import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import moderatorAPI from '../../../api/moderator.api';
import './ModReport.css';

const ModReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [moderation, setModeration] = useState(null);
  const [paperData, setPaperData] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchParams = new URLSearchParams(location.search);
  const moderationId = searchParams.get('moderationId');
  const paperId = searchParams.get('paperId');

  useEffect(() => {
    if (moderationId) {
      loadModerationData();
    }
  }, [moderationId, paperId]);

  const loadModerationData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (moderationId) {
        const response = await moderatorAPI.getModerationDetails(moderationId);
        setModeration(response.data);
        
        if (paperId) {
          try {
            const paperResponse = await moderatorAPI.getPaperReport(paperId);
            setPaperData(paperResponse.data);
          } catch (paperError) {
            console.warn('Could not fetch paper data:', paperError);
          }
        }
      }
    } catch (error) {
      console.error('Error loading moderation data:', error);
      setError('Failed to load moderation data. Please check if the moderation record exists.');
    } finally {
      setLoading(false);
    }
  };

  const BooleanIndicator = ({ value, criterionId }) => {
    if (value === null || value === undefined) {
      return <span className="not-evaluated">Not Evaluated</span>;
    }
    
    if (criterionId === 7) {
      return value ? (
        <span className="criterion-fail">✗ Yes</span>
      ) : (
        <span className="criterion-pass">✓ No</span>
      );
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
      const pdfBlob = await moderatorAPI.generateModerationReportPdf(moderation.moderation_id);

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

  if (loading) {
    return (
      <div className="mod-report">
        <div className="page-header">
          <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-outline">
            ← Back to List
          </button>
          <h1>Moderation Report</h1>
        </div>
        <div className="loading">Loading moderation report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mod-report">
        <div className="page-header">
          <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-outline">
            ← Back to List
          </button>
          <h1>Moderation Report</h1>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadModerationData} className="btn btn-primary">Try Again</button>
          <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-outline">
            Browse Moderation List
          </button>
        </div>
      </div>
    );
  }

  if (!moderationId) {
    return (
      <div className="mod-report">
        <div className="page-header">
          <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-outline">
            ← Back to List
          </button>
          <h1>Moderation Report</h1>
        </div>
        <div className="no-data">
          <p>No moderation record selected</p>
          <div className="action-buttons">
            <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-primary">
              Browse Moderation List
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!moderation) {
    return (
      <div className="mod-report">
        <div className="page-header">
          <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-outline">
            ← Back to List
          </button>
          <h1>Moderation Report</h1>
        </div>
        <div className="no-data">
          <p>Moderation record not found or may have been deleted.</p>
          <div className="action-buttons">
            <button onClick={loadModerationData} className="btn btn-primary">Reload</button>
            <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-outline">
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mod-report">
      <div className="page-header">
        <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-outline">
          ← Back to List
        </button>
        
<div className="header-right">
  <button 
    onClick={() => navigate(`/admin/moderation/list`)}
    className="btn btn-secondary"
  >
    View All
  </button>
  <button 
    onClick={() => navigate(`/admin/moderation/questions?moderationId=${moderationId}&paperId=${paperId}`)}
    className="btn btn-primary"
  >
    Question Analysis
  </button>
</div>
      </div>

      <div className="report-actions">
        <button 
          className="btn btn-primary generate-pdf-btn" 
          onClick={handleGenerateReportPdf}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? 'Generating PDF...' : 'Generate Report PDF'}
        </button>
        
        {pdfMessage.text && (
          <div className={`pdf-message ${pdfMessage.type}`}>
            {pdfMessage.text}
          </div>
        )}
      </div>

      <div className="report-info-card">
        <h2>Moderation Report</h2>
        <div className="info-grid-small">
          <div className="info-item">
            <label>Moderation ID:</label>
            <span>#{moderation.moderation_id}</span>
          </div>
          <div className="info-item">
            <label>Paper Title:</label>
            <span>{moderation.paper_title}</span>
          </div>
          <div className="info-item">
            <label>Course:</label>
            <span>{moderation.course_code} - {moderation.course_title}</span>
          </div>
          <div className="info-item">
            <label>Status:</label>
            <span className={`status-badge status-${moderation.status}`}>
              {moderation.status}
            </span>
          </div>
        </div>
      </div>

      <div className="formal-report-section">
        <div className="header">
          <div className="school">SCHOOL OF ENGINEERING</div>
          <div className="university">TEZPUR UNIVERSITY</div>
          <div className="department">DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING</div>
        </div>

        <div className="separator"></div>

        <div className="report-title">MODERATION REPORT</div>

        <div className="info-grid">
          <div className="info-label">Semester:</div>
          <div>{paperData?.semester || moderation?.semester || 'N/A'}</div>
          
          <div className="info-label">Course Name:</div>
          <div>{paperData?.course_title || moderation?.course_title || 'N/A'}</div>
          
          <div className="info-label">Course Code:</div>
          <div>{paperData?.course_code || moderation?.course_code || 'N/A'}</div>
          
          <div className="info-label">Date:</div>
          <div>{new Date().toLocaleDateString()}</div>
          
          <div className="info-label">Time:</div>
          <div>{new Date().toLocaleTimeString()}</div>
        </div>

        <table className="criteria-table">
          <tbody>
            {criteria.map(criterion => (
              <React.Fragment key={criterion.id}>
                <tr>
                  <td className="col-number">{criterion.id}</td>
                  <td className="col-question">{criterion.question}</td>
                  <td className="col-answer">
                    <BooleanIndicator 
                      value={moderation[criterion.field]} 
                      criterionId={criterion.id} 
                    />
                  </td>
                </tr>
                <tr>
                  <td className="col-number"></td>
                  <td className="comment-cell">
                    Comments of the moderator if any:
                    <div className="comment-text">
                      <CommentDisplay comment={moderation[criterion.commentField]} />
                    </div>
                  </td>
                  <td className="col-answer"></td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div className="moderator-section">
          <div className="moderator-title">Name of Moderator(s):</div>
          <div className="moderator-list">
            1. {moderation.moderator_name || 'Moderator Name'}<br />
            2.<br />
            3.
          </div>
        </div>

        <div className="hod-signature">
          Signature of HoD
        </div>
      </div>

      <div className="report-actions report-actions-bottom">
        <button 
          className="btn btn-primary generate-pdf-btn" 
          onClick={handleGenerateReportPdf}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? 'Generating PDF...' : 'Download Report PDF'}
        </button>
        <button 
          onClick={() => navigate(`/admin/moderation/list`)}
          className="btn btn-outline"
        >
          Back to Moderation List
        </button>
      </div>
    </div>
  );
};

export default ModReport;