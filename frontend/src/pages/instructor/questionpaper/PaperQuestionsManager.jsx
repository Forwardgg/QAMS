import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import questionAPI from '../../../api/question.api';
import questionPaperAPI from '../../../api/questionPaper.api';
import QuestionEditModal from './QuestionEditModal';
import authService from '../../../services/authService';
import './PaperQuestionsManager.css';

// Sortable Question Item Component
const SortableQuestionItem = ({ question, index, onEdit, onDelete, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.question_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`print-preview-question ${isDragging ? 'dragging' : ''}`}
    >
      <div className="question-header">
        <div className="question-drag-handle" {...attributes} {...listeners}>
          ⋮⋮
        </div>
        <strong className="question-number">Q{question.sequence_number || index + 1}.</strong>
        <div className="question-actions">
          <button type="button" onClick={() => onEdit(question)} className="btn-edit">✏️ Edit</button>
          <button type="button" onClick={() => onDelete(question.question_id)} className="btn-delete">🗑️ Delete</button>
        </div>
      </div>
      <div className="question-content" dangerouslySetInnerHTML={{ __html: question.content_html }} />
      {question.co_id && (
        <div className="question-meta">
          <small>CO: {question.co_number || question.co_id}</small>
        </div>
      )}
    </div>
  );
};

const PaperQuestionsManager = ({ paperId, onBack }) => {
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeId, setActiveId] = useState(null);

  // keep a ref for mounted state & abort controllers
  const mountedRef = useRef(true);
  const loadAbortRef = useRef(null);
  const pdfAbortRef = useRef(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    mountedRef.current = true;
    loadPaperAndQuestions();

    return () => {
      mountedRef.current = false;
      if (loadAbortRef.current) {
        try { loadAbortRef.current.abort(); } catch (_) {}
        loadAbortRef.current = null;
      }
      if (pdfAbortRef.current) {
        try { pdfAbortRef.current.abort(); } catch (_) {}
        pdfAbortRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId]);

  // helpers to normalize various API response shapes
  const normalizeArrayResponse = (resp) => {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp.data)) return resp.data;
    if (Array.isArray(resp.rows)) return resp.rows;
    if (Array.isArray(resp.questions)) return resp.questions;
    // try to find first array value
    const arr = Object.values(resp).find(v => Array.isArray(v));
    return arr || [];
  };

  const findPaperInResponse = (resp, pid) => {
    const arr = normalizeArrayResponse(resp);
    return arr.find(p => String(p.paper_id) === String(pid));
  };

  const loadPaperAndQuestions = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    // create an AbortController for this load, so we can cancel if unmounted
    const ac = new AbortController();
    loadAbortRef.current = ac;

    try {
      // Load papers list (some wrappers return array, some return object)
      let papersResponse;
      try {
        papersResponse = await questionPaperAPI.getAll();
      } catch (err) {
        console.error('Error loading papers:', err);
        setMessage({ type: 'error', text: 'Failed to load paper details' });
        setIsLoading(false);
        return;
      }

      const currentPaper = findPaperInResponse(papersResponse, paperId);

      if (!currentPaper) {
        setMessage({ type: 'error', text: 'Paper not found' });
        setIsLoading(false);
        return;
      }

      if (!mountedRef.current) return;
      setPaper(currentPaper);

      // Load questions for this paper
      let questionsResponse;
      try {
        questionsResponse = await questionAPI.getByPaper(paperId);
      } catch (err) {
        console.error('Error loading questions:', err);
        setMessage({ type: 'error', text: 'Failed to load questions' });
        setIsLoading(false);
        return;
      }

      if (!mountedRef.current) return;
      const questionsData = normalizeArrayResponse(questionsResponse);
      setQuestions(questionsData);
    } catch (err) {
      console.error('Error in loadPaperAndQuestions:', err);
      setMessage({ type: 'error', text: 'Failed to load paper questions' });
    } finally {
      if (mountedRef.current) setIsLoading(false);
      loadAbortRef.current = null;
    }
  };

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Handle drag end and reorder
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = questions.findIndex(q => q.question_id === active.id);
    const newIndex = questions.findIndex(q => q.question_id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update UI
    const reorderedQuestions = arrayMove(questions, oldIndex, newIndex);
    setQuestions(reorderedQuestions);

    // Update sequence numbers in backend
    await updateQuestionSequence(reorderedQuestions);
  };

  // Update sequence numbers in backend
  const updateQuestionSequence = async (reorderedQuestions) => {
    setIsReordering(true);
    try {
      const sequenceUpdates = reorderedQuestions.map((question, index) => ({
        question_id: question.question_id,
        sequence_number: index + 1
      }));

      await questionAPI.updateSequence(paperId, sequenceUpdates);

      // Update local questions with new sequence numbers
      const updatedQuestions = reorderedQuestions.map((question, index) => ({
        ...question,
        sequence_number: index + 1
      }));

      setQuestions(updatedQuestions);
      setMessage({ type: 'success', text: 'Question order updated successfully!' });
    } catch (error) {
      console.error('Error updating question sequence:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to update question order' });
      // Revert to original order on error
      loadPaperAndQuestions();
    } finally {
      setIsReordering(false);
    }
  };

  const handleUpdateQuestion = async (updatedQuestion) => {
    try {
      const qid = updatedQuestion.question_id ?? updatedQuestion.id ?? updatedQuestion.questionId;
      if (!qid) throw new Error('Missing question id');

      // payload normalization
      const payload = {
        content_html: updatedQuestion.content_html,
        paper_id: updatedQuestion.paper_id,
        co_id: updatedQuestion.co_id ?? null
      };

      await questionAPI.update(qid, payload);

      // Update local state (merge server fields if available)
      setQuestions(prev =>
        prev.map(q => (q.question_id === qid ? { ...q, ...updatedQuestion } : q))
      );

      setEditingQuestion(null);
      setMessage({ type: 'success', text: 'Question updated successfully!' });
    } catch (error) {
      console.error('Error updating question:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to update question' });
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await questionAPI.delete(questionId);

      setQuestions(prev => prev.filter(q => q.question_id !== questionId));
      setMessage({ type: 'success', text: 'Question deleted successfully!' });
      
      // Reload to get proper sequence numbers after deletion
      setTimeout(() => {
        loadPaperAndQuestions();
      }, 500);
    } catch (error) {
      console.error('Error deleting question:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to delete question' });
    }
  };

  const handleAddNewQuestion = () => {
    // navigate to create question page — encode paperId
    const encoded = encodeURIComponent(paperId);
    navigate(`/instructor/questions/create?paperId=${encoded}`);
  };

  const handleBackToPapers = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else {
      navigate('/instructor/papers');
    }
  };

  /**
   * Export PDF:
   * - Uses server-side paper (paperId) so the backend builds the HTML and PDF.
   */
  const exportPdf = async () => {
    if (!paperId) return;

    setMessage({ type: '', text: '' });
    setIsGeneratingPdf(true);

    // Abort previous pdf request if any
    if (pdfAbortRef.current) {
      try { pdfAbortRef.current.abort(); } catch (_) {}
      pdfAbortRef.current = null;
    }
    const ac = new AbortController();
    pdfAbortRef.current = ac;

    try {
      const token = typeof authService.getToken === 'function' ? authService.getToken() : null;
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
        signal: ac.signal
      });

      if (!resp.ok) {
        let errJson = null;
        try {
          errJson = await resp.json();
        } catch (_) {}

        if (resp.status === 401) {
          setMessage({ type: 'error', text: 'Unauthorized — please log in again.' });
          return;
        }
        if (resp.status === 403) {
          setMessage({ type: 'error', text: errJson?.error || 'Access denied for PDF export.' });
          return;
        }
        if (resp.status === 404) {
          setMessage({ type: 'error', text: errJson?.error || 'Paper not found.' });
          return;
        }

        setMessage({ type: 'error', text: errJson?.error || `PDF generation failed (${resp.status})` });
        return;
      }

      const blob = await resp.blob();

      // Protect against empty blob
      if (!blob || blob.size === 0) {
        setMessage({ type: 'error', text: 'PDF generation returned an empty file.' });
        return;
      }

      const contentDisp = resp.headers.get('Content-Disposition') || '';
      const headerFilename = (() => {
        const match = /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i.exec(contentDisp);
        if (match && match[1]) {
          try { return decodeURIComponent(match[1]); } catch (e) { return match[1]; }
        }
        return null;
      })();

      const safeFilename = headerFilename || `paper-${paperId || 'export'}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');

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
      if (err.name === 'AbortError') {
        console.debug('PDF request aborted');
        setMessage({ type: '', text: '' });
      } else {
        console.error('exportPdf error:', err);
        setMessage({ type: 'error', text: err?.message || 'Failed to generate PDF' });
      }
    } finally {
      setIsGeneratingPdf(false);
      pdfAbortRef.current = null;
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
          <button type="button" onClick={handleBackToPapers} className="btn-back">
            ← Back to Papers
          </button>
          <h1>{paper.title} - Questions</h1>
          <p className="paper-info">
            Course: {paper.course_code} | Status: {paper.status} | Questions: {questions.length}
            {isReordering && <span className="reordering-indicator"> • Updating order...</span>}
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            onClick={handleAddNewQuestion}
            className="btn-primary"
            disabled={isLoading}
          >
            + Add New Question
          </button>
          <button
            type="button"
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

      {/* Drag & Drop Instructions */}
      {questions.length > 0 && (
        <div className="drag-instructions">
          <p>💡 Drag and drop questions to reorder them. Changes are saved automatically.</p>
        </div>
      )}

      {/* PREVIEW SECTION */}
      <div className="preview-section">
        <div className="section-header">
          <h2>Paper Preview (Print Layout)</h2>
          <p>Drag and drop questions to reorder. This approximates how the paper will appear on A4 when exported.</p>
        </div>

        {questions.length === 0 ? (
          <div className="no-questions">
            <p>No questions added to this paper yet.</p>
            <button type="button" onClick={handleAddNewQuestion} className="btn-primary" disabled={isLoading}>
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
                  {paper.exam_type && <span> | {paper.exam_type}</span>}
                  {paper.academic_year && <span> | AY: {paper.academic_year}</span>}
                  {paper.full_marks != null && <span> | Marks: {paper.full_marks}</span>}
                  {paper.duration != null && <span> | Duration: {paper.duration} mins</span>}
                </div>
              </header>

              {/* Questions with drag and drop */}
              <main className="print-preview-body">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={questions.map(q => q.question_id)} 
                    strategy={verticalListSortingStrategy}
                  >
                    {questions.map((question, index) => (
                      <SortableQuestionItem
                        key={question.question_id}
                        question={question}
                        index={index}
                        onEdit={setEditingQuestion}
                        onDelete={handleDeleteQuestion}
                        isDragging={activeId === question.question_id}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
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