// src/pages/admin/Moderation/QuestionList.js
import React, { useState } from 'react';
import moderatorAPI from '../../../api/moderator.api';
import './QuestionList.css';

const QuestionList = ({ questionReport, paperData, loading }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState({ type: '', text: '' });
  const [showCO, setShowCO] = useState(true); // Toggle state for CO display

  if (loading) {
    return <div className="loading">Loading questions...</div>;
  }

  // Check if we have valid question data
  const hasQuestions = Array.isArray(questionReport) && questionReport.length > 0;
  
  if (!hasQuestions) {
    return (
      <div className="no-questions">
        <h3>Questions</h3>
        <p>No questions found for this paper.</p>
      </div>
    );
  }

  // Sort questions by sequence number
  const sortedQuestions = [...questionReport].sort((a, b) => 
    (a.sequence_number || 0) - (b.sequence_number || 0)
  );

  // Generate and download PDF
  const handleGeneratePdf = async () => {
    if (!paperData?.paper_id) {
      setPdfMessage({ type: 'error', text: 'Paper ID not found' });
      return;
    }

    // ADD THIS CHECK - Prevent PDF generation for non-approved papers
    if (paperData.status !== 'approved') {
      setPdfMessage({ 
        type: 'error', 
        text: `Cannot generate PDF. Paper status is "${paperData.status}". Only approved papers can be downloaded.` 
      });
      return;
    }

    setIsGeneratingPdf(true);
    setPdfMessage({ type: '', text: '' });

    try {
      const pdfBlob = await moderatorAPI.generatePdf({
        paperId: paperData.paper_id,
        baseUrl: process.env.REACT_APP_BASE_URL || window.location.origin,
        postOptions: {
          addPageNumbers: true,
          pageNumberOptions: { fontSize: 10, marginBottom: 18 },
        },
        filename: `${paperData.course_code || 'paper'}-${paperData.title || 'questions'}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_')
      });

      // Download the PDF
      moderatorAPI.downloadPdf(
        pdfBlob, 
        `${paperData.course_code || 'paper'}-${paperData.title || 'questions'}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_')
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

  // Format header data to match PDF
  const formatHeaderData = () => {
    const institution = 'TEZPUR UNIVERSITY';
    const semester = paperData?.semester || '';
    const examType = paperData?.exam_type || '';
    const academicYear = paperData?.academic_year || '';
    const course = paperData?.course_code && paperData?.course_title 
      ? `${paperData.course_code}: ${paperData.course_title}`
      : '';
    const fullMarks = paperData?.full_marks || '';
    const duration = paperData?.duration ? `${paperData.duration} mins` : '';

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

  // Check if any questions have CO data
  const hasCOData = sortedQuestions.some(question => question.co_number);

  // Check if paper is approved for PDF generation
  const isPaperApproved = paperData?.status === 'approved';

  return (
    <div className="question-list">
      <div className="print-controls">
        <div className="controls-left">
          <button 
            className="btn-primary print-btn" 
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf || !isPaperApproved}
            title={!isPaperApproved ? `Paper status: ${paperData?.status}. Only approved papers can be downloaded.` : 'Generate PDF'}
          >
            {isGeneratingPdf ? '🔄 Generating PDF...' : '📄 Generate Question Paper PDF'}
            {!isPaperApproved && ' (Approved Only)'}
          </button>
          
          {/* Status indicator */}
          {paperData?.status && (
            <div className={`paper-status status-${paperData.status}`}>
              Status: {paperData.status}
            </div>
          )}
        </div>
        
        <div className="controls-right">
          {/* CO Toggle Switch */}
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
          {/* Paper Header - Match PDF Format */}
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

          {/* Questions - Match PDF Format */}
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