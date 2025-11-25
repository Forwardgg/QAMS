import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import questionAPI from '../../../api/question.api';
import questionPaperAPI from '../../../api/questionPaper.api';
import QuestionEditModal from './QuestionEditModal';
import authService from '../../../services/authService';
import './PaperQuestionsManager.css';

const PaperQuestionsManager = ({ paperId, onBack }) => {
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load paper and questions
  useEffect(() => {
    loadPaperAndQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId]);

  const loadPaperAndQuestions = async () => {
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });

      console.log('Loading paper ID:', paperId);

      // Load paper details
      let papersResponse;
      try {
        papersResponse = await questionPaperAPI.getAll();
        console.log('Papers API response:', papersResponse);
      } catch (error) {
        console.error('Error loading papers:', error);
        setMessage({ type: 'error', text: 'Failed to load paper details' });
        setIsLoading(false);
        return;
      }

      // Find the current paper - handle different response structures
      let currentPaper;
      if (Array.isArray(papersResponse)) {
        currentPaper = papersResponse.find((p) => p.paper_id == paperId);
      } else if (papersResponse.rows) {
        currentPaper = papersResponse.rows.find((p) => p.paper_id == paperId);
      } else if (papersResponse.data) {
        currentPaper = papersResponse.data.find((p) => p.paper_id == paperId);
      }

      if (!currentPaper) {
        setMessage({ type: 'error', text: 'Paper not found' });
        setIsLoading(false);
        return;
      }

      setPaper(currentPaper);

      // Load questions for this paper
      let questionsResponse;
      try {
        questionsResponse = await questionAPI.getByPaper(paperId);
        console.log('Questions API response:', questionsResponse);
      } catch (error) {
        console.error('Error loading questions:', error);
        setMessage({ type: 'error', text: 'Failed to load questions' });
        setIsLoading(false);
        return;
      }

      // Handle different question response structures
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
        co_id: updatedQuestion.co_id,
      });

      // Update local state
      setQuestions((prev) =>
        prev.map((q) =>
          q.question_id === updatedQuestion.question_id ? updatedQuestion : q
        )
      );

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

      // Remove from local state
      setQuestions((prev) => prev.filter((q) => q.question_id !== questionId));
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
      onBack(); // Use the prop callback
    } else {
      navigate('/instructor/papers'); // Fallback
    }
  };

  /**
   * Export PDF:
   * - Uses server-side paper (paperId) so the backend builds the HTML and PDF.
   * - Uses authService token for Authorization header.
   */
  const exportPdf = async () => {
    if (!paperId) return;

    setMessage({ type: '', text: '' });
    setIsGeneratingPdf(true);

    try {
      const token = authService.getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const body = {
        paperId,
        baseUrl: process.env.REACT_APP_BASE_URL || window.location.origin,
        postOptions: {
          addPageNumbers: true,
          pageNumberOptions: { fontSize: 10, marginBottom: 18 },
        },
      };

      const resp = await fetch('/api/pdf/generate-pdf', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        let errJson = null;
        try {
          errJson = await resp.json();
        } catch (_) {
          // ignore
        }

        if (resp.status === 401) {
          setMessage({
            type: 'error',
            text: 'Unauthorized — please log in again.',
          });
          setIsGeneratingPdf(false);
          return;
        }
        if (resp.status === 403) {
          setMessage({
            type: 'error',
            text: errJson?.error || 'Access denied for PDF export.',
          });
          setIsGeneratingPdf(false);
          return;
        }
        if (resp.status === 404) {
          setMessage({
            type: 'error',
            text: errJson?.error || 'Paper not found.',
          });
          setIsGeneratingPdf(false);
          return;
        }

        setMessage({
          type: 'error',
          text: errJson?.error || `PDF generation failed (${resp.status})`,
        });
        setIsGeneratingPdf(false);
        return;
      }

      const blob = await resp.blob();

      const contentDisp = resp.headers.get('Content-Disposition') || '';
      const headerFilename = (() => {
        const match =
          /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i.exec(contentDisp);
        if (match && match[1]) {
          try {
            return decodeURIComponent(match[1]);
          } catch (e) {
            return match[1];
          }
        }
        return null;
      })();

      const safeFilename =
        headerFilename ||
        `paper-${paperId || 'export'}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');

      const url = window.URL.createObjectURL(blob);
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
      setMessage({
        type: 'error',
        text: err?.message || 'Failed to generate PDF',
      });
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
            Course: {paper.course_code} | Status: {paper.status} | Questions:{' '}
            {questions.length}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={handleAddNewQuestion} className="btn-primary">
            + Add New Question
          </button>
          <button
            onClick={exportPdf}
            className="btn-secondary"
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? 'Generating PDF…' : '📄 Export PDF'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* PREVIEW SECTION */}
      <div className="preview-section">
        <div className="section-header">
          <h2>Paper Preview (Print Layout)</h2>
          <p>This approximates how the paper will appear on A4 when exported.</p>
        </div>

        {questions.length === 0 ? (
          <div className="no-questions">
            <p>No questions added to this paper yet.</p>
            <button onClick={handleAddNewQuestion} className="btn-primary">
              Create First Question
            </button>
          </div>
        ) : (
          <div className="print-preview-wrapper">
            {/* A4-style page container */}
            <div className="print-preview-page">
              {/* Header similar to PDF header */}
              <header className="print-preview-header">
                <div className="print-preview-title">{paper.title}</div>
                <div className="print-preview-meta">
                  <span>{paper.course_code}</span>
                  {paper.exam_type && (
                    <span> | {paper.exam_type}</span>
                  )}
                  {paper.academic_year && (
                    <span> | AY: {paper.academic_year}</span>
                  )}
                  {paper.full_marks != null && (
                    <span> | Marks: {paper.full_marks}</span>
                  )}
                  {paper.duration != null && (
                    <span> | Duration: {paper.duration} mins</span>
                  )}
                </div>
              </header>

              {/* Questions laid out as they will print */}
              <main className="print-preview-body">
                {questions
                  .slice()
                  .sort((a, b) => {
                    const an =
                      a.sequence_number == null
                        ? Number.MAX_SAFE_INTEGER
                        : a.sequence_number;
                    const bn =
                      b.sequence_number == null
                        ? Number.MAX_SAFE_INTEGER
                        : b.sequence_number;
                    return an - bn;
                  })
                  .map((question, index) => (
                    <div
                      key={question.question_id}
                      className="print-preview-question"
                    >
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
                            onClick={() =>
                              handleDeleteQuestion(question.question_id)
                            }
                            className="btn-delete"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                      <div
                        className="question-content"
                        dangerouslySetInnerHTML={{
                          __html: question.content_html,
                        }}
                      />
                      {question.co_id && (
                        <div className="question-meta">
                          <small>CO: {question.co_number}</small>
                        </div>
                      )}
                    </div>
                  ))}
              </main>
            </div>
          </div>
        )}
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
