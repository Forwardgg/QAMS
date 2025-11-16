
import React, { useState, useEffect } from 'react';
import './ModeratorDashboard.css';

const ModeratorDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [papers, setPapers] = useState([]);
  const [claimedPapers, setClaimedPapers] = useState([]);
  const [paperModerationRecords, setPaperModerationRecords] = useState([]);
  const [questionModerationRecords, setQuestionModerationRecords] = useState([]);
  const [claimedQuestions, setClaimedQuestions] = useState([]);
  const [currentModerator] = useState({ id: 1, name: 'Current Moderator' });

  // Mock data initialization
  useEffect(() => {
    // Sample papers available for moderation
    setPapers([
      {
        id: 1,
        title: 'Data Structures Mid-term 2024',
        course: 'CS201 - Data Structures',
        instructor: 'Dr. John Smith',
        status: 'pending',
        createdAt: '2024-01-15',
        questions: [
          { id: 1, text: 'What is a binary tree?', type: 'subjective', status: 'pending' },
          { id: 2, text: 'Which sorting algorithm is most efficient?', type: 'mcq', status: 'pending' }
        ]
      },
      {
        id: 2,
        title: 'Algorithms Final Exam 2024',
        course: 'CS202 - Algorithms',
        instructor: 'Dr. Jane Doe',
        status: 'pending',
        createdAt: '2024-01-16',
        questions: [
          { id: 3, text: 'Explain Dijkstra algorithm', type: 'subjective', status: 'pending' },
          { id: 4, text: 'Time complexity of QuickSort', type: 'mcq', status: 'pending' }
        ]
      }
    ]);

    // Sample moderation records
    setPaperModerationRecords([
      {
        id: 1,
        paperId: 1,
        paperTitle: 'Data Structures Mid-term 2024',
        moderatorId: 1,
        moderatorName: 'Current Moderator',
        status: 'claimed',
        claimedAt: '2024-01-17',
        comments: ''
      }
    ]);

    setQuestionModerationRecords([
      {
        id: 1,
        questionId: 1,
        questionText: 'What is a binary tree?',
        paperId: 1,
        paperTitle: 'Data Structures Mid-term 2024',
        moderatorId: 1,
        moderatorName: 'Current Moderator',
        status: 'claimed',
        claimedAt: '2024-01-17',
        comments: ''
      }
    ]);
  }, []);

  // 1) Moderator claims a paper for moderation
  const claimPaperForModeration = (paperId) => {
    const paper = papers.find(p => p.id === paperId);
    if (paper) {
      const newRecord = {
        id: paperModerationRecords.length + 1,
        paperId: paper.id,
        paperTitle: paper.title,
        moderatorId: currentModerator.id,
        moderatorName: currentModerator.name,
        status: 'claimed',
        claimedAt: new Date().toISOString().split('T')[0],
        comments: ''
      };

      setPaperModerationRecords([...paperModerationRecords, newRecord]);
      setPapers(papers.filter(p => p.id !== paperId));
      setClaimedPapers([...claimedPapers, paper]);

      alert(`Paper "${paper.title}" claimed successfully!`);
    }
  };

  // 2) Get all moderation records for a specific paper
  const getPaperModerationRecords = (paperId) => {
    return paperModerationRecords.filter(record => record.paperId === paperId);
  };

  // 3) Get papers claimed by the current moderator
  const getClaimedPapers = () => {
    return claimedPapers;
  };

  // 4) Approve a paper moderation record
  const approvePaperModeration = (recordId) => {
    setPaperModerationRecords(paperModerationRecords.map(record =>
      record.id === recordId ? { ...record, status: 'approved' } : record
    ));
    alert('Paper approved successfully!');
  };

  // 5) Reject a paper moderation record
  const rejectPaperModeration = (recordId, comments) => {
    setPaperModerationRecords(paperModerationRecords.map(record =>
      record.id === recordId ? { ...record, status: 'rejected', comments } : record
    ));
    alert('Paper rejected with comments.');
  };

  // 6) Moderator claims a specific question within a paper for moderation
  const claimQuestionForModeration = (paperId, questionId) => {
    const paper = claimedPapers.find(p => p.id === paperId);
    if (paper) {
      const question = paper.questions.find(q => q.id === questionId);
      if (question) {
        const newRecord = {
          id: questionModerationRecords.length + 1,
          questionId: question.id,
          questionText: question.text,
          paperId: paper.id,
          paperTitle: paper.title,
          moderatorId: currentModerator.id,
          moderatorName: currentModerator.name,
          status: 'claimed',
          claimedAt: new Date().toISOString().split('T')[0],
          comments: ''
        };

        setQuestionModerationRecords([...questionModerationRecords, newRecord]);

        // Update paper questions to show claimed status
        const updatedPapers = claimedPapers.map(p =>
          p.id === paperId ? {
            ...p,
            questions: p.questions.map(q =>
              q.id === questionId ? { ...q, status: 'claimed' } : q
            )
          } : p
        );

        setClaimedPapers(updatedPapers);
        alert(`Question claimed for moderation!`);
      }
    }
  };

  // 7) Get all question moderation records for a specific paper
  const getQuestionModerationRecordsForPaper = (paperId) => {
    return questionModerationRecords.filter(record => record.paperId === paperId);
  };

  // 8) Get all moderation records for a single question
  const getQuestionModerationRecords = (questionId) => {
    return questionModerationRecords.filter(record => record.questionId === questionId);
  };

  // 9) Get all question moderations claimed by the current moderator
  const getClaimedQuestions = () => {
    return questionModerationRecords.filter(record =>
      record.moderatorId === currentModerator.id && record.status === 'claimed'
    );
  };

  // 10) Approve a question moderation record
  const approveQuestionModeration = (recordId) => {
    setQuestionModerationRecords(questionModerationRecords.map(record =>
      record.id === recordId ? { ...record, status: 'approved' } : record
    ));
    alert('Question approved successfully!');
  };

  // 11) Reject a question moderation record
  const rejectQuestionModeration = (recordId, comments) => {
    setQuestionModerationRecords(questionModerationRecords.map(record =>
      record.id === recordId ? { ...record, status: 'rejected', comments } : record
    ));
    alert('Question rejected with comments.');
  };

  return (
    <div className="moderator-dashboard">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <h2>Moderator Panel</h2>
        <div className="moderator-info">
          <p>Welcome, <strong>{currentModerator.name}</strong></p>
        </div>
        <nav>
          <button
            onClick={() => setActiveSection('dashboard')}
            className={activeSection === 'dashboard' ? 'active' : ''}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveSection('available-papers')}
            className={activeSection === 'available-papers' ? 'active' : ''}
          >
            Available Papers
          </button>
          <button
            onClick={() => setActiveSection('claimed-papers')}
            className={activeSection === 'claimed-papers' ? 'active' : ''}
          >
            My Papers
          </button>
          <button
            onClick={() => setActiveSection('claimed-questions')}
            className={activeSection === 'claimed-questions' ? 'active' : ''}
          >
            My Questions
          </button>
          <button
            onClick={() => setActiveSection('moderation-history')}
            className={activeSection === 'moderation-history' ? 'active' : ''}
          >
            Moderation History
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <ModeratorDashboardSection
            claimedPapersCount={claimedPapers.length}
            claimedQuestionsCount={getClaimedQuestions().length}
            pendingPapersCount={papers.length}
          />
        )}

        {/* Available Papers Section */}
        {activeSection === 'available-papers' && (
          <AvailablePapersSection
            papers={papers}
            onClaimPaper={claimPaperForModeration}
          />
        )}

        {/* Claimed Papers Section */}
        {activeSection === 'claimed-papers' && (
          <ClaimedPapersSection
            claimedPapers={getClaimedPapers()}
            paperModerationRecords={paperModerationRecords}
            onApprovePaper={approvePaperModeration}
            onRejectPaper={rejectPaperModeration}
            onClaimQuestion={claimQuestionForModeration}
            getQuestionModerationRecords={getQuestionModerationRecordsForPaper}
          />
        )}

        {/* Claimed Questions Section */}
        {activeSection === 'claimed-questions' && (
          <ClaimedQuestionsSection
            claimedQuestions={getClaimedQuestions()}
            onApproveQuestion={approveQuestionModeration}
            onRejectQuestion={rejectQuestionModeration}
          />
        )}

        {/* Moderation History Section */}
        {activeSection === 'moderation-history' && (
          <ModerationHistorySection
            paperModerationRecords={paperModerationRecords}
            questionModerationRecords={questionModerationRecords}
          />
        )}
      </div>
    </div>
  );
};

// Moderator Dashboard Component
const ModeratorDashboardSection = ({ claimedPapersCount, claimedQuestionsCount, pendingPapersCount }) => (
  <div className="section">
    <h1>Moderator Dashboard</h1>
    <div className="stats-grid">
      <div className="stat-card pending">
        <h3>Pending Papers</h3>
        <p>{pendingPapersCount}</p>
        <span>Available for moderation</span>
      </div>
      <div className="stat-card claimed">
        <h3>My Papers</h3>
        <p>{claimedPapersCount}</p>
        <span>Papers I'm moderating</span>
      </div>
      <div className="stat-card questions">
        <h3>My Questions</h3>
        <p>{claimedQuestionsCount}</p>
        <span>Questions I'm moderating</span>
      </div>
    </div>
  </div>
);

// Available Papers Component
const AvailablePapersSection = ({ papers, onClaimPaper }) => (
  <div className="section">
    <div className="section-header">
      <h1>Available Papers for Moderation</h1>
      <p>Claim papers to start moderation process</p>
    </div>

    <div className="papers-grid">
      {papers.length === 0 ? (
        <div className="empty-state">
          <p>No papers available for moderation at the moment.</p>
        </div>
      ) : (
        papers.map(paper => (
          <div key={paper.id} className="paper-card">
            <div className="paper-header">
              <h3>{paper.title}</h3>
              <span className="status-badge pending">Pending</span>
            </div>
            <div className="paper-details">
              <p><strong>Course:</strong> {paper.course}</p>
              <p><strong>Instructor:</strong> {paper.instructor}</p>
              <p><strong>Created:</strong> {paper.createdAt}</p>
              <p><strong>Questions:</strong> {paper.questions.length}</p>
            </div>
            <div className="paper-actions">
              <button
                onClick={() => onClaimPaper(paper.id)}
                className="claim-btn"
              >
                Claim for Moderation
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// Claimed Papers Component
const ClaimedPapersSection = ({
  claimedPapers,
  paperModerationRecords,
  onApprovePaper,
  onRejectPaper,
  onClaimQuestion,
  getQuestionModerationRecords
}) => {
  const [rejectComments, setRejectComments] = useState({});
  const [expandedPaper, setExpandedPaper] = useState(null);

  const handleReject = (recordId) => {
    if (rejectComments[recordId]?.trim()) {
      onRejectPaper(recordId, rejectComments[recordId]);
      setRejectComments(prev => ({ ...prev, [recordId]: '' }));
    } else {
      alert('Please provide comments for rejection.');
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h1>My Claimed Papers</h1>
        <p>Papers you are currently moderating</p>
      </div>

      <div className="claimed-papers-list">
        {claimedPapers.length === 0 ? (
          <div className="empty-state">
            <p>You haven't claimed any papers for moderation yet.</p>
          </div>
        ) : (
          claimedPapers.map(paper => {
            const moderationRecord = paperModerationRecords.find(record => record.paperId === paper.id);
            const questionRecords = getQuestionModerationRecords(paper.id);

            return (
              <div key={paper.id} className="claimed-paper-card">
                <div className="paper-main-info">
                  <div className="paper-header">
                    <h3>{paper.title}</h3>
                    <span className={`status-badge ${moderationRecord?.status || 'claimed'}`}>
                      {moderationRecord?.status || 'claimed'}
                    </span>
                  </div>
                  <div className="paper-details">
                    <p><strong>Course:</strong> {paper.course}</p>
                    <p><strong>Instructor:</strong> {paper.instructor}</p>
                    <p><strong>Questions:</strong> {paper.questions.length}</p>
                  </div>

                  <button
                    onClick={() => setExpandedPaper(expandedPaper === paper.id ? null : paper.id)}
                    className="toggle-questions-btn"
                  >
                    {expandedPaper === paper.id ? 'Hide Questions' : 'Show Questions'}
                  </button>
                </div>

                {/* Questions List */}
                {expandedPaper === paper.id && (
                  <div className="paper-questions">
                    <h4>Questions in this paper:</h4>
                    {paper.questions.map(question => (
                      <div key={question.id} className="question-item">
                        <div className="question-content">
                          <p><strong>Q:</strong> {question.text}</p>
                          <span className={`question-status ${question.status}`}>
                            {question.status}
                          </span>
                        </div>
                        {question.status === 'pending' && (
                          <button
                            onClick={() => onClaimQuestion(paper.id, question.id)}
                            className="claim-question-btn"
                          >
                            Claim Question
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Moderation Actions */}
                {moderationRecord && moderationRecord.status === 'claimed' && (
                  <div className="moderation-actions">
                    <h4>Paper Moderation:</h4>
                    <div className="action-buttons">
                      <button
                        onClick={() => onApprovePaper(moderationRecord.id)}
                        className="approve-btn"
                      >
                        Approve Paper
                      </button>
                      <div className="reject-section">
                        <textarea
                          placeholder="Enter rejection comments..."
                          value={rejectComments[moderationRecord.id] || ''}
                          onChange={(e) => setRejectComments(prev => ({
                            ...prev,
                            [moderationRecord.id]: e.target.value
                          }))}
                        />
                        <button
                          onClick={() => handleReject(moderationRecord.id)}
                          className="reject-btn"
                        >
                          Reject Paper
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Claimed Questions Component
const ClaimedQuestionsSection = ({ claimedQuestions, onApproveQuestion, onRejectQuestion }) => {
  const [rejectComments, setRejectComments] = useState({});

  const handleReject = (recordId) => {
    if (rejectComments[recordId]?.trim()) {
      onRejectQuestion(recordId, rejectComments[recordId]);
      setRejectComments(prev => ({ ...prev, [recordId]: '' }));
    } else {
      alert('Please provide comments for rejection.');
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h1>My Claimed Questions</h1>
        <p>Individual questions you are moderating</p>
      </div>

      <div className="claimed-questions-list">
        {claimedQuestions.length === 0 ? (
          <div className="empty-state">
            <p>You haven't claimed any individual questions for moderation.</p>
          </div>
        ) : (
          claimedQuestions.map(record => (
            <div key={record.id} className="claimed-question-card">
              <div className="question-header">
                <h4>Question from: {record.paperTitle}</h4>
                <span className={`status-badge ${record.status}`}>
                  {record.status}
                </span>
              </div>

              <div className="question-content">
                <p><strong>Question:</strong> {record.questionText}</p>
                <p><strong>Claimed on:</strong> {record.claimedAt}</p>
              </div>

              {record.status === 'claimed' && (
                <div className="moderation-actions">
                  <div className="action-buttons">
                    <button
                      onClick={() => onApproveQuestion(record.id)}
                      className="approve-btn"
                    >
                      Approve Question
                    </button>
                    <div className="reject-section">
                      <textarea
                        placeholder="Enter rejection comments..."
                        value={rejectComments[record.id] || ''}
                        onChange={(e) => setRejectComments(prev => ({
                          ...prev,
                          [record.id]: e.target.value
                        }))}
                      />
                      <button
                        onClick={() => handleReject(record.id)}
                        className="reject-btn"
                      >
                        Reject Question
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Moderation History Component
const ModerationHistorySection = ({ paperModerationRecords, questionModerationRecords }) => (
  <div className="section">
    <div className="section-header">
      <h1>Moderation History</h1>
      <p>Your past moderation activities</p>
    </div>

    <div className="history-tabs">
      <div className="tab-content">
        <h3>Paper Moderation History</h3>
        <div className="history-list">
          {paperModerationRecords.map(record => (
            <div key={record.id} className="history-item">
              <div className="history-content">
                <p><strong>Paper:</strong> {record.paperTitle}</p>
                <p><strong>Status:</strong>
                  <span className={`status-text ${record.status}`}>{record.status}</span>
                </p>
                <p><strong>Date:</strong> {record.claimedAt}</p>
                {record.comments && <p><strong>Comments:</strong> {record.comments}</p>}
              </div>
            </div>
          ))}
        </div>

        <h3>Question Moderation History</h3>
        <div className="history-list">
          {questionModerationRecords.map(record => (
            <div key={record.id} className="history-item">
              <div className="history-content">
                <p><strong>Question:</strong> {record.questionText}</p>
                <p><strong>Paper:</strong> {record.paperTitle}</p>
                <p><strong>Status:</strong>
                  <span className={`status-text ${record.status}`}>{record.status}</span>
                </p>
                <p><strong>Date:</strong> {record.claimedAt}</p>
                {record.comments && <p><strong>Comments:</strong> {record.comments}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default ModeratorDashboard;
