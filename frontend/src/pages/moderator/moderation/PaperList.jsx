// src/frontend/src/pages/moderator/moderation/PaperList.jsx
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../../components/AuthProvider';
import moderatorAPI from '../../../api/moderator.api';
import courseAPI from '../../../api/course.api';
import QuestionModeration from './QuestionModeration';
import PaperModeration from './PaperModeration';
import ModReportModal from './ModReportModal';
import './PaperList.css';

const PaperList = () => {
  const auth = useContext(AuthContext);
  const [currentView, setCurrentView] = useState('list');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [papers, setPapers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ courseId: '', status: '' });
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedModeration, setSelectedModeration] = useState(null);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'change_requested', label: 'Change Requested' },
    { value: 'approved', label: 'Approved' }
  ];

  useEffect(() => {
    if (currentView === 'list') {
      loadPapers();
      loadCourses();
    }
  }, [filters, currentView]);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const data = await moderatorAPI.getPapers(filters);
      setPapers(data.data || []);
    } catch (error) {
      console.error('Failed to load papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await courseAPI.getAll();
      const data = response.data;
      if (Array.isArray(data)) setCourses(data);
      else if (data?.data) setCourses(data.data);
      else if (data?.rows) setCourses(data.rows);
      else setCourses([]);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleStartQuestionModeration = (paper) => {
    setSelectedPaper(paper);
    setCurrentView('questions');
  };

  const handleContinueToPaperModeration = () => {
    setCurrentView('paper');
  };

  const handleBackToQuestionModeration = () => {
    setCurrentView('questions');
  };

  const handleBackToList = () => {
    setSelectedPaper(null);
    setCurrentView('list');
    loadPapers();
  };

  const handleViewReport = async (paper) => {
    try {
      let moderationData = null;
      
      try {
        const reportResponse = await moderatorAPI.getPaperReport(paper.paper_id);
        if (reportResponse.data?.moderation) {
          moderationData = {
            ...reportResponse.data.moderation,
            paper_title: reportResponse.data.paper?.title || paper.title,
            course_code: reportResponse.data.paper?.course_code || paper.course_code,
            course_title: reportResponse.data.paper?.course_title || paper.course_title,
            semester: reportResponse.data.paper?.semester || paper.semester,
            academic_year: reportResponse.data.paper?.academic_year || paper.academic_year
          };
        }
      } catch (error) {
        console.log('getPaperReport failed:', error.message);
      }
      
      if (!moderationData) {
        try {
          const historyResponse = await moderatorAPI.getModerationHistory();
          if (historyResponse.data?.length) {
            const paperModerations = historyResponse.data.filter(mod => mod.paper_id === paper.paper_id);
            if (paperModerations.length) {
              moderationData = paperModerations.sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
              )[0];
            }
          }
        } catch (error) {
          console.log('Moderation history failed:', error.message);
        }
      }
      
      setSelectedModeration(moderationData);
    } catch (error) {
      console.error('Failed to load moderation report:', error);
    }
    
    setShowReportModal(true);
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      draft: 'status-draft',
      submitted: 'status-submitted',
      under_review: 'status-under-review',
      change_requested: 'status-change-requested',
      approved: 'status-approved'
    };
    return statusClasses[status] || 'status-default';
  };

  const getActionButton = (paper) => {
    if (paper.status === 'submitted' || paper.status === 'under_review') {
      return (
        <button
          className={paper.status === 'submitted' ? 'btn btn-start' : 'btn btn-continue'}
          onClick={() => handleStartQuestionModeration(paper)}
        >
          {paper.status === 'submitted' ? 'Start Moderation' : 'Continue Moderation'}
        </button>
      );
    } else if (paper.status === 'approved' || paper.status === 'change_requested') {
      return (
        <button className="btn btn-view" onClick={() => handleViewReport(paper)}>
          View Report
        </button>
      );
    }
    return <button className="btn btn-view" disabled>Not Available</button>;
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'questions':
        return <QuestionModeration paperId={selectedPaper.paper_id} onBack={handleBackToList} onContinue={handleContinueToPaperModeration} />;
      case 'paper':
        return <PaperModeration paperId={selectedPaper.paper_id} onBack={handleBackToQuestionModeration} onComplete={handleBackToList} />;
      case 'list':
      default:
        return renderPaperList();
    }
  };

  const renderPaperList = () => {
    const stats = {
      total: papers.length,
      submitted: papers.filter(p => p.status === 'submitted').length,
      under_review: papers.filter(p => p.status === 'under_review').length,
      approved: papers.filter(p => p.status === 'approved').length,
      change_requested: papers.filter(p => p.status === 'change_requested').length
    };

    return (
      <div className="paper-list-container">
        <div className="paper-list-header">
          <h1>Question Papers for Moderation</h1>
        </div>

        <div className="stats-overview">
          <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-label">Total</div></div>
          <div className="stat-card"><div className="stat-number">{stats.submitted}</div><div className="stat-label">Awaiting</div></div>
          <div className="stat-card"><div className="stat-number">{stats.under_review}</div><div className="stat-label">In Progress</div></div>
          <div className="stat-card"><div className="stat-number">{stats.approved + stats.change_requested}</div><div className="stat-label">Completed</div></div>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label>Course:</label>
            <select value={filters.courseId} onChange={(e) => handleFilterChange('courseId', e.target.value)}>
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course.course_id} value={course.course_id}>{course.code} - {course.title}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <button className="btn btn-refresh" onClick={loadPapers}>
            🔄 Refresh
          </button>
        </div>

        <div className="papers-table-container">
          {loading ? (
            <div className="loading">Loading papers...</div>
          ) : (
            <>
              <table className="papers-table">
                <thead>
                  <tr>
                    <th>Paper Title</th>
                    <th>Course</th>
                    <th>Questions</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {papers.map(paper => (
                    <tr key={paper.paper_id} className="paper-row">
                      <td className="paper-title">
                        <div className="title-text">{paper.title}</div>
                        {paper.exam_type && (
                          <div className="paper-meta">
                            {paper.exam_type} • {paper.semester} • {paper.academic_year}
                          </div>
                        )}
                      </td>
                      <td className="course-info">
                        <div className="course-code">{paper.course_code}</div>
                        <div className="course-title">{paper.course_title}</div>
                      </td>
                      <td className="question-count">
                        {paper.question_count || 0} questions
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge ${getStatusBadgeClass(paper.status)}`}>
                          {paper.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="created-date">
                        {new Date(paper.created_at).toLocaleDateString()}
                      </td>
                      <td className="actions-cell">
                        {getActionButton(paper)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {papers.length === 0 && !loading && (
                <div className="no-papers">
                  No papers found matching your filters.
                </div>
              )}
            </>
          )}
        </div>

        <ModReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedModeration(null);
          }}
          moderation={selectedModeration}
          paperData={selectedModeration}
        />
      </div>
    );
  };

  return (
    <div className="paper-list-wrapper">
      {renderCurrentView()}
    </div>
  );
};

export default PaperList;