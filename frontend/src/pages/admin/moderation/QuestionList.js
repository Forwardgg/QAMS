// src/pages/admin/Moderation/QuestionList.js
import React from 'react';
import './QuestionList.css';

const QuestionList = ({ questionReport, paperData, loading }) => {
  console.log('QuestionList props:', { questionReport, paperData, loading });

  if (loading) {
    return <div className="loading">Loading questions...</div>;
  }

  // FIX: Check if questionReport is an array directly
  const hasQuestions = Array.isArray(questionReport) && questionReport.length > 0;

  console.log('Has questions:', hasQuestions);
  console.log('Question report type:', typeof questionReport);
  console.log('Question report value:', questionReport);
  
  if (!hasQuestions) {
    return (
      <div className="no-questions">
        <h3>Questions</h3>
        <p>No questions found for this paper.</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Question Report: {questionReport ? `Type: ${typeof questionReport}, Length: ${questionReport.length}` : 'null'}
        </p>
      </div>
    );
  }

  // FIX: Use questionReport directly since it's an array
  const sortedQuestions = [...questionReport].sort((a, b) => 
    (a.sequence_number || 0) - (b.sequence_number || 0)
  );

  console.log('Sorted questions:', sortedQuestions);

  return (
    <div className="question-list">
      <div className="print-controls">
        <button className="btn-primary print-btn" onClick={() => window.print()}>
          📄 Print Question Paper
        </button>
        <div className="question-count">
          {sortedQuestions.length} question{sortedQuestions.length !== 1 ? 's' : ''}
        </div>
      </div>

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