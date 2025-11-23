import React, { useState } from 'react';
import QuestionsList from './questions/QuestionsList';
import QuestionDetail from './questions/QuestionDetail';
import QuestionForm from './questions/QuestionForm';
import './Questions.css';

const Questions = () => {
  const [activeView, setActiveView] = useState('list');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedPaper, setSelectedPaper] = useState('');
  

  // Navigation handlers
  const handleViewDetail = (question) => {
    setSelectedQuestion(question);
    setActiveView('detail');
  };

  const handleCreateNew = (course, paper) => {
    setSelectedCourse(course);
    setSelectedPaper(paper);
    setActiveView('create');
  };

  const handleEditQuestion = (question) => {
    setSelectedQuestion(question);
    setActiveView('edit');
  };

  const handleBackToList = () => {
    setActiveView('list');
    setSelectedQuestion(null);
  };

  // View configuration
  const viewConfig = {
    list: {
      component: (
        <QuestionsList 
          onViewDetail={handleViewDetail}
          onCreateNew={handleCreateNew}
          onEditQuestion={handleEditQuestion}
        />
      )
    },
    detail: {
      component: (
        <QuestionDetail 
          question={selectedQuestion} 
          onBack={handleBackToList}
          onEdit={handleEditQuestion}
        />
      )
    },
    create: {
      component: (
        <QuestionForm 
          mode="create"
          courseCode={selectedCourse}
          paperId={selectedPaper}
          onBack={handleBackToList}
          onSuccess={handleBackToList}
        />
      )
    },
    edit: {
      component: (
        <QuestionForm 
          mode="edit"
          question={selectedQuestion}
          onBack={handleBackToList}
          onSuccess={handleBackToList}
        />
      )
    }
  };

  const currentView = viewConfig[activeView] || viewConfig.list;

  return (
    <div className="questions-container">
      {/* No header - each component handles its own header */}
      <div className="questions-content">
        {currentView.component}
      </div>
    </div>
  );
};

export default Questions;