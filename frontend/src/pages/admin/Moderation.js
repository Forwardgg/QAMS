// src/pages/admin/Moderation.js
import React, { useState, useEffect } from 'react';
import ModerationList from './moderation/ModerationList';
import ModReport from './moderation/ModReport';
import QuestionList from './moderation/QuestionList';
import moderatorAPI from '../../api/moderator.api';
import './Moderation.css';

const Moderation = ({ view, selectedModeration, onViewModeration, onBackToList }) => {
  const [moderation, setModeration] = useState(null);
  const [paperReport, setPaperReport] = useState(null);
  const [questionReport, setQuestionReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch data for details view
  const fetchModerationDetails = async () => {
    if (!selectedModeration) return;
    
    setLoading(true);
    setError(null);
    try {
      const [moderationRes, paperRes, questionRes] = await Promise.all([
        moderatorAPI.getModerationDetails(selectedModeration.moderationId),
        moderatorAPI.getPaperReport(selectedModeration.paperId),
        moderatorAPI.getQuestionReport(selectedModeration.paperId)
      ]);
      
      setModeration(moderationRes.data);
      setPaperReport(paperRes.data);
      setQuestionReport(questionRes.data);
    } catch (error) {
      console.error('Error fetching moderation details:', error);
      setError('Failed to load moderation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'details' && selectedModeration) {
      fetchModerationDetails();
    }
  }, [view, selectedModeration]);

  // Show list view
  if (view === 'list') {
    return <ModerationList onViewModeration={onViewModeration} />;
  }

  // Show details view
  if (loading) {
    return <div className="loading">Loading moderation details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={onBackToList} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  if (!moderation) {
    return (
      <div className="error-container">
        <h2>Moderation Not Found</h2>
        <p>The requested moderation record could not be found.</p>
        <button onClick={onBackToList} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="moderation-details">
      <div className="page-header">
        <button onClick={onBackToList} className="btn btn-outline back-btn">
          ← Back to List
        </button>
        <h1>Moderation Details</h1>
      </div>

      {/* Basic Info */}
      <div className="info-card">
        <h2>Basic Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>Moderation ID:</label>
            <span>#{moderation.moderation_id}</span>
          </div>
          <div className="info-item">
            <label>Paper Title:</label>
            <span>{moderation.paper_title}</span>
          </div>
          <div className="info-item">
            <label>Course:</label>
            <span>{moderation.course_code} - {moderation.course_title}</span>
          </div>
          <div className="info-item">
            <label>Instructor:</label>
            <span>{moderation.creator_name}</span>
          </div>
          <div className="info-item">
            <label>Moderator:</label>
            <span>{moderation.moderator_name} ({moderation.moderator_email})</span>
          </div>
          <div className="info-item">
            <label>Status:</label>
            <span className={`status-badge status-${moderation.status}`}>
              {moderation.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-section">
        <div className="tabs-header">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            Questions ({questionReport?.count || 0})
          </button>
          <button 
            className={`tab-button ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            Moderation Report
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && paperReport && (
            <div className="overview-tab">
              <h3>Paper Overview</h3>
              <div className="stats-grid">
                <div className="stat-card total">
                  <span className="stat-number">{paperReport.counts?.total || 0}</span>
                  <span className="stat-label">Total Questions</span>
                </div>
                <div className="stat-card approved">
                  <span className="stat-number">{paperReport.counts?.approved || 0}</span>
                  <span className="stat-label">Approved</span>
                </div>
                <div className="stat-card change-requested">
                  <span className="stat-number">{paperReport.counts?.change_requested || 0}</span>
                  <span className="stat-label">Changes Requested</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <QuestionList 
    questionReport={questionReport}
    paperData={paperReport?.paper}
    loading={loading && !questionReport}
  />
          )}

          {activeTab === 'report' && (
            <ModReport moderation={moderation} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Moderation;