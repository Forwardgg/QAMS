
import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [papers, setPapers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [moderationRecords, setModerationRecords] = useState([]);

  // Mock data initialization
  useEffect(() => {
    // Initialize with sample data
    setUsers([
      { id: 1, name: 'John Doe', email: 'john@university.edu', role: 'instructor', status: 'active' },
      { id: 2, name: 'Jane Smith', email: 'jane@university.edu', role: 'moderator', status: 'active' },
      { id: 3, name: 'Dr. Sharma', email: 'sharma@university.edu', role: 'instructor', status: 'active' }
    ]);
    
    setCourses([
      { id: 1, name: 'Data Structures', code: 'CS201', ltp: '3-1-0', instructorId: 1 },
      { id: 2, name: 'Algorithms', code: 'CS202', ltp: '3-0-2', instructorId: 1 },
      { id: 3, name: 'Database Systems', code: 'CS203', ltp: '3-1-2', instructorId: 3 }
    ]);

    setCourseOutcomes([
      { id: 1, courseId: 1, code: 'CO1', description: 'Understand basic data structures' },
      { id: 2, courseId: 1, code: 'CO2', description: 'Implement sorting algorithms' },
      { id: 3, courseId: 2, code: 'CO1', description: 'Analyze algorithm complexity' }
    ]);

    setPapers([
      {
        id: 1,
        title: 'Data Structures Mid-term 2024',
        courseId: 1,
        courseName: 'Data Structures',
        type: 'sessional',
        status: 'draft',
        createdAt: '2024-01-15',
        questions: [1, 2]
      }
    ]);

    setQuestions([
      {
        id: 1,
        type: 'subjective',
        text: 'Explain the concept of binary search trees with examples.',
        marks: 10,
        coCode: 'CO1',
        courseId: 1,
        media: null,
        createdAt: '2024-01-15'
      }
    ]);
  }, []);

  // User Management Functions
  const createUser = (userData) => {
    const newUser = { 
      ...userData, 
      id: users.length + 1,
      status: 'active'
    };
    setUsers([...users, newUser]);
    alert('User created successfully!');
  };

  const updateUser = (userId, userData) => {
    setUsers(users.map(user => user.id === userId ? { ...user, ...userData } : user));
  };

  const toggleUserStatus = (userId, status) => {
    setUsers(users.map(user => user.id === userId ? { ...user, status } : user));
    alert(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully!`);
  };

  // Course Management Functions - FIXED
  const createCourse = (courseData) => {
    const newCourse = { 
      ...courseData, 
      id: courses.length + 1,
      instructorId: 1 // Default instructor for demo
    };
    setCourses([...courses, newCourse]);
    alert('Course created successfully!');
  };

  const deleteCourse = (courseId) => {
    setCourses(courses.filter(course => course.id !== courseId));
    alert('Course deleted successfully!');
  };

  // Course Outcome Functions - FIXED
  const createCO = (coData) => {
    const newCO = { 
      ...coData, 
      id: courseOutcomes.length + 1
    };
    setCourseOutcomes([...courseOutcomes, newCO]);
    alert('Course Outcome created successfully!');
  };

  const updateCO = (coId, coData) => {
    setCourseOutcomes(courseOutcomes.map(co => co.id === coId ? { ...co, ...coData } : co));
  };

  const deleteCO = (coId) => {
    setCourseOutcomes(courseOutcomes.filter(co => co.id !== coId));
    alert('Course Outcome deleted successfully!');
  };

  // Paper Management Functions
  const createPaper = (paperData) => {
    const newPaper = { 
      ...paperData, 
      id: papers.length + 1,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      questions: []
    };
    setPapers([...papers, newPaper]);
    alert('Paper created successfully!');
  };

  const updatePaper = (paperId, paperData) => {
    setPapers(papers.map(paper => paper.id === paperId ? { ...paper, ...paperData } : paper));
  };

  const deletePaper = (paperId) => {
    setPapers(papers.filter(paper => paper.id !== paperId));
    alert('Paper deleted successfully!');
  };

  // Question Management Functions
  const addQuestion = (questionData) => {
    const newQuestion = { ...questionData, id: questions.length + 1 };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (questionId, questionData) => {
    setQuestions(questions.map(question => 
      question.id === questionId ? { ...question, ...questionData } : question
    ));
  };

  const deleteQuestion = (questionId) => {
    setQuestions(questions.filter(question => question.id !== questionId));
  };

  // Statistics
  const getUserCount = () => users.length;
  const getUserCountByRole = (role) => users.filter(user => user.role === role).length;
  const getTotalInstructors = () => getUserCountByRole('instructor');

  return (
    <div className="admin-dashboard">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <h2>Admin Panel</h2>
        <nav>
          <button 
            onClick={() => setActiveSection('dashboard')}
            className={activeSection === 'dashboard' ? 'active' : ''}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveSection('users')}
            className={activeSection === 'users' ? 'active' : ''}
          >
            User Management
          </button>
          <button 
            onClick={() => setActiveSection('courses')}
            className={activeSection === 'courses' ? 'active' : ''}
          >
            Course Management
          </button>
          <button 
            onClick={() => setActiveSection('papers')}
            className={activeSection === 'papers' ? 'active' : ''}
          >
            Paper Management
          </button>
          <button 
            onClick={() => setActiveSection('questions')}
            className={activeSection === 'questions' ? 'active' : ''}
          >
            Question Bank
          </button>
          <button 
            onClick={() => setActiveSection('moderation')}
            className={activeSection === 'moderation' ? 'active' : ''}
          >
            Moderation
          </button>
          <button 
            onClick={() => setActiveSection('logs')}
            className={activeSection === 'logs' ? 'active' : ''}
          >
            System Logs
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <DashboardSection 
            userCount={getUserCount()}
            instructorCount={getTotalInstructors()}
            courseCount={courses.length}
            paperCount={papers.length}
          />
        )}

        {/* User Management Section */}
        {activeSection === 'users' && (
          <UserManagement 
            users={users}
            onCreateUser={createUser}
            onUpdateUser={updateUser}
            onToggleUserStatus={toggleUserStatus}
          />
        )}

        {/* Course Management Section */}
        {activeSection === 'courses' && (
          <CourseManagement 
            courses={courses}
            courseOutcomes={courseOutcomes}
            onCreateCourse={createCourse}
            onDeleteCourse={deleteCourse}
            onCreateCO={createCO}
            onUpdateCO={updateCO}
            onDeleteCO={deleteCO}
          />
        )}

        {/* Paper Management Section */}
        {activeSection === 'papers' && (
          <PaperManagement 
            papers={papers}
            courses={courses}
            onCreatePaper={createPaper}
            onUpdatePaper={updatePaper}
            onDeletePaper={deletePaper}
          />
        )}

        {/* Question Management Section */}
        {activeSection === 'questions' && (
          <QuestionManagement 
            questions={questions}
            courses={courses}
            papers={papers}
            courseOutcomes={courseOutcomes}
            onAddQuestion={addQuestion}
            onUpdateQuestion={updateQuestion}
            onDeleteQuestion={deleteQuestion}
          />
        )}

        {/* Moderation Section */}
        {activeSection === 'moderation' && (
          <ModerationManagement 
            moderationRecords={moderationRecords}
            onApproveReject={(recordId, action) => console.log(`Record ${recordId} ${action}`)}
          />
        )}

        {/* System Logs Section */}
        {activeSection === 'logs' && (
          <SystemLogs 
            logs={logs}
            onDeleteLog={(logId) => console.log(`Delete log ${logId}`)}
          />
        )}
      </div>
    </div>
  );
};

// Dashboard Component
const DashboardSection = ({ userCount, instructorCount, courseCount, paperCount }) => (
  <div className="section">
    <h1>Admin Dashboard</h1>
    <div className="stats-grid">
      <div className="stat-card">
        <h3>Total Users</h3>
        <p>{userCount}</p>
      </div>
      <div className="stat-card">
        <h3>Instructors</h3>
        <p>{instructorCount}</p>
      </div>
      <div className="stat-card">
        <h3>Courses</h3>
        <p>{courseCount}</p>
      </div>
      <div className="stat-card">
        <h3>Papers</h3>
        <p>{paperCount}</p>
      </div>
    </div>
  </div>
);

// User Management Component
const UserManagement = ({ users, onCreateUser, onUpdateUser, onToggleUserStatus }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const handleCreateUser = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role')
    };
    onCreateUser(userData);
    setShowCreateForm(false);
    e.target.reset();
  };

  return (
    <div className="section">
      <div className="section-header">
        <h1>User Management</h1>
        <button onClick={() => setShowCreateForm(true)}>Create User</button>
      </div>

      {showCreateForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create New User</h3>
            <form onSubmit={handleCreateUser}>
              <input type="text" name="name" placeholder="Full Name" required />
              <input type="email" name="email" placeholder="Email" required />
              <select name="role" required>
                <option value="">Select Role</option>
                <option value="instructor">Instructor</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              <div className="form-actions">
                <button type="submit">Create</button>
                <button type="button" onClick={() => setShowCreateForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-grid">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <h4>{user.name}</h4>
            <p>{user.email}</p>
            <p>Role: {user.role}</p>
            <p>Status: <span className={`status-${user.status}`}>{user.status}</span></p>
            <div className="user-actions">
              <button className="edit-btn" onClick={() => setEditingUser(user)}>Edit</button>
              {user.status === 'active' ? (
                <button className="delete-btn" onClick={() => onToggleUserStatus(user.id, 'inactive')}>Deactivate</button>
              ) : (
                <button className="edit-btn" onClick={() => onToggleUserStatus(user.id, 'active')}>Activate</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Course Management Component - FIXED
const CourseManagement = ({ courses, courseOutcomes, onCreateCourse, onDeleteCourse, onCreateCO, onUpdateCO, onDeleteCO }) => {
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showCOForm, setShowCOForm] = useState(false);

  const handleCreateCourse = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const courseData = {
      name: formData.get('name'),
      code: formData.get('code'),
      ltp: formData.get('ltp')
    };
    onCreateCourse(courseData);
    setShowCourseForm(false);
    e.target.reset();
  };

  const handleCreateCO = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const coData = {
      courseId: parseInt(formData.get('courseId')),
      code: formData.get('code'),
      description: formData.get('description')
    };
    onCreateCO(coData);
    setShowCOForm(false);
    e.target.reset();
  };

  return (
    <div className="section course-management">
      <div className="section-header">
        <h1>Course Management</h1>
        <div className="header-buttons">
          <button onClick={() => setShowCourseForm(true)}>Create Course</button>
          <button onClick={() => setShowCOForm(true)}>Create CO</button>
        </div>
      </div>

      {/* Create Course Modal */}
      {showCourseForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create New Course</h3>
            <form onSubmit={handleCreateCourse}>
              <input type="text" name="name" placeholder="Course Name" required />
              <input type="text" name="code" placeholder="Course Code" required />
              <input type="text" name="ltp" placeholder="L-T-P (e.g., 3-1-0)" required />
              <div className="form-actions">
                <button type="submit">Create Course</button>
                <button type="button" onClick={() => setShowCourseForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create CO Modal */}
      {showCOForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create Course Outcome</h3>
            <form onSubmit={handleCreateCO}>
              <select name="courseId" required>
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
              <input type="text" name="code" placeholder="CO Code (e.g., CO1)" required />
              <textarea name="description" placeholder="CO Description" rows="3" required />
              <div className="form-actions">
                <button type="submit">Create CO</button>
                <button type="button" onClick={() => setShowCOForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course List */}
      <div className="courses-list">
        <h3>Courses</h3>
        {courses && courses.length > 0 ? (
          courses.map(course => (
            <div key={course.id} className="course-item">
              <span>{course?.code || 'N/A'} - {course?.name || 'Unnamed Course'} (L-T-P: {course?.ltp || 'N/A'})</span>
              <div className="course-item-actions">
                <button className="edit-btn">Edit</button>
                <button className="delete-btn" onClick={() => onDeleteCourse(course.id)}>Delete</button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">No courses available</p>
        )}
      </div>

      {/* Course Outcomes List */}
      <div className="co-management">
        <h3>Course Outcomes</h3>
        {courses && courses.length > 0 ? (
          courses.map(course => {
            if (!course) return null;
            const courseCOs = courseOutcomes.filter(co => co.courseId === course.id);
            return (
              <div key={course.id} className="course-co-section">
                <h4>{course?.code || 'N/A'} - {course?.name || 'Unnamed Course'}</h4>
                <div className="co-list">
                  {courseCOs.map(co => (
                    <div key={co.id} className="co-item">
                      <div className="co-content">
                        <strong>{co?.code || 'CO'}:</strong> {co?.description || 'No description'}
                      </div>
                      <div className="co-actions">
                        <button className="edit-btn">Edit</button>
                        <button className="delete-btn" onClick={() => onDeleteCO(co.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                  {courseCOs.length === 0 && (
                    <p className="no-data">No course outcomes defined yet.</p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-data">No courses available to display outcomes</p>
        )}
      </div>
    </div>
  );
};

// Paper Management Component
const PaperManagement = ({ papers, courses, onCreatePaper, onUpdatePaper, onDeletePaper }) => {
  const [showPaperForm, setShowPaperForm] = useState(false);

  const handleCreatePaper = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const paperData = {
      title: formData.get('title'),
      courseId: parseInt(formData.get('courseId')),
      type: formData.get('type')
    };
    onCreatePaper(paperData);
    setShowPaperForm(false);
    e.target.reset();
  };

  return (
    <div className="section">
      <div className="section-header">
        <h1>Paper Management</h1>
        <button onClick={() => setShowPaperForm(true)}>Create Paper</button>
      </div>

      {showPaperForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create New Question Paper</h3>
            <form onSubmit={handleCreatePaper}>
              <input type="text" name="title" placeholder="Paper Title" required />
              <select name="courseId" required>
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
              <select name="type" required>
                <option value="">Select Paper Type</option>
                <option value="sessional">Sessional Test</option>
                <option value="midterm">Mid-term Test</option>
                <option value="endterm">End-term Test</option>
                <option value="lab">Laboratory Test</option>
              </select>
              <div className="form-actions">
                <button type="submit">Create Paper</button>
                <button type="button" onClick={() => setShowPaperForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="papers-grid">
        {papers.map(paper => {
          const course = courses.find(c => c.id === paper.courseId);
          return (
            <div key={paper.id} className="paper-card">
              <h4>{paper.title}</h4>
              <p>Course: {course?.code} - {course?.name}</p>
              <p>Type: {paper.type} | Status: {paper.status}</p>
              <div className="paper-actions">
                <button className="edit-btn">Edit</button>
                <button className="delete-btn" onClick={() => onDeletePaper(paper.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Question Management Component
const QuestionManagement = ({ questions, courses, papers, courseOutcomes, onAddQuestion, onUpdateQuestion, onDeleteQuestion }) => {
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  return (
    <div className="section">
      <div className="section-header">
        <h1>Question Bank</h1>
        <button onClick={() => setShowQuestionForm(true)}>Add Question</button>
      </div>

      <div className="questions-grid">
        {questions.map(question => {
          const course = courses.find(c => c.id === question.courseId);
          return (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <span className={`question-type ${question.type}`}>{question.type.toUpperCase()}</span>
                <span className="co-badge">{question.coCode}</span>
              </div>
              <div className="question-content">
                <p>{question.text}</p>
              </div>
              <div className="question-footer">
                <span>Course: {course?.code}</span>
                <span>Marks: {question.marks}</span>
                <div className="question-actions">
                  <button className="edit-btn" onClick={() => onUpdateQuestion(question.id, { text: 'Updated question' })}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => onDeleteQuestion(question.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Moderation Management Component
const ModerationManagement = ({ moderationRecords, onApproveReject }) => (
  <div className="section">
    <h1>Moderation Management</h1>
    <div className="moderation-list">
      {moderationRecords.length === 0 ? (
        <p className="no-data">No moderation records available</p>
      ) : (
        moderationRecords.map(record => (
          <div key={record.id} className="moderation-item">
            <p>Paper: {record.paperTitle}</p>
            <p>Status: {record.status}</p>
            <div className="moderation-actions">
              <button className="edit-btn" onClick={() => onApproveReject(record.id, 'approve')}>Approve</button>
              <button className="delete-btn" onClick={() => onApproveReject(record.id, 'reject')}>Reject</button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// System Logs Component
const SystemLogs = ({ logs, onDeleteLog }) => (
  <div className="section">
    <h1>System Logs</h1>
    <div className="logs-list">
      {logs.length === 0 ? (
        <p className="no-data">No system logs available</p>
      ) : (
        logs.map(log => (
          <div key={log.id} className="log-item">
            <p>{log.timestamp}: {log.action}</p>
            <button className="delete-btn" onClick={() => onDeleteLog(log.id)}>Delete</button>
          </div>
        ))
      )}
    </div>
  </div>
);

export default AdminDashboard;