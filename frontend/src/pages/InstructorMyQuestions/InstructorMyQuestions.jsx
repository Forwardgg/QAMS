// src/pages/InstructorMyQuestions/InstructorMyQuestions.jsx
import React, { useState } from 'react';
import MainLayout from '../../layouts/Mainlayout/MainLayout';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import QuestionEditor from '../../components/QuestionEditor/QuestionEditor'; // Import the new editor
import './InstructorMyQuestions.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

const InstructorMyQuestions = () => {
  const instructorName = "Dr. Jane Doe";
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null); // Stores question being edited
  const [questionContent, setQuestionContent] = useState('');
  const [questionTitle, setQuestionTitle] = useState('');
  const [courseOutcome, setCourseOutcome] = useState('');

  // Dummy data for instructor's questions
  const [questions, setQuestions] = useState([
    { id: 101, title: 'Explain Binary Search Tree Traversal', course: 'CS201', outcome: 'CO1', status: 'Approved', lastEdited: '2023-10-20', content: '<p>What are the three common ways to traverse a binary search tree? Describe each method.</p>' },
    { id: 102, title: 'SQL Joins vs Subqueries', course: 'CS305', outcome: 'CO2', status: 'Pending', lastEdited: '2023-10-25', content: '<p>Differentiate between different types of SQL JOINs and explain when to use a subquery over a JOIN.</p>' },
    { id: 103, title: 'Derive the Quadratic Formula', course: 'MA101', outcome: 'CO3', status: 'Approved', lastEdited: '2023-10-18', content: '<p>Derive the quadratic formula using the method of completing the square.</p>' },
    { id: 104, title: 'Python List Comprehensions', course: 'CS201', outcome: 'CO1', status: 'Rejected', lastEdited: '2023-10-27', content: '<p>Write a Python function using list comprehensions to filter even numbers from a list.</p>' },
  ]);

  // Dummy course outcomes for the dropdown
  const courseOutcomes = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];

  const handleEditorChange = (data) => {
    setQuestionContent(data);
  };

  const handleAddEditQuestion = (e) => {
    e.preventDefault();
    if (!questionTitle || !questionContent || !courseOutcome) {
      alert('Please fill in all question fields.');
      return;
    }

    if (editingQuestion) {
      // Update existing question
      setQuestions(questions.map(q =>
        q.id === editingQuestion.id ? { ...q, title: questionTitle, content: questionContent, outcome: courseOutcome, lastEdited: new Date().toISOString().split('T')[0], status: 'Pending' } : q
      ));
      console.log('Question Updated:', editingQuestion.id, { title: questionTitle, content: questionContent, outcome: courseOutcome });
    } else {
      // Add new question
      const newQuestion = {
        id: Math.max(...questions.map(q => q.id)) + 1, // Simple ID generation
        title: questionTitle,
        course: 'CS201', // Placeholder, would be selected via dropdown/modal
        outcome: courseOutcome,
        status: 'Pending',
        lastEdited: new Date().toISOString().split('T')[0],
        content: questionContent,
      };
      setQuestions([...questions, newQuestion]);
      console.log('New Question Added:', newQuestion);
    }
    // Reset form
    setQuestionTitle('');
    setQuestionContent('');
    setCourseOutcome('');
    setEditingQuestion(null);
    setShowQuestionForm(false);
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setQuestionTitle(question.title);
    setQuestionContent(question.content);
    setCourseOutcome(question.outcome);
    setShowQuestionForm(true);
  };

  const handleDelete = (question) => {
    if (window.confirm(`Are you sure you want to delete question "${question.title}"?`)) {
      setQuestions(questions.filter(q => q.id !== question.id));
      console.log('Delete question:', question.id);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Title', accessor: 'title' },
    { header: 'Course', accessor: 'course' },
    { header: 'Outcome', accessor: 'outcome' },
    { header: 'Status', accessor: 'status', render: (row) => (
        <span className={`status-badge status-${row.status.toLowerCase()}`}>
          {row.status}
        </span>
      )
    },
    { header: 'Last Edited', accessor: 'lastEdited' },
  ];

  const actions = [
    { label: '', icon: faEdit, variant: 'secondary', handler: handleEdit },
    { label: '', icon: faTrashAlt, variant: 'error', handler: handleDelete },
  ];

  return (
    <MainLayout role="instructor" username={instructorName}>
      <div className="instructor-my-questions-page">
        <h2>My Questions</h2>

        <div className="page-actions-header">
          <Button variant="primary" onClick={() => { setShowQuestionForm(true); setEditingQuestion(null); setQuestionTitle(''); setQuestionContent(''); setCourseOutcome(''); }}>
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
            Create New Question
          </Button>
        </div>

        {showQuestionForm && (
          <div className="question-form-section card">
            <h3>{editingQuestion ? 'Edit Question' : 'Create New Question'}</h3>
            <form onSubmit={handleAddEditQuestion}>
              <div className="form-group">
                <label htmlFor="questionTitle">Question Title</label>
                <input
                  type="text"
                  id="questionTitle"
                  className="form-control"
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                  placeholder="e.g., Explain Big O Notation"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="courseOutcome">Course Outcome (CO)</label>
                <select
                  id="courseOutcome"
                  className="form-control"
                  value={courseOutcome}
                  onChange={(e) => setCourseOutcome(e.target.value)}
                  required
                >
                  <option value="">Select CO</option>
                  {courseOutcomes.map(co => (
                    <option key={co} value={co}>{co}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Question Content</label>
                <QuestionEditor initialData={questionContent} onChange={handleEditorChange} />
              </div>

              <div className="form-actions d-flex gap-md">
                <Button variant="primary" type="submit">
                  {editingQuestion ? 'Update Question' : 'Save Question'}
                </Button>
                <Button variant="secondary" onClick={() => setShowQuestionForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="my-questions-list-section card">
          <h3>My Question Bank</h3>
          <Table data={questions} columns={columns} actions={actions} />
        </div>
      </div>
    </MainLayout>
  );
};

export default InstructorMyQuestions;