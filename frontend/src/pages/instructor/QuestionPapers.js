import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../components/AuthProvider';
import questionPaperAPI from '../../api/questionPaper.api';
import courseAPI from '../../api/course.api';
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
  const [selectedPaper, setSelectedPaper] = useState(null);
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
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchQuestionPapers();
  }, []);

  const fetchQuestionPapers = async () => {
    try {
      setLoading(true);
      const response = await questionPaperAPI.getAll();
      setQuestionPapers(response.data || response || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch question papers');
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

  const handleCreateSubmit = async (formData) => {
    setFormLoading(true);
    setFormError('');

    try {
      await questionPaperAPI.create({
        ...formData,
        courseId: parseInt(formData.courseId),
        fullMarks: formData.fullMarks ? parseInt(formData.fullMarks) : null,
        duration: formData.duration ? parseInt(formData.duration) : null
      });

      setShowCreateModal(false);
      fetchQuestionPapers(); // Refresh the list
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create question paper');
    } finally {
      setFormLoading(false);
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

  const handleEditSubmit = async (formData) => {
    setFormLoading(true);
    setFormError('');

    try {
      await questionPaperAPI.update(selectedPaper.paper_id, {
        title: formData.title,
        examType: formData.examType,
        semester: formData.semester,
        academicYear: formData.academicYear,
        fullMarks: formData.fullMarks ? parseInt(formData.fullMarks) : null,
        duration: formData.duration ? parseInt(formData.duration) : null
      });

      setShowEditModal(false);
      setSelectedPaper(null);
      fetchQuestionPapers(); // Refresh the list
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update question paper');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Paper Functions
  const handleDeleteClick = (paper) => {
    if (window.confirm(`Are you sure you want to delete "${paper.title}"?`)) {
      handleDeleteConfirm(paper);
    }
  };

  const handleDeleteConfirm = async (paper) => {
    setFormLoading(true);
    try {
      await questionPaperAPI.delete(paper.paper_id);
      fetchQuestionPapers(); // Refresh the list
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete question paper');
    } finally {
      setFormLoading(false);
    }
  };

  // Preview Functions - UPDATED: Show PaperQuestionsManager directly
  const handlePreviewClick = (paper) => {
    setSelectedPaper(paper);
    setShowPreviewManager(true);
  };

  // Back from preview
  const handleBackFromPreview = () => {
    setShowPreviewManager(false);
    setSelectedPaper(null);
    fetchQuestionPapers(); // Refresh to get any changes
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
        <button className="btn-primary" onClick={handleCreateClick}>
          Create New Paper
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Question Paper List Component */}
      <QuestionPaperList
        questionPapers={questionPapers}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onPreviewClick={handlePreviewClick}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <QuestionPaperForm
          mode="create"
          formData={formData}
          formLoading={formLoading}
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
          formLoading={formLoading}
          formError={formError}
          onSubmit={handleEditSubmit}
          onClose={closeModals}
          paper={selectedPaper}
          onDelete={() => handleDeleteClick(selectedPaper)}
        />
      )}
    </div>
  );
};

export default QuestionPapers;