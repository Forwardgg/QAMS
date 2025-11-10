// src/pages/ModeratorPending/ModeratorPending.jsx
import React, { useState } from 'react';
import MainLayout from '../../layouts/Mainlayout/MainLayout';
import Button from '../../components/Button/Button';
import './ModeratorPending.css';

const ModeratorPending = () => {
  const moderatorName = "Mr. David Lee";

  // Dummy data for pending questions. Note the 'text' property contains HTML.
  const [pendingQuestions, setPendingQuestions] = useState([
    {
      id: 'Q2', courseId: 'CS305', author: 'Dr. Jane Doe', outcome: 'CO2', difficulty: 'hard', status: 'Pending',
      text: '<p>Explain the concept of <strong>dynamic programming</strong> with an example.</p><ul><li>What are its key characteristics?</li><li>Provide a simple code snippet.</li></ul>',
    },
    {
      id: 'Q4', courseId: 'CS201', author: 'Dr. Jane Doe', outcome: 'CO1', difficulty: 'medium', status: 'Pending',
      text: '<p>What is the main difference between a <code>Queue</code> and a <code>Stack</code> data structure?</p>',
    },
    {
      id: 'Q5', courseId: 'MA101', author: 'Dr. Jane Doe', outcome: 'CO3', difficulty: 'easy', status: 'Pending',
      text: '<p>Integrate the function <code>f(x) = 2x + 5</code>.</p>',
    },
  ]);

  // State to hold the currently selected question for review
  const [selectedQuestion, setSelectedQuestion] = useState(pendingQuestions[0] || null);
  const [feedback, setFeedback] = useState('');

  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question);
    setFeedback(''); // Reset feedback when selecting a new question
  };

  const handleModerationAction = (questionId, action) => {
    if (!feedback && action !== 'approve') {
      alert('Feedback is required to reject or request changes.');
      return;
    }

    alert(`Action: ${action.toUpperCase()} on question ${questionId}. Feedback: "${feedback}"`);
    // In a real app, you would send this to the backend API
    setPendingQuestions(prev => prev.filter(q => q.id !== questionId));
    setSelectedQuestion(pendingQuestions.find(q => q.id !== questionId) || null); // Select the next question
    setFeedback('');
  };

  return (
    <MainLayout role="moderator" username={moderatorName}>
      <div className="moderator-pending-page">
        <h2>Pending Moderations</h2>
        <div className="moderation-container">
          {/* Left Column: List of Pending Questions */}
          <div className="pending-list-panel card">
            <h3>Review Queue ({pendingQuestions.length})</h3>
            <div className="pending-list">
              {pendingQuestions.length > 0 ? (
                pendingQuestions.map(q => (
                  <div
                    key={q.id}
                    className={`pending-list-item ${selectedQuestion?.id === q.id ? 'active' : ''}`}
                    onClick={() => handleSelectQuestion(q)}
                  >
                    <span className="question-id">{q.id} ({q.courseId})</span>
                    <span className="question-author">by {q.author}</span>
                  </div>
                ))
              ) : (
                <p className="no-data-message">The review queue is empty. Great job!</p>
              )}
            </div>
          </div>

          {/* Right Column: Detailed View of Selected Question */}
          <div className="review-panel card">
            {selectedQuestion ? (
              <>
                <h3>Reviewing Question: {selectedQuestion.id}</h3>
                <div className="question-details">
                  <p><strong>Course:</strong> {selectedQuestion.courseId}</p>
                  <p><strong>Author:</strong> {selectedQuestion.author}</p>
                  <p><strong>Outcome:</strong> {selectedQuestion.outcome}</p>
                  <p><strong>Difficulty:</strong> {selectedQuestion.difficulty}</p>
                </div>
                <div className="question-content-box">
                  <h4>Question Content:</h4>
                  {/* Use dangerouslySetInnerHTML to render HTML from CKEditor */}
                  <div
                    className="question-text"
                    dangerouslySetInnerHTML={{ __html: selectedQuestion.text }}
                  />
                </div>
                <div className="feedback-section">
                  <label htmlFor="feedbackText">Feedback / Reason for Action:</label>
                  <textarea
                    id="feedbackText"
                    className="form-control"
                    rows="4"
                    placeholder="Provide feedback here. Required for 'Reject' or 'Request Changes'."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  ></textarea>
                </div>
                <div className="action-buttons">
                  <Button variant="success" onClick={() => handleModerationAction(selectedQuestion.id, 'approve')}>Approve</Button>
                  <Button variant="warning" onClick={() => handleModerationAction(selectedQuestion.id, 'request_changes')}>Request Changes</Button>
                  <Button variant="error" onClick={() => handleModerationAction(selectedQuestion.id, 'reject')}>Reject</Button>
                </div>
              </>
            ) : (
              <div className="no-selection-message">
                <p>Select a question from the queue to start reviewing.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ModeratorPending;