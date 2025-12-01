// src/frontend/src/pages/moderator/moderation/PaperList.jsx
import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
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
  const [modalPaperData, setModalPaperData] = useState(null);

  const statusOptions = useMemo(() => [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'change_requested', label: 'Change Requested' },
    { value: 'approved', label: 'Approved' }
  ], []);

  // Memoize filtered papers
  const { stats, filteredPapers } = useMemo(() => {
    const filtered = papers.filter(paper => {
      const matchesCourse = !filters.courseId || paper.course_id == filters.courseId;
      const matchesStatus = !filters.status || paper.status === filters.status;
      return matchesCourse && matchesStatus;
    });

    const stats = {
      total: filtered.length,
      submitted: filtered.filter(p => p.status === 'submitted').length,
      under_review: filtered.filter(p => p.status === 'under_review').length,
      approved: filtered.filter(p => p.status === 'approved').length,
      change_requested: filtered.filter(p => p.status === 'change_requested').length
    };

    return { stats, filteredPapers: filtered };
  }, [papers, filters]);

  useEffect(() => {
    if (currentView === 'list') {
      loadPapers();
      loadCourses();
    }
  }, [filters, currentView]);

  const loadPapers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await moderatorAPI.getPapers(filters);
      setPapers(data.data || []);
    } catch (error) {
      console.error('Failed to load papers:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadCourses = useCallback(async () => {
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
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleStartQuestionModeration = useCallback((paper) => {
    setSelectedPaper(paper);
    setCurrentView('questions');
  }, []);

  const handleContinueToPaperModeration = useCallback(() => {
    setCurrentView('paper');
  }, []);

  const handleBackToQuestionModeration = useCallback(() => {
    setCurrentView('questions');
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedPaper(null);
    setCurrentView('list');
    loadPapers();
  }, [loadPapers]);

  const handleViewReport = useCallback(async (paper) => {
    try {
      let moderationData = null;
      let paperData = null;
      
      try {
        const reportResponse = await moderatorAPI.getPaperReport(paper.paper_id);
        if (reportResponse.data) {
          if (reportResponse.data.moderation) {
            moderationData = reportResponse.data.moderation;
          }
          if (reportResponse.data.paper) {
            paperData = reportResponse.data.paper;
          }
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
      
      // Set paper data separately
      setModalPaperData(paperData || {
        title: paper.title,
        course_code: paper.course_code,
        course_title: paper.course_title,
        semester: paper.semester,
        academic_year: paper.academic_year
      });
      setSelectedModeration(moderationData);
      setShowReportModal(true);
    } catch (error) {
      console.error('Failed to load moderation report:', error);
    }
  }, []);

  const getStatusBadgeClass = useCallback((status) => {
    const statusClasses = {
      draft: 'status-draft',
      submitted: 'status-submitted',
      under_review: 'status-under-review',
      change_requested: 'status-change-requested',
      approved: 'status-approved'
    };
    return statusClasses[status] || 'status-default';
  }, []);

  const getActionButton = useCallback((paper) => {
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
  }, [handleStartQuestionModeration, handleViewReport]);

  const handleCloseModal = useCallback(() => {
    setShowReportModal(false);
    setSelectedModeration(null);
    setModalPaperData(null);
  }, []);

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
            <select 
              value={filters.courseId} 
              onChange={(e) => handleFilterChange('courseId', e.target.value)}
              className="filter-select"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course.course_id} value={course.course_id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-refresh" onClick={loadPapers}>
            Refresh
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
                  {filteredPapers.map(paper => (
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

              {filteredPapers.length === 0 && !loading && (
                <div className="no-papers">
                  No papers found matching your filters.
                </div>
              )}
            </>
          )}
        </div>

        {/* Only render modal when showReportModal is true */}
        {showReportModal && (
          <ModReportModal
            isOpen={showReportModal}
            onClose={handleCloseModal}
            moderation={selectedModeration}
            paperData={modalPaperData}
          />
        )}
      </div>
    );
  };

  return (
    <div className="moderator-page paper-list-wrapper">
      {renderCurrentView()}
    </div>
  );
};

export default React.memo(PaperList);