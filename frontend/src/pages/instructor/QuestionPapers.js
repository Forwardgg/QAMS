import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../components/AuthProvider';
import questionPaperAPI from '../../api/questionPaper.api';
import QuestionPaperList from './questionpaper/QuestionPapersList';
import QuestionPaperForm from './questionpaper/QuestionPaperForm';
import PaperQuestionsManager from './questionpaper/PaperQuestionsManager';
import './QuestionPaper.css';

const QuestionPapers = () => {
  const { user } = useContext(AuthContext);
  const [questionPapers, setQuestionPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [paperToDelete, setPaperToDelete] = useState(null);
  const [showPreviewManager, setShowPreviewManager] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    examType: '',
    semester: '',
    academicYear: '',
    fullMarks: '',
    duration: ''
  });

  // More granular loading states
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchQuestionPapers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizePapersResponse = (response) => {
    // response can be:
    // - an array of papers
    // - an object already unwrapped (e.g. { success: true, data: [...] })
    // - an object returned from some wrappers (e.g. { data: [...] })
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    if (Array.isArray(response.items)) return response.items;
    // fallback: try to find array-valued property
    const arrProp = Object.values(response).find(v => Array.isArray(v));
    if (arrProp) return arrProp;
    return [];
  };

  const fetchQuestionPapers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await questionPaperAPI.getAll();
      const papers = normalizePapersResponse(response);
      setQuestionPapers(papers);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to fetch question papers';
      setError(msg);
      console.error('Error fetching question papers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create Paper Functions
  const handleCreateClick = () => {
    setFormData({
      title: '',
      courseId: '',
      examType: '',
      semester: '',
      academicYear: '',
      fullMarks: '',
      duration: ''
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (data) => {
    setCreating(true);
    setFormError('');

    try {
      const payload = {
        ...data,
        courseId: data.courseId ? parseInt(data.courseId, 10) : undefined,
        fullMarks: data.fullMarks ? parseInt(data.fullMarks, 10) : null,
        duration: data.duration ? parseInt(data.duration, 10) : null
      };

      await questionPaperAPI.create(payload);

      setShowCreateModal(false);
      await fetchQuestionPapers(); // Refresh the list
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create question paper';
      setFormError(msg);
      console.error('Create paper error:', err);
    } finally {
      setCreating(false);
    }
  };

  // Edit Paper Functions
  const handleEditClick = (paper) => {
    setSelectedPaper(paper);
    setFormData({
      title: paper.title || '',
      courseId: paper.course_id?.toString() || '',
      examType: paper.exam_type || '',
      semester: paper.semester || '',
      academicYear: paper.academic_year || '',
      fullMarks: paper.full_marks?.toString() || '',
      duration: paper.duration?.toString() || ''
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (data) => {
    if (!selectedPaper) {
      setFormError('No paper selected');
      return;
    }

    setUpdating(true);
    setFormError('');

    try {
      const payload = {
        title: data.title,
        examType: data.examType,
        semester: data.semester,
        academicYear: data.academicYear,
        fullMarks: data.fullMarks ? parseInt(data.fullMarks, 10) : null,
        duration: data.duration ? parseInt(data.duration, 10) : null
      };

      await questionPaperAPI.update(selectedPaper.paper_id, payload);

      setShowEditModal(false);
      setSelectedPaper(null);
      await fetchQuestionPapers(); // Refresh the list
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update question paper';
      setFormError(msg);
      console.error('Update paper error:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Delete Paper Functions
  const handleDeleteClick = (paper) => {
    setPaperToDelete(paper);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!paperToDelete) return;

    setDeleting(true);
    setDeleteError('');
    try {
      // support both remove and delete names on the API wrapper
      const removeFn = questionPaperAPI.remove ?? questionPaperAPI.delete;
      if (!removeFn) throw new Error('API method for delete not found');

      await removeFn(paperToDelete.paper_id);
      setShowDeleteModal(false);
      setPaperToDelete(null);
      await fetchQuestionPapers();
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to delete question paper';
      if (status === 403) {
        setDeleteError('Access denied: You can only delete your own question papers');
      } else {
        setDeleteError(msg);
      }
      console.error('Delete paper error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPaperToDelete(null);
    setDeleteError('');
  };

  // Submit for Moderation Functions
  const handleSubmitForModeration = async (paper) => {
    // Accept either user.user_id or user.id
    const currentUserId = user?.user_id ?? user?.id;

    // lightweight client-side ownership hint (server still enforces)
    if (paper && typeof paper.created_by !== 'undefined' && currentUserId != null) {
      // no blocking here, just a confirm message
      // (we don't abort based on mismatch — server will enforce)
    }

    if (!window.confirm(`Are you sure you want to submit "${paper.title}" for moderation? This will change the status to "submitted".`)) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      await questionPaperAPI.submitForModeration(paper.paper_id);
      await fetchQuestionPapers();
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to submit paper for moderation';
      if (status === 403) {
        setSubmitError('Access denied: You can only submit your own question papers for moderation');
      } else if (status === 400) {
        setSubmitError(err?.response?.data?.error || msg);
      } else {
        setSubmitError(msg);
      }
      console.error('Submit for moderation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Preview Functions
  const handlePreviewClick = (paper) => {
    setSelectedPaper(paper);
    setShowPreviewManager(true);
  };

  // Back from preview
  const handleBackFromPreview = async () => {
    setShowPreviewManager(false);
    setSelectedPaper(null);
    await fetchQuestionPapers(); // Refresh to get any changes
  };

  // Modal close functions
  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedPaper(null);
    setFormError('');
  };

  // Render PaperQuestionsManager when preview is active
  if (showPreviewManager && selectedPaper) {
    return (
      <PaperQuestionsManager
        paperId={selectedPaper.paper_id}
        onBack={handleBackFromPreview}
      />
    );
  }

  if (loading) {
    return (
      <div className="question-papers-container">
        <div className="loading">Loading question papers...</div>
      </div>
    );
  }

  return (
    <div className="question-papers-container">
      <div className="page-header">
        <h1>Question Papers</h1>
        <button className="btn-primary" onClick={handleCreateClick} disabled={creating}>
          {creating ? 'Working...' : 'Create New Paper'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {submitError && (
        <div className="error-message">
          {submitError}
        </div>
      )}

      {/* Question Paper List Component */}
      <QuestionPaperList
        questionPapers={questionPapers}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onPreviewClick={handlePreviewClick}
        onSubmitForModeration={handleSubmitForModeration}
        actionLoading={{
          creating,
          updating,
          deleting,
          submitting
        }}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <QuestionPaperForm
          mode="create"
          formData={formData}
          formLoading={creating}
          formError={formError}
          onSubmit={handleCreateSubmit}
          onClose={closeModals}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPaper && (
        <QuestionPaperForm
          mode="edit"
          formData={formData}
          formLoading={updating}
          formError={formError}
          onSubmit={handleEditSubmit}
          onClose={closeModals}
          paper={selectedPaper}
          onDelete={() => handleDeleteClick(selectedPaper)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && paperToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={handleDeleteCancel}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete "<strong>{paperToDelete.title}</strong>"?</p>
              <p style={{ color: '#e74c3c', fontStyle: 'italic', marginTop: '10px' }}>
                This action cannot be undone.
              </p>

              {deleteError && (
                <div className="form-error" style={{ marginTop: '15px' }}>
                  {deleteError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={handleDeleteCancel}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPapers;
