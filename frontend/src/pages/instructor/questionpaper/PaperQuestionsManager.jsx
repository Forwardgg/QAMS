import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import questionAPI from '../../../api/question.api';
import questionPaperAPI from '../../../api/questionPaper.api';
import QuestionEditModal from './QuestionEditModal';
import './PaperQuestionsManager.css';

/**
 * PaperQuestionsManager
 * - Replaces window.print() with server-side PDF export
 * - Shows loading states and downloads PDF blob
 */
const PaperQuestionsManager = ({ paperId, onBack }) => {
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadPaperAndQuestions();
  }, [paperId]);

  const loadPaperAndQuestions = async () => {
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });

      // Load paper details
      let papersResponse;
      try {
        papersResponse = await questionPaperAPI.getAll();
      } catch (error) {
        console.error('Error loading papers:', error);
        setMessage({ type: 'error', text: 'Failed to load paper details' });
        setIsLoading(false);
        return;
      }

      // Find the current paper - multiple API shapes handled
      let currentPaper = null;
      if (Array.isArray(papersResponse)) {
        currentPaper = papersResponse.find(p => p.paper_id == paperId);
      } else if (papersResponse.rows) {
        currentPaper = papersResponse.rows.find(p => p.paper_id == paperId);
      } else if (papersResponse.data) {
        currentPaper = papersResponse.data.find(p => p.paper_id == paperId);
      }

      if (!currentPaper) {
        setMessage({ type: 'error', text: 'Paper not found' });
        setIsLoading(false);
        return;
      }
      setPaper(currentPaper);

      // Load questions
      let questionsResponse;
      try {
        questionsResponse = await questionAPI.getByPaper(paperId);
      } catch (error) {
        console.error('Error loading questions:', error);
        setMessage({ type: 'error', text: 'Failed to load questions' });
        setIsLoading(false);
        return;
      }

      let questionsData;
      if (Array.isArray(questionsResponse)) {
        questionsData = questionsResponse;
      } else if (questionsResponse.questions) {
        questionsData = questionsResponse.questions;
      } else if (questionsResponse.rows) {
        questionsData = questionsResponse.rows;
      } else if (questionsResponse.data) {
        questionsData = questionsResponse.data;
      } else {
        questionsData = [];
      }

      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading paper and questions:', error);
      setMessage({ type: 'error', text: 'Failed to load paper questions' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuestion = async (updatedQuestion) => {
    try {
      await questionAPI.update(updatedQuestion.question_id, {
        content_html: updatedQuestion.content_html,
        paper_id: updatedQuestion.paper_id,
        co_id: updatedQuestion.co_id
      });

      setQuestions(prev => prev.map(q =>
        q.question_id === updatedQuestion.question_id ? updatedQuestion : q
      ));

      setEditingQuestion(null);
      setMessage({ type: 'success', text: 'Question updated successfully!' });
    } catch (error) {
      console.error('Error updating question:', error);
      setMessage({ type: 'error', text: 'Failed to update question' });
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await questionAPI.delete(questionId);
      setQuestions(prev => prev.filter(q => q.question_id !== questionId));
      setMessage({ type: 'success', text: 'Question deleted successfully!' });
    } catch (error) {
      console.error('Error deleting question:', error);
      setMessage({ type: 'error', text: 'Failed to delete question' });
    }
  };

  const handleAddNewQuestion = () => {
    navigate(`/instructor/questions/create?paperId=${paperId}`);
  };

  const handleBackToPapers = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/instructor/papers');
    }
  };

  /**
   * Build a print-optimized HTML string from paper + questions.
   * Use when you want the server to render exactly what is in the editor preview.
   */
  const buildPrintHtml = (paperObj, questionsArr) => {
    const title = escapeHtml(paperObj.title || 'Question Paper');
    const course = escapeHtml(paperObj.course_title || paperObj.course_code || '');
    const metadata = paperObj || {};
    const institution = escapeHtml(process.env.REACT_APP_INSTITUTION_NAME || '');

    const questionsHtml = (questionsArr || []).map((q, idx) => {
      const seq = q.sequence_number || (idx + 1);
      // content_html is assumed safe (created by CKEditor). We keep it as-is to preserve formatting and images.
      return `<div class="question" data-qid="${q.question_id || ''}">
        <div class="qnum"><strong>Q${seq}.</strong></div>
        <div class="qcontent">${q.content_html || ''}</div>
      </div>`;
    }).join('\n');

    const css = `
      @page { size: A4; margin: 18mm; }
      html,body { font-family: "Times New Roman", serif; color:#111; }
      body { margin:0; padding:6mm 8mm; font-size:12pt; line-height:1.45; }
      .header { text-align:center; margin-bottom:8mm; }
      .title { font-size:18pt; font-weight:700; }
      .meta { font-size:10pt; color:#333; margin-bottom:6mm; }
      .question { margin-bottom:8mm; page-break-inside:avoid; }
      img { max-width:100%; height:auto; display:block; margin:6px 0; }
      .footer { position: fixed; bottom: 6mm; right: 8mm; font-size:9pt; color:#666; }
    `;

    const generatedAt = new Date().toLocaleString('en-IN');

    return `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>${css}</style>
      </head>
      <body>
        <div class="header">
          <div class="title">${title}</div>
          <div class="meta">${course} ${institution ? '— ' + institution : ''}</div>
        </div>
        <main>
          ${questionsHtml}
        </main>
        <div class="footer">Generated: ${generatedAt}</div>
      </body>
      </html>`;
  };

  // simple HTML escape for metadata strings
  const escapeHtml = (s = '') => {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  /**
   * Export PDF flow
   * - useServerPaper: if true (default) send { paperId } and server will fetch DB
   * - if false, build client-side HTML and send to server as `html` (useful if you have unsaved changes)
   */
  const exportPdf = async ({ useServerPaper = true, filename = null } = {}) => {
    setMessage({ type: '', text: '' });
    setIsGeneratingPdf(true);

    try {
      const token = localStorage.getItem('jwt'); // adjust if you store token under different key
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let body;
      if (useServerPaper) {
        body = { paperId };
      } else {
        // build HTML from the current preview state
        const html = buildPrintHtml(paper, questions);
        body = { html };
      }

      // include baseUrl so server can resolve relative image URLs like /uploads/...
      const baseUrl = process.env.REACT_APP_BASE_URL || window.location.origin;
      body.baseUrl = baseUrl;

      // optional postOptions (example: add page numbers & no watermark)
      const postOptions = {
        addPageNumbers: true,
        pageNumberOptions: { fontSize: 10, marginBottom: 18 },
        // watermark: { text: 'DRAFT', opacity: 0.06, size: 80, rotateDeg: -45 }
      };

      const resp = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...body, postOptions }),
      });

      if (!resp.ok) {
        const json = await resp.json().catch(() => null);
        const errMsg = json?.error || `PDF generation failed (${resp.status})`;
        throw new Error(errMsg);
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);

      // sanitize filename default
      const safeFilename = filename
        ? String(filename).slice(0, 200).replace(/[^a-zA-Z0-9._-]/g, '_')
        : `paper-${paperId || 'export'}.pdf`;

      const a = document.createElement('a');
      a.href = url;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'PDF generated and downloaded.' });
    } catch (err) {
      console.error('exportPdf error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to generate PDF' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="paper-questions-manager">
        <div className="loading">Loading paper questions...</div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="paper-questions-manager">
        <div className="error">Paper not found</div>
      </div>
    );
  }

  return (
    <div className="paper-questions-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="header-left">
          <button onClick={handleBackToPapers} className="btn-back">
            ← Back to Papers
          </button>
          <h1>{paper.title} - Questions</h1>
          <p className="paper-info">
            Course: {paper.course_code} | Status: {paper.status} |
            Questions: {questions.length}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={handleAddNewQuestion} className="btn-primary">
            + Add New Question
          </button>

          <div style={{ display: 'inline-flex', gap: 8 }}>
            <button
              onClick={() => exportPdf({ useServerPaper: true })}
              className="btn-secondary"
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? 'Generating PDF…' : '📄 Export PDF'}
            </button>

            {/* If you want an explicit "export current preview" (client HTML) option */}
            <button
              onClick={() => exportPdf({ useServerPaper: false })}
              className="btn-secondary"
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? 'Generating PDF…' : '📄 Export Preview (exact)'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* PDF Preview Section */}
      <div className="preview-section">
        <div className="section-header">
          <h2>Paper Preview (How it will print)</h2>
          <p>This shows exactly how the questions will appear in the final paper</p>
        </div>

        <div className="print-layout">
          {questions.length === 0 ? (
            <div className="no-questions">
              <p>No questions added to this paper yet.</p>
              <button onClick={handleAddNewQuestion} className="btn-primary">
                Create First Question
              </button>
            </div>
          ) : (
            questions.map((question, index) => (
              <div key={question.question_id} className="print-question">
                <div className="question-header">
                  <strong className="question-number">
                    Q{question.sequence_number || index + 1}.
                  </strong>
                  <div className="question-actions">
                    <button
                      onClick={() => setEditingQuestion(question)}
                      className="btn-edit"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.question_id)}
                      className="btn-delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                <div
                  className="question-content"
                  dangerouslySetInnerHTML={{ __html: question.content_html }}
                />
                {question.co_id && (
                  <div className="question-meta">
                    <small>CO: {question.co_number}</small>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingQuestion && (
        <QuestionEditModal
          question={editingQuestion}
          onSave={handleUpdateQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}
    </div>
  );
};

export default PaperQuestionsManager;
