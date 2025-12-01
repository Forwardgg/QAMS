import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import moderatorAPI from '../../../api/moderator.api';
import './QuestionList.css';

const QuestionList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [questionReport, setQuestionReport] = useState([]);
  const [paperData, setPaperData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState({ type: '', text: '' });
  const [showCO, setShowCO] = useState(true);

  const searchParams = new URLSearchParams(location.search);
  const moderationId = searchParams.get('moderationId');
  const paperId = searchParams.get('paperId');

  useEffect(() => {
    loadData();
  }, [moderationId, paperId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (paperId) {
        const [questionRes, paperRes] = await Promise.all([
          moderatorAPI.getQuestionReport(paperId),
          moderatorAPI.getPaperReport(paperId)
        ]);
        
        setQuestionReport(questionRes.data || []);
        setPaperData(paperRes.data || {});
      } else if (moderationId) {
        const moderationRes = await moderatorAPI.getModerationDetails(moderationId);
        const moderation = moderationRes.data;
        
        if (moderation?.paper_id) {
          const [questionRes, paperRes] = await Promise.all([
            moderatorAPI.getQuestionReport(moderation.paper_id),
            moderatorAPI.getPaperReport(moderation.paper_id)
          ]);
          
          setQuestionReport(questionRes.data || []);
          setPaperData({ ...paperRes.data, ...moderation });
        } else {
          throw new Error('Paper ID not found in moderation record');
        }
      } else {
        throw new Error('No moderation or paper ID provided');
      }
    } catch (error) {
      console.error('Error loading question data:', error);
      setError(error.message || 'Failed to load question data');
    } finally {
      setLoading(false);
    }
  };

  const hasQuestions = Array.isArray(questionReport) && questionReport.length > 0;
  
  const sortedQuestions = [...questionReport].sort((a, b) => 
    (a.sequence_number || 0) - (b.sequence_number || 0)
  );

  const handleGeneratePdf = async () => {
    if (!paperData?.paper?.paper_id) {
      setPdfMessage({ type: 'error', text: 'Paper ID not found' });
      return;
    }

    // FIXED: Check paper status from nested structure
    if (paperData.paper.status !== 'approved') {
      setPdfMessage({ 
        type: 'error', 
        text: `Cannot generate PDF. Paper status is "${paperData.paper.status}". Only approved papers can be downloaded.` 
      });
      return;
    }

    setIsGeneratingPdf(true);
    setPdfMessage({ type: '', text: '' });

    try {
      const pdfBlob = await moderatorAPI.generatePdf({
        paperId: paperData.paper.paper_id,
        baseUrl: process.env.REACT_APP_BASE_URL || window.location.origin,
        postOptions: {
          addPageNumbers: true,
          pageNumberOptions: { fontSize: 10, marginBottom: 18 },
        },
        filename: `${paperData.paper.course_code || 'paper'}-${paperData.paper.title || 'questions'}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_')
      });

      moderatorAPI.downloadPdf(
        pdfBlob, 
        `${paperData.paper.course_code || 'paper'}-${paperData.paper.title || 'questions'}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_')
      );

      setPdfMessage({ type: 'success', text: 'PDF generated and downloaded successfully!' });
    } catch (error) {
      console.error('PDF generation error:', error);
      setPdfMessage({ 
        type: 'error', 
        text: error.message || 'Failed to generate PDF. Please try again.' 
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatHeaderData = () => {
    const paper = paperData?.paper || {};
    const institution = 'TEZPUR UNIVERSITY';
    const semester = paper.semester || '';
    const examType = paper.exam_type || '';
    const academicYear = paper.academic_year || '';
    const course = paper.course_code && paper.course_title 
      ? `${paper.course_code}: ${paper.course_title}`
      : '';
    const fullMarks = paper.full_marks || '';
    const duration = paper.duration ? `${paper.duration} mins` : '';

    return {
      institution,
      semester,
      examType,
      academicYear,
      course,
      fullMarks,
      duration
    };
  };

  const headerData = formatHeaderData();
  const hasCOData = sortedQuestions.some(question => question.co_number);
  const isPaperApproved = paperData?.paper?.status === 'approved';

  if (loading) {
    return (
      <div className="question-list">
        <div className="page-header">
          <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-outline">
            ← Back to List
          </button>
          <h1>Question Analysis</h1>
        </div>
        <div className="loading">Loading question data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="question-list">
        <div className="page-header">
          <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-outline">
            ← Back to List
          </button>
          <h1>Question Analysis</h1>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <div className="action-buttons">
            <button onClick={loadData} className="btn btn-primary">Try Again</button>
            <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-outline">
              Browse Moderation List
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasQuestions) {
    return (
      <div className="question-list">
        <div className="page-header">
          <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-outline">
            ← Back to List
          </button>
          <div className="header-right">
            <button 
              onClick={() => navigate(`/admin/moderation/report?moderationId=${moderationId}`)}
              className="btn btn-primary"
            >
              View Report
            </button>
          </div>
        </div>
        <div className="no-data">
          <h2>No Questions Found</h2>
          <p>No questions found for this paper.</p>
          <div className="action-buttons">
            <button onClick={loadData} className="btn btn-primary">Reload</button>
            <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-outline">
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="question-list">
      <div className="page-header">
        <button onClick={() => navigate('/admin/moderation/list')} className="btn btn-outline">
          ← Back to List
        </button>
        <div className="header-right">
          {moderationId && (
            <button 
              onClick={() => navigate(`/admin/moderation/report?moderationId=${moderationId}`)}
              className="btn btn-primary"
            >
              View Report
            </button>
          )}
          <button 
            onClick={() => navigate('/admin/moderation/list')}
            className="btn btn-secondary"
          >
            View All
          </button>
        </div>
      </div>

      {paperData?.paper && (
        <div className="paper-info-card">
          <h2>Question Paper Analysis</h2>
          <div className="info-grid">
            {paperData.paper.paper_title && (
              <div className="info-item">
                <label>Paper Title:</label>
                <span>{paperData.paper.paper_title}</span>
              </div>
            )}
            {paperData.paper.course_code && (
              <div className="info-item">
                <label>Course:</label>
                <span>{paperData.paper.course_code} - {paperData.paper.course_title || 'N/A'}</span>
              </div>
            )}
            {paperData.paper.semester && (
              <div className="info-item">
                <label>Semester:</label>
                <span>{paperData.paper.semester}</span>
              </div>
            )}
            {paperData.paper.exam_type && (
              <div className="info-item">
                <label>Exam Type:</label>
                <span>{paperData.paper.exam_type}</span>
              </div>
            )}
            {paperData.paper.status && (
              <div className="info-item">
                <label>Status:</label>
                <span className={`status-badge status-${paperData.paper.status}`}>
                  {paperData.paper.status}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="print-controls">
        <div className="controls-left">
          <button 
            className="btn btn-primary print-btn" 
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf || !isPaperApproved}
            title={!isPaperApproved ? `Paper status: ${paperData?.paper?.status}. Only approved papers can be downloaded.` : 'Generate PDF'}
          >
            {isGeneratingPdf ? 'Generating PDF...' : 'Generate Question Paper PDF'}
            {!isPaperApproved && ' (Approved Only)'}
          </button>
          
          {paperData?.paper?.status && (
            <div className={`paper-status status-${paperData.paper.status}`}>
              Status: {paperData.paper.status}
            </div>
          )}
        </div>
        
        <div className="controls-right">
          {hasCOData && (
            <div className="co-toggle">
              <label className="toggle-label">
                Show Course Outcomes
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={showCO}
                    onChange={(e) => setShowCO(e.target.checked)}
                    className="toggle-checkbox"
                    id="co-toggle"
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>
          )}
          
          <div className="question-count">
            {sortedQuestions.length} question{sortedQuestions.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {pdfMessage.text && (
        <div className={`pdf-message ${pdfMessage.type}`}>
          {pdfMessage.text}
        </div>
      )}

      <div className="print-preview-wrapper">
        <div className="print-preview-page">
          <header className="print-preview-header">
            <div className="header-line1">{headerData.institution}</div>
            <div className="header-line2">
              {headerData.semester} {headerData.examType}, {headerData.academicYear}
            </div>
            <div className="header-line3">{headerData.course}</div>
            
            <div className="marks-time-line">
              <div className="full-marks">Full mark : {headerData.fullMarks}</div>
              <div className="time">Time: {headerData.duration}</div>
            </div>
          </header>

          <main className="print-preview-body">
            {sortedQuestions.map((question, index) => (
              <div key={question.question_id} className="print-preview-question">
                <div className="question-number-content">
                  <strong className="question-number">
                    {question.sequence_number || index + 1}.
                  </strong>
                  <div 
                    className="question-content" 
                    dangerouslySetInnerHTML={{ 
                      __html: question.content_html || question.content_preview || 'No content available' 
                  }} 
                  />
                </div>
                {showCO && question.co_number && (
                  <div className="question-co">
                    Course Outcome: CO{question.co_number}
                  </div>
                )}
              </div>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
};

export default QuestionList;