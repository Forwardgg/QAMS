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
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Import MUI Icons
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  DragIndicator as DragIndicatorIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  KeyboardDoubleArrowLeft as KeyboardDoubleArrowLeftIcon,
  KeyboardDoubleArrowRight as KeyboardDoubleArrowRightIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  ArrowBackIos as ArrowBackIosIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  FileCopy as FileCopyIcon,
  Report as ReportIcon
} from '@mui/icons-material';

import questionAPI from '../../../api/question.api';
import questionPaperAPI from '../../../api/questionPaper.api';
import moderatorAPI from '../../../api/moderator.api';
import QuestionEditModal from './QuestionEditModal';
import ModerationReportModal from './ModerationReportModal';
import authService from '../../../services/authService';
import './PaperQuestionsManager.css';

/* ---------------------------
   Sortable Question Item
   --------------------------- */
const SortableQuestionItem = ({ question, index, onEdit, onDelete, isDragging, actionsAllowed }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.question_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const needsChanges = String(question.status || '').toLowerCase() === 'change_requested';

  const handleEditClick = () => {
    if (!actionsAllowed) return;
    onEdit?.(question);
  };

  const handleDeleteClick = () => {
    if (!actionsAllowed) return;
    onDelete?.(question.question_id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`print-preview-question ${needsChanges ? 'question-needs-changes' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="question-header">
        <div
          className={`question-drag-handle ${!actionsAllowed ? 'drag-disabled' : ''}`}
          {...(actionsAllowed ? { ...attributes, ...listeners } : {})}
          title={actionsAllowed ? 'Drag to reorder' : 'Reordering disabled for this paper status'}
          aria-hidden={!actionsAllowed}
        >
          <DragIndicatorIcon sx={{ fontSize: 20, color: actionsAllowed ? '#6c757d' : '#adb5bd' }} />
        </div>

        <strong className="question-number">Q{question.sequence_number ?? (index + 1)}.</strong>

        <div className="question-actions">
          {/* NEW: Display marks if available */}
          {question.marks !== null && question.marks !== undefined && (
  <span className="question-marks-indicator" title={`Marks: ${question.marks}`}>
    [{question.marks} marks]
  </span>
)}

          {needsChanges && (
            <span className="change-indicator" title="Changes requested by moderator">
              <WarningIcon sx={{ fontSize: 18, color: '#ffc107' }} />
            </span>
          )}

          <button
            type="button"
            onClick={handleEditClick}
            className={`btn-edit ${!actionsAllowed ? 'btn-disabled' : ''}`}
            title={actionsAllowed ? 'Edit question' : 'Editing disabled for this paper status'}
            aria-disabled={!actionsAllowed}
            disabled={!actionsAllowed}
          >
            <EditIcon sx={{ fontSize: 16, marginRight: 1 }} />
            Edit
          </button>

          <button
            type="button"
            onClick={handleDeleteClick}
            className={`btn-delete ${!actionsAllowed ? 'btn-disabled' : ''}`}
            title={actionsAllowed ? 'Delete question' : 'Deleting disabled for this paper status'}
            aria-disabled={!actionsAllowed}
            disabled={!actionsAllowed}
          >
            <DeleteIcon sx={{ fontSize: 16, marginRight: 1 }} />
            Delete
          </button>
        </div>
      </div>

      <div className="question-content" dangerouslySetInnerHTML={{ __html: question.content_html }} />

      {question.co_id && (
        <div className="question-meta">
          <small>CO: {question.co_number ?? question.co_id}</small>
        </div>
      )}
    </div>
  );
};

/* ---------------------------
   Non-sortable Question Item
   --------------------------- */
const NonSortableQuestionItem = ({ question, index, onEdit, onDelete, actionsAllowed }) => {
  const needsChanges = String(question.status || '').toLowerCase() === 'change_requested';

  const handleEditClick = () => {
    if (!actionsAllowed) return;
    onEdit?.(question);
  };

  const handleDeleteClick = () => {
    if (!actionsAllowed) return;
    onDelete?.(question.question_id);
  };

  return (
    <div className={`print-preview-question ${needsChanges ? 'question-needs-changes' : ''}`}>
      <div className="question-header">
        <div className="question-drag-handle drag-disabled" title="Reordering disabled for this paper status" aria-hidden="true">
          <DragIndicatorIcon sx={{ fontSize: 20, color: '#adb5bd' }} />
        </div>

        <strong className="question-number">Q{question.sequence_number ?? (index + 1)}.</strong>

        <div className="question-actions">
          {/* NEW: Display marks if available */}
          {question.marks !== null && question.marks !== undefined && (
  <span className="question-marks-indicator" title={`Marks: ${question.marks}`}>
    [{question.marks} marks]
  </span>
)}

          {needsChanges && (
            <span className="change-indicator" title="Changes requested by moderator">
              <WarningIcon sx={{ fontSize: 18, color: '#ffc107' }} />
            </span>
          )}

          <button
            type="button"
            onClick={handleEditClick}
            className={`btn-edit ${!actionsAllowed ? 'btn-disabled' : ''}`}
            title={actionsAllowed ? 'Edit question' : 'Editing disabled for this paper status'}
            aria-disabled={!actionsAllowed}
            disabled={!actionsAllowed}
          >
            <EditIcon sx={{ fontSize: 16, marginRight: 1 }} />
            Edit
          </button>

          <button
            type="button"
            onClick={handleDeleteClick}
            className={`btn-delete ${!actionsAllowed ? 'btn-disabled' : ''}`}
            title={actionsAllowed ? 'Delete question' : 'Deleting disabled for this paper status'}
            aria-disabled={!actionsAllowed}
            disabled={!actionsAllowed}
          >
            <DeleteIcon sx={{ fontSize: 16, marginRight: 1 }} />
            Delete
          </button>
        </div>
      </div>

      <div className="question-content" dangerouslySetInnerHTML={{ __html: question.content_html }} />

      {question.co_id && (
        <div className="question-meta">
          <small>CO: {question.co_number ?? question.co_id}</small>
        </div>
      )}
    </div>
  );
};

/* ---------------------------
   Main Component
   --------------------------- */
const PaperQuestionsManager = ({ paperId, onBack }) => {
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showModerationReport, setShowModerationReport] = useState(false);
  const [moderationData, setModerationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeId, setActiveId] = useState(null);

  const mountedRef = useRef(true);
  const loadAbortRef = useRef(null);
  const pdfAbortRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    mountedRef.current = true;
    loadPaperAndQuestions();
    loadModerationData();

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

  const loadModerationData = async () => {
    try {
      const paperReport = await moderatorAPI.getPaperReport(paperId);
      if (paperReport?.data?.moderation?.moderation_id) {
        const response = await moderatorAPI.getModerationDetails(paperReport.data.moderation.moderation_id);
        setModerationData(response.data);
      } else {
        setModerationData(null);
      }
    } catch (err) {
      console.error('Error loading moderation data:', err);
      setModerationData(null);
    }
  };

  const normalizeArrayResponse = (resp) => {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp.data)) return resp.data;
    if (Array.isArray(resp.rows)) return resp.rows;
    if (Array.isArray(resp.questions)) return resp.questions;
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

    const ac = new AbortController();
    loadAbortRef.current = ac;

    try {
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
        setPaper(null);
        setMessage({ type: 'error', text: 'Paper not found' });
        setIsLoading(false);
        return;
      }

      if (!mountedRef.current) return;
      setPaper(currentPaper);

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

  // FIXED: Changed from 'submitted' to 'draft' to match backend validation
  const actionsAllowed = React.useMemo(() => {
    if (!paper || !paper.status) return false;
    const s = String(paper.status).toLowerCase();
    return s === 'draft' || s === 'change_requested';
  }, [paper]);

  const needsResubmission = React.useMemo(() => {
    return questions.some(q => String(q.status || '').toLowerCase() === 'change_requested');
  }, [questions]);

  const rejectedQuestionsCount = React.useMemo(() => {
    return questions.filter(q => String(q.status || '').toLowerCase() === 'change_requested').length;
  }, [questions]);

  const handleResubmitForModeration = async () => {
    if (!needsResubmission) {
      setMessage({ type: 'error', text: 'No changes requested. Paper does not need resubmission.' });
      return;
    }

    if (!window.confirm(`Resubmit "${paper?.title}" for moderation? This will send the paper back to moderators for review.`)) {
      return;
    }

    setIsResubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await questionPaperAPI.submitForModeration(paperId);
      await loadPaperAndQuestions();
      setMessage({ type: 'success', text: 'Paper resubmitted for moderation successfully!' });
    } catch (err) {
      console.error('Resubmit error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to resubmit paper';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    if (!actionsAllowed) return;
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex(q => String(q.question_id) === String(active.id));
    const newIndex = questions.findIndex(q => String(q.question_id) === String(over.id));

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedQuestions = arrayMove(questions, oldIndex, newIndex);
    setQuestions(reorderedQuestions);

    await updateQuestionSequence(reorderedQuestions);
  };

  const updateQuestionSequence = async (reorderedQuestions) => {
    setIsReordering(true);
    try {
      const sequenceUpdates = reorderedQuestions.map((question, idx) => ({
        question_id: question.question_id,
        sequence_number: idx + 1,
      }));

      await questionAPI.updateSequence(paperId, sequenceUpdates);

      const updatedQuestions = reorderedQuestions.map((q, idx) => ({
        ...q,
        sequence_number: idx + 1,
      }));

      setQuestions(updatedQuestions);
      setMessage({ type: 'success', text: 'Question order updated successfully!' });
    } catch (err) {
      console.error('Error updating sequence:', err);
      setMessage({ type: 'error', text: err?.message || 'Failed to update question order' });
      loadPaperAndQuestions();
    } finally {
      setIsReordering(false);
    }
  };

  const handleUpdateQuestion = async (updatedQuestion) => {
    if (!actionsAllowed) {
      setMessage({ type: 'error', text: 'Editing questions is disabled for the current paper status.' });
      return;
    }

    try {
      const qid = updatedQuestion.question_id ?? updatedQuestion.id ?? updatedQuestion.questionId;
      if (!qid) throw new Error('Missing question id');

      const payload = {
        content_html: updatedQuestion.content_html,
        paper_id: updatedQuestion.paper_id,
        co_id: updatedQuestion.co_id ?? null,
        marks: updatedQuestion.marks ?? null, // NEW: Add marks to payload
      };

      // 1. Update the question
      const apiResponse = await questionAPI.update(qid, payload);
      
      // 2. Get the saved question from response (it might have more data)
      const savedQuestion = apiResponse?.question || apiResponse;
      
      // 3. FETCH FRESH DATA to get complete CO info
      const freshQuestion = await questionAPI.getById(qid);
      
      // 4. Update state with complete question data
      setQuestions(prev => prev.map(q => 
        String(q.question_id) === String(qid) 
          ? { ...q, ...savedQuestion, ...freshQuestion.question }
          : q
      ));
      
      setEditingQuestion(null);
      setMessage({ type: 'success', text: 'Question updated successfully!' });
      
      // 5. Optional: Force refresh after a short delay
      setTimeout(() => {
        loadPaperAndQuestions();
      }, 500);
      
    } catch (err) {
      console.error('Error updating question:', err);
      setMessage({ type: 'error', text: err?.message || 'Failed to update question' });
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!actionsAllowed) {
      setMessage({ type: 'error', text: 'Deleting questions is disabled for the current paper status.' });
      return;
    }

    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await questionAPI.delete(questionId);
      setQuestions(prev => prev.filter(q => String(q.question_id) !== String(questionId)));
      setMessage({ type: 'success', text: 'Question deleted successfully!' });

      setTimeout(() => loadPaperAndQuestions(), 500);
    } catch (err) {
      console.error('Error deleting question:', err);
      setMessage({ type: 'error', text: err?.message || 'Failed to delete question' });
    }
  };

  const handleAddNewQuestion = () => {
    if (!actionsAllowed) {
      setMessage({ type: 'error', text: 'Adding questions is disabled for the current paper status.' });
      return;
    }
    const encoded = encodeURIComponent(paperId);
    navigate(`/instructor/questions/create?paperId=${encoded}`);
  };

  const handleBackToPapers = () => {
    if (typeof onBack === 'function') return onBack();
    navigate('/instructor/papers');
  };

  const exportPdf = async () => {
    if (!paperId) return;

    setMessage({ type: '', text: '' });
    setIsGeneratingPdf(true);

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
        signal: ac.signal,
      });

      if (!resp.ok) {
        let errJson = null;
        try { errJson = await resp.json(); } catch (_) {}
        const status = resp.status;
        if (status === 401) {
          setMessage({ type: 'error', text: 'Unauthorized — please log in again.' });
          return;
        }
        if (status === 403) {
          setMessage({ type: 'error', text: errJson?.error || 'Access denied for PDF export.' });
          return;
        }
        if (status === 404) {
          setMessage({ type: 'error', text: errJson?.error || 'Paper not found.' });
          return;
        }
        setMessage({ type: 'error', text: errJson?.error || `PDF generation failed (${status})` });
        return;
      }

      const blob = await resp.blob();
      if (!blob || blob.size === 0) {
        setMessage({ type: 'error', text: 'PDF generation returned an empty file.' });
        return;
      }

      const contentDisp = resp.headers.get('Content-Disposition') || '';
      const headerFilename = (() => {
        const match = /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i.exec(contentDisp);
        if (match && match[1]) {
          try { return decodeURIComponent(match[1]); } catch (_) { return match[1]; }
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
      if (err?.name === 'AbortError') {
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
            <ArrowBackIcon sx={{ fontSize: 18, marginRight: 1 }} />
            Back to Papers
          </button>
          <h1>{paper.title} - Questions</h1>
          <p className="paper-info">
            Course: {paper.course_code} | Status: {paper.status} | Questions: {questions.length}
            {isReordering && <span className="reordering-indicator"> • Updating order...</span>}
          </p>
          {!actionsAllowed && paper?.status && (
            <p className="readonly-note" aria-live="polite">
              {paper.status === 'submitted' && 'Paper is submitted for moderation. Editing is disabled until moderator review is complete.'}
              {paper.status === 'under_review' && 'Paper is under review by moderators. Editing is disabled during review.'}
              {paper.status === 'approved' && 'Paper is approved. Editing is disabled for approved papers.'}
            </p>
          )}
        </div>

        <div className="header-actions">
          <button type="button" onClick={handleAddNewQuestion} className="btn-primary" disabled={isLoading || !actionsAllowed}>
            <AddIcon sx={{ fontSize: 18, marginRight: 1 }} />
            Add New Question
          </button>
          <button type="button" onClick={exportPdf} className="btn-secondary" disabled={isGeneratingPdf}>
            <DownloadIcon sx={{ fontSize: 18, marginRight: 1 }} />
            {isGeneratingPdf ? 'Generating PDF…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      {/* Moderation report button */}
      {moderationData && (
        <div className="moderation-report-section">
          <button className="btn-moderation-report" onClick={() => setShowModerationReport(true)}>
            <ReportIcon sx={{ fontSize: 18, marginRight: 1 }} />
            View Moderation Report
          </button>
        </div>
      )}

      {/* Moderation alert */}
      {needsResubmission && (
        <div className="moderation-alert">
          <div className="alert-content">
            <div className="alert-text">
              <strong>
                <WarningIcon sx={{ fontSize: 18, color: '#856404', marginRight: 1, verticalAlign: 'middle' }} />
                Moderation Required
              </strong>
              <p>{rejectedQuestionsCount} question(s) need changes.</p>
            </div>
            <button className="btn-resubmit" onClick={handleResubmitForModeration} disabled={isResubmitting}>
              <RefreshIcon sx={{ fontSize: 18, marginRight: 1 }} />
              {isResubmitting ? 'Resubmitting...' : 'Resubmit for Moderation'}
            </button>
          </div>
        </div>
      )}

      {/* Drag instructions */}
      {questions.length > 0 && (
        <div className="drag-instructions">
          <p>
            {actionsAllowed
              ? 'Drag and drop questions to reorder them. Changes are saved automatically.'
              : 'Reordering is disabled for this paper status.'}
          </p>
        </div>
      )}

      {/* Preview / Questions */}
      <div className="preview-section">
        <div className="section-header">
          <h2>Paper Preview (Print Layout)</h2>
          <p>Preview approximates how the paper will appear when exported.</p>
        </div>

        {questions.length === 0 ? (
          <div className="no-questions">
            <p>No questions added to this paper yet.</p>
            <button type="button" onClick={handleAddNewQuestion} className="btn-primary" disabled={isLoading || !actionsAllowed}>
              <AddIcon sx={{ fontSize: 18, marginRight: 1 }} />
              Create First Question
            </button>
          </div>
        ) : (
          <div className="print-preview-wrapper">
            <div className="print-preview-page">
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

              <main className="print-preview-body">
                {actionsAllowed ? (
                  // Sortable (DnD) path
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={questions.map(q => q.question_id)} strategy={verticalListSortingStrategy}>
                      {questions.map((question, index) => (
                        <SortableQuestionItem
                          key={question.question_id}
                          question={question}
                          index={index}
                          onEdit={setEditingQuestion}
                          onDelete={handleDeleteQuestion}
                          isDragging={activeId === question.question_id}
                          actionsAllowed={actionsAllowed}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  // Non-sortable read-only path
                  questions.map((question, index) => (
                    <NonSortableQuestionItem
                      key={question.question_id}
                      question={question}
                      index={index}
                      onEdit={setEditingQuestion}
                      onDelete={handleDeleteQuestion}
                      actionsAllowed={actionsAllowed}
                    />
                  ))
                )}
              </main>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingQuestion && (
        <QuestionEditModal
          question={editingQuestion}
          onSave={handleUpdateQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}

      {/* Moderation report modal */}
      {showModerationReport && moderationData && (
        <ModerationReportModal
          moderationData={moderationData}
          paperData={paper}
          onClose={() => setShowModerationReport(false)}
        />
      )}
    </div>
  );
};

export default PaperQuestionsManager;