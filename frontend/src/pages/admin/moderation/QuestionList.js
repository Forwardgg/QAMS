// src/pages/admin/Moderation/QuestionList.js
import React, { useState } from 'react';
import moderatorAPI from '../../../api/moderator.api';
import './QuestionList.css';

const QuestionList = ({ questionReport, paperData, loading }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState({ type: '', text: '' });

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

  return (
    <div className="question-list">
      <div className="print-controls">
        <button 
          className="btn-primary print-btn" 
          onClick={handleGeneratePdf}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? '🔄 Generating PDF...' : '📄 Generate Question Paper PDF'}
        </button>
        <div className="question-count">
          {sortedQuestions.length} question{sortedQuestions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {pdfMessage.text && (
        <div className={`pdf-message ${pdfMessage.type}`}>
          {pdfMessage.text}
        </div>
      )}

      <div className="print-preview-wrapper">
        <div className="print-preview-page">
          {/* Paper Header */}
          <header className="print-preview-header">
            <div className="print-preview-title">
              {paperData?.title || 'Question Paper'}
            </div>
            <div className="print-preview-meta">
              {paperData?.course_code && (
                <span>{paperData.course_code}</span>
              )}
              {paperData?.exam_type && (
                <span> | {paperData.exam_type}</span>
              )}
              {paperData?.academic_year && (
                <span> | AY: {paperData.academic_year}</span>
              )}
              {paperData?.full_marks != null && (
                <span> | Marks: {paperData.full_marks}</span>
              )}
              {paperData?.duration != null && (
                <span> | Duration: {paperData.duration} mins</span>
              )}
            </div>
          </header>

          {/* Questions */}
          <main className="print-preview-body">
            {sortedQuestions.map((question, index) => (
              <div key={question.question_id} className="print-preview-question">
                <div className="question-header">
                  <strong className="question-number">
                    Q{question.sequence_number || index + 1}.
                  </strong>
                </div>
                <div 
                  className="question-content" 
                  dangerouslySetInnerHTML={{ 
                    __html: question.content_html || question.content_preview || 'No content available' 
                  }} 
                />
                {question.co_number && (
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