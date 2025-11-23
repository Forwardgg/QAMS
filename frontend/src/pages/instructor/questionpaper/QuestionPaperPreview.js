import React, { useState, useEffect, useRef } from 'react';
import questionAPI from '../../../api/question.api';
import questionPaperAPI from '../../../api/questionPaper.api';
import './QuestionPaperPreview.css';

// CKEditor - you'll need to install: npm install @ckeditor/ckeditor5-react @ckeditor/ckeditor5-build-classic
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const QuestionPaperPreview = ({ paper, onClose }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [error, setError] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [editor, setEditor] = useState(null);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'preview'

  useEffect(() => {
    if (paper && paper.paper_id) {
      loadQuestions();
    }
  }, [paper]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load questions for this paper
      const response = await questionAPI.getByCourseAndPaper(
        paper.course_code, 
        paper.paper_id
      );
      
      const questionsData = Array.isArray(response) ? response : (response?.data || response?.rows || []);
      setQuestions(questionsData);
      
      // Generate initial HTML template from questions
      const template = generateHTMLTemplate(questionsData);
      setHtmlContent(template);
      
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load questions for this paper');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const generateHTMLTemplate = (questions) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: 'Times New Roman', serif; 
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .paper-header { 
      text-align: center; 
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .department-line { font-size: 14px; margin-bottom: 5px; }
    .university-info h1 { 
      margin: 5px 0; 
      font-size: 24px;
      text-transform: uppercase;
    }
    .university-info h2 { 
      margin: 5px 0; 
      font-size: 18px;
      font-weight: normal;
    }
    .university-info h3 { 
      margin: 5px 0; 
      font-size: 16px;
      font-weight: bold;
    }
    .paper-details-simple { 
      margin-top: 10px;
      font-size: 14px;
    }
    .questions-section { margin-top: 30px; }
    .question-item { margin: 20px 0; }
    .question-header { margin-bottom: 8px; }
    .question-number { font-weight: bold; }
    .question-marks { 
      font-weight: bold; 
      margin-left: 10px;
      font-size: 14px;
    }
    .sub-questions { margin-left: 20px; margin-top: 10px; }
    .sub-question { margin: 5px 0; }
    .sub-question-label { font-weight: bold; margin-right: 8px; }
    .mcq-options { margin-left: 20px; margin-top: 10px; }
    .option { margin: 3px 0; }
    .option-label { font-weight: bold; margin-right: 8px; }
    .answer-space { 
      margin-top: 15px; 
      border-top: 1px dashed #ccc;
      padding-top: 10px;
    }
    .answer-line { 
      border-bottom: 1px solid #ccc; 
      margin: 8px 0;
      height: 20px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="paper-header">
    <div class="department-line">
      <strong>TU/${paper.course_code?.split(' ')[0] || 'CSE'}</strong>
    </div>
    
    <div class="university-info">
      <h1>TEZPUR UNIVERSITY</h1>
      <h2>${paper.exam_type || 'End Term Examination'}, ${paper.academic_year || '2024'}</h2>
      <h3>${paper.course_code}: ${paper.course_title}</h3>
    </div>

    <div class="paper-details-simple">
      <div class="detail-item">
        <strong>Full marks: ${paper.full_marks || '60'}</strong> 
        <strong>Time: ${paper.duration ? `${paper.duration} mins` : '100 mins'}</strong>
      </div>
    </div>
  </div>

  <div class="questions-section">
    ${questions.length > 0 ? questions.map((question, index) => `
      <div class="question-item">
        <div class="question-header">
          <span class="question-number">${index + 1}.</span>
          ${question.marks ? `<span class="question-marks">[${question.marks}]</span>` : ''}
        </div>
        
        <div class="question-content">
          ${question.content || ''}
        </div>
        
        ${question.question_type === 'mcq' && question.options ? `
          <div class="mcq-options">
            ${question.options.map((option, optIndex) => `
              <div class="option">
                <span class="option-label">(${String.fromCharCode(97 + optIndex)})</span>
                <span class="option-text">${option.option_text}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${(question.question_type === 'subjective' || !question.question_type) ? `
          <div class="answer-space">
            <div class="answer-lines">
              ${Array.from({ length: 6 }, (_, i) => `<div class="answer-line"></div>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `).join('') : `
      <div class="question-item">
        <div class="question-header">
          <span class="question-number">1.</span>
        </div>
        <div class="question-content">
          No questions added yet. Start adding questions to see them here.
        </div>
      </div>
    `}
  </div>
</body>
</html>`;
  };

  const handleEditorChange = (event, editor) => {
    const data = editor.getData();
    setHtmlContent(data);
  };

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true);
      setError('');
      
      // Here you'll integrate with your PDF generation API
      // For now, we'll open print dialog
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        setGeneratingPDF(false);
      }, 500);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
      setGeneratingPDF(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Here you can save the HTML content to your backend
      // For now, we'll just show a success message
      console.log('Saving HTML content:', htmlContent);
      
      setTimeout(() => {
        setSaving(false);
        alert('Draft saved successfully!');
      }, 1000);
      
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft');
      setSaving(false);
    }
  };

  const handleSubmitForModeration = async () => {
    if (window.confirm('Are you sure you want to submit this paper for moderation? You cannot make further changes after submission.')) {
      try {
        setSaving(true);
        setError('');
        
        // Generate PDF first
        await handleGeneratePDF();
        
        // Then submit for moderation
        // await questionPaperAPI.submitForModeration(paper.paper_id, { htmlContent });
        
        alert('Paper submitted for moderation successfully!');
        onClose(); // Close the modal
        
      } catch (err) {
        console.error('Error submitting for moderation:', err);
        setError('Failed to submit for moderation');
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay preview-overlay">
        <div className="preview-modal">
          <div className="loading">Loading paper for editing...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay preview-overlay">
      <div className="preview-modal editor-modal">
        {/* Editor Controls */}
        <div className="editor-controls no-print">
          <div className="control-group">
            <button 
              className={`tab-button ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              📝 Editor
            </button>
            <button 
              className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              👁️ Preview
            </button>
          </div>
          
          <div className="control-group">
            <button 
              className="btn-secondary" 
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? 'Saving...' : '💾 Save Draft'}
            </button>
            <button 
              className="btn-secondary" 
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
            >
              {generatingPDF ? 'Generating...' : '📄 Generate PDF'}
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSubmitForModeration}
              disabled={saving}
            >
              {saving ? 'Submitting...' : '✅ Submit for Moderation'}
            </button>
            <button className="btn-close" onClick={onClose}>
              ❌ Close
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message no-print">
            {error}
          </div>
        )}

        {/* Editor Content */}
        <div className="editor-content">
          {activeTab === 'editor' ? (
            <div className="ckeditor-container">
              <CKEditor
                editor={ClassicEditor}
                data={htmlContent}
                onChange={handleEditorChange}
                onReady={editor => {
                  setEditor(editor);
                }}
                config={{
                  toolbar: {
                    items: [
                      'heading', '|', 'bold', 'italic', 'underline', '|',
                      'bulletedList', 'numberedList', '|', 'blockQuote', '|',
                      'insertTable', '|', 'undo', 'redo', '|', 'pageBreak'
                    ]
                  },
                  height: '600px'
                }}
              />
            </div>
          ) : (
            <div className="preview-container">
              <div 
                className="html-preview" 
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="info-panel no-print">
          <h4>Editing Tips:</h4>
          <ul>
            <li>Use the toolbar to format text, add tables, and insert page breaks</li>
            <li>Switch to Preview tab to see how the paper will look</li>
            <li>Generate PDF to download a printable version</li>
            <li>Submit for moderation when you're satisfied with the layout</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuestionPaperPreview;