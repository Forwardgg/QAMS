
import React, { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [papers, setPapers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [moderationRecords, setModerationRecords] = useState([]);
  const [currentInstructor] = useState({ id: 1, name: 'Dr. John Smith' });

  // Mock data initialization
  useEffect(() => {
    // Sample courses for the instructor
    setCourses([
      {
        id: 1,
        name: 'Data Structures',
        code: 'CS201',
        ltp: '3-1-0',
        instructorId: 1,
        syllabus: 'Introduction to data structures and algorithms'
      },
      {
        id: 2,
        name: 'Algorithms',
        code: 'CS202',
        ltp: '3-0-2',
        instructorId: 1,
        syllabus: 'Advanced algorithm design and analysis'
      }
    ]);

    // Sample course outcomes
    setCourseOutcomes([
      { id: 1, courseId: 1, code: 'CO1', description: 'Understand basic data structures' },
      { id: 2, courseId: 1, code: 'CO2', description: 'Implement sorting algorithms' },
      { id: 3, courseId: 2, code: 'CO1', description: 'Analyze algorithm complexity' }
    ]);

    // Sample papers
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

    // Sample questions
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
      },
      {
        id: 2,
        type: 'mcq',
        text: 'Which data structure uses LIFO principle?',
        options: ['Queue', 'Stack', 'Array', 'Linked List'],
        correctAnswer: 1,
        marks: 5,
        coCode: 'CO2',
        courseId: 1,
        media: null,
        createdAt: '2024-01-15'
      }
    ]);
  }, []);

  // 1) Create CO
  const createCO = (coData) => {
    const newCO = {
      id: courseOutcomes.length + 1,
      ...coData
    };
    setCourseOutcomes([...courseOutcomes, newCO]);
  };

  // 2) Update CO
  const updateCO = (coId, coData) => {
    setCourseOutcomes(courseOutcomes.map(co =>
      co.id === coId ? { ...co, ...coData } : co
    ));
  };

  // 3) Delete CO
  const deleteCO = (coId) => {
    setCourseOutcomes(courseOutcomes.filter(co => co.id !== coId));
  };

  // 4) Create course
  const createCourse = (courseData) => {
    const newCourse = {
      id: courses.length + 1,
      instructorId: currentInstructor.id,
      ...courseData
    };
    setCourses([...courses, newCourse]);
  };

  // 5) Instructor → get own courses
  const getOwnCourses = () => {
    return courses.filter(course => course.instructorId === currentInstructor.id);
  };

  // 6) Update course (instructor only own)
  const updateCourse = (courseId, courseData) => {
    const course = courses.find(c => c.id === courseId);
    if (course && course.instructorId === currentInstructor.id) {
      setCourses(courses.map(c =>
        c.id === courseId ? { ...c, ...courseData } : c
      ));
    }
  };

  // 7) Delete course (instructor only own)
  const deleteCourse = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (course && course.instructorId === currentInstructor.id) {
      setCourses(courses.filter(c => c.id !== courseId));
    }
  };

  // 8) Get all moderation records for a specific paper
  const getPaperModerationRecords = (paperId) => {
    return moderationRecords.filter(record => record.paperId === paperId);
  };

  // 9) Bulk add questions to paper
  const bulkAddQuestionsToPaper = (paperId, questionIds) => {
    const paper = papers.find(p => p.id === paperId);
    if (paper) {
      const updatedQuestions = [...new Set([...paper.questions, ...questionIds])];
      setPapers(papers.map(p =>
        p.id === paperId ? { ...p, questions: updatedQuestions } : p
      ));
    }
  };

  // 10) Add single question to paper
  const addSingleQuestionToPaper = (paperId, questionId) => {
    const paper = papers.find(p => p.id === paperId);
    if (paper && !paper.questions.includes(questionId)) {
      setPapers(papers.map(p =>
        p.id === paperId ? { ...p, questions: [...p.questions, questionId] } : p
      ));
    }
  };

  // 11) Update marks/sequence/section of a mapping
  const updateQuestionMapping = (paperId, questionId, mappingData) => {
    // This would typically update the paper-question mapping
    console.log('Updating mapping:', { paperId, questionId, mappingData });
  };

  // 12) Reorder all questions in a paper
  const reorderPaperQuestions = (paperId, newQuestionOrder) => {
    setPapers(papers.map(p =>
      p.id === paperId ? { ...p, questions: newQuestionOrder } : p
    ));
  };

  // 13) Remove a question from a paper
  const removeQuestionFromPaper = (paperId, questionId) => {
    const paper = papers.find(p => p.id === paperId);
    if (paper) {
      setPapers(papers.map(p =>
        p.id === paperId ? {
          ...p,
          questions: p.questions.filter(qId => qId !== questionId)
        } : p
      ));
    }
  };

  // 14) Get all question moderation records for a specific paper
  const getQuestionModerationRecordsForPaper = (paperId) => {
    return moderationRecords.filter(record => record.paperId === paperId && record.type === 'question');
  };

  // 15) Get all moderation records for a single question
  const getQuestionModerationRecords = (questionId) => {
    return moderationRecords.filter(record => record.questionId === questionId);
  };

  // 16) Create paper
  const createPaper = (paperData) => {
    const newPaper = {
      id: papers.length + 1,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      questions: [],
      ...paperData
    };
    setPapers([...papers, newPaper]);
  };

  // 17) Update paper
  const updatePaper = (paperId, paperData) => {
    setPapers(papers.map(p =>
      p.id === paperId ? { ...p, ...paperData } : p
    ));
  };

  // 18) Delete paper
  const deletePaper = (paperId) => {
    setPapers(papers.filter(p => p.id !== paperId));
  };

  // 19) Submit paper
  const submitPaper = (paperId) => {
    setPapers(papers.map(p =>
      p.id === paperId ? { ...p, status: 'submitted' } : p
    ));
    alert('Paper submitted for moderation!');
  };

  // 20) Update question (content, CO, options, media)
  const updateQuestion = (questionId, questionData) => {
    setQuestions(questions.map(q =>
      q.id === questionId ? { ...q, ...questionData } : q
    ));
  };

  // 21) Soft delete question
  const softDeleteQuestion = (questionId) => {
    setQuestions(questions.map(q =>
      q.id === questionId ? { ...q, status: 'deleted' } : q
    ));
  };

  // 22) Add subjective question (with optional media)
  const addSubjectiveQuestion = (questionData) => {
    const newQuestion = {
      id: questions.length + 1,
      type: 'subjective',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      ...questionData
    };
    setQuestions([...questions, newQuestion]);
  };

  // 23) Add MCQ question (with options + optional media)
  const addMCQQuestion = (questionData) => {
    const newQuestion = {
      id: questions.length + 1,
      type: 'mcq',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      ...questionData
    };
    setQuestions([...questions, newQuestion]);
  };

  return (
    <div className="instructor-dashboard">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <h2>Instructor Panel</h2>
        <div className="instructor-info">
          <p>Welcome, <strong>{currentInstructor.name}</strong></p>
        </div>
        <nav>
          <button
            onClick={() => setActiveSection('dashboard')}
            className={activeSection === 'dashboard' ? 'active' : ''}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveSection('courses')}
            className={activeSection === 'courses' ? 'active' : ''}
          >
            My Courses
          </button>
          <button
            onClick={() => setActiveSection('course-outcomes')}
            className={activeSection === 'course-outcomes' ? 'active' : ''}
          >
            Course Outcomes
          </button>
          <button
            onClick={() => setActiveSection('question-bank')}
            className={activeSection === 'question-bank' ? 'active' : ''}
          >
            Question Bank
          </button>
          <button
            onClick={() => setActiveSection('papers')}
            className={activeSection === 'papers' ? 'active' : ''}
          >
            Question Papers
          </button>
          <button
            onClick={() => setActiveSection('moderation')}
            className={activeSection === 'moderation' ? 'active' : ''}
          >
            Moderation
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <InstructorDashboardSection
            coursesCount={getOwnCourses().length}
            papersCount={papers.length}
            questionsCount={questions.length}
          />
        )}

        {/* Courses Section */}
        {activeSection === 'courses' && (
          <CoursesManagement
            courses={getOwnCourses()}
            onCreateCourse={createCourse}
            onUpdateCourse={updateCourse}
            onDeleteCourse={deleteCourse}
          />
        )}

        {/* Course Outcomes Section */}
        {activeSection === 'course-outcomes' && (
          <CourseOutcomesManagement
            courses={getOwnCourses()}
            courseOutcomes={courseOutcomes}
            onCreateCO={createCO}
            onUpdateCO={updateCO}
            onDeleteCO={deleteCO}
          />
        )}

        {/* Question Bank Section */}
        {activeSection === 'question-bank' && (
          <QuestionBankManagement
            questions={questions.filter(q => q.status !== 'deleted')}
            courses={getOwnCourses()}
            courseOutcomes={courseOutcomes}
            onAddSubjectiveQuestion={addSubjectiveQuestion}
            onAddMCQQuestion={addMCQQuestion}
            onUpdateQuestion={updateQuestion}
            onSoftDeleteQuestion={softDeleteQuestion}
          />
        )}

        {/* Papers Section */}
        {activeSection === 'papers' && (
          <PapersManagement
            papers={papers}
            courses={getOwnCourses()}
            questions={questions.filter(q => q.status !== 'deleted')}
            courseOutcomes={courseOutcomes}
            onCreatePaper={createPaper}
            onUpdatePaper={updatePaper}
            onDeletePaper={deletePaper}
            onSubmitPaper={submitPaper}
            onBulkAddQuestions={bulkAddQuestionsToPaper}
            onAddSingleQuestion={addSingleQuestionToPaper}
            onRemoveQuestion={removeQuestionFromPaper}
            onReorderQuestions={reorderPaperQuestions}
            onUpdateQuestionMapping={updateQuestionMapping}
          />
        )}

        {/* Moderation Section */}
        {activeSection === 'moderation' && (
          <ModerationSection
            papers={papers}
            moderationRecords={moderationRecords}
            getPaperModerationRecords={getPaperModerationRecords}
            getQuestionModerationRecords={getQuestionModerationRecords}
            getQuestionModerationRecordsForPaper={getQuestionModerationRecordsForPaper}
          />
        )}
      </div>
    </div>
  );
};

// Instructor Dashboard Component
const InstructorDashboardSection = ({ coursesCount, papersCount, questionsCount }) => (
  <div className="section">
    <h1>Instructor Dashboard</h1>
    <div className="stats-grid">
      <div className="stat-card courses">
        <h3>My Courses</h3>
        <p>{coursesCount}</p>
        <span>Active courses</span>
      </div>
      <div className="stat-card papers">
        <h3>Question Papers</h3>
        <p>{papersCount}</p>
        <span>Created papers</span>
      </div>
      <div className="stat-card questions">
        <h3>Questions</h3>
        <p>{questionsCount}</p>
        <span>In question bank</span>
      </div>
    </div>
  </div>
);

// Courses Management Component
const CoursesManagement = ({ courses, onCreateCourse, onUpdateCourse, onDeleteCourse }) => {
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const handleCreateCourse = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const courseData = {
      name: formData.get('name'),
      code: formData.get('code'),
      ltp: formData.get('ltp'),
      syllabus: formData.get('syllabus')
    };
    onCreateCourse(courseData);
    setShowCourseForm(false);
    e.target.reset();
  };

  return (
    <div className="section">
      <div className="section-header">
        <h1>My Courses</h1>
        <button onClick={() => setShowCourseForm(true)}>Create New Course</button>
      </div>

      {showCourseForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create New Course</h3>
            <form onSubmit={handleCreateCourse}>
              <input type="text" name="name" placeholder="Course Name" required />
              <input type="text" name="code" placeholder="Course Code" required />
              <input type="text" name="ltp" placeholder="L-T-P (e.g., 3-1-0)" required />
              <textarea name="syllabus" placeholder="Course Syllabus" rows="4" />
              <div className="form-actions">
                <button type="submit">Create Course</button>
                <button type="button" onClick={() => setShowCourseForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="courses-grid">
        {courses.map(course => (
          <div key={course.id} className="course-card">
            <div className="course-header">
              <h3>{course.code} - {course.name}</h3>
              <span className="ltp-badge">L-T-P: {course.ltp}</span>
            </div>
            <p className="syllabus">{course.syllabus}</p>
            <div className="course-actions">
  <button className="edit-btn" onClick={() => setEditingCourse(course)}>
    Edit
  </button>
  <button className="delete-btn" onClick={() => onDeleteCourse(course.id)}>
    Delete
  </button>
</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Course Outcomes Management Component
const CourseOutcomesManagement = ({ courses, courseOutcomes, onCreateCO, onUpdateCO, onDeleteCO }) => {
  const [showCOForm, setShowCOForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');

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
    <div className="section">
      <div className="section-header">
        <h1>Course Outcomes Management</h1>
        <button onClick={() => setShowCOForm(true)}>Create New CO</button>
      </div>

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

      <div className="co-management">
        {courses.map(course => {
          const courseCOs = courseOutcomes.filter(co => co.courseId === course.id);
          return (
            <div key={course.id} className="course-co-section">
              <h3>{course.code} - {course.name}</h3>
              <div className="co-list">
                {courseCOs.map(co => (
                  <div key={co.id} className="co-item">
                    <div className="co-content">
                      <strong>{co.code}:</strong> {co.description}
                    </div>
                    <div className="co-actions">
  <button className="edit-btn">Edit</button>
  <button className="delete-btn" onClick={() => onDeleteCO(co.id)}>
    Delete
  </button>
</div>
                  </div>
                ))}
                {courseCOs.length === 0 && (
                  <p className="no-co">No course outcomes defined yet.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Question Bank Management Component
const QuestionBankManagement = ({
  questions,
  courses,
  courseOutcomes,
  onAddSubjectiveQuestion,
  onAddMCQQuestion,
  onUpdateQuestion,
  onSoftDeleteQuestion
}) => {
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionType, setQuestionType] = useState('subjective');
  const [editorData, setEditorData] = useState('');

  const handleAddSubjectiveQuestion = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const questionData = {
      text: editorData,
      marks: parseInt(formData.get('marks')),
      coCode: formData.get('coCode'),
      courseId: parseInt(formData.get('courseId')),
      media: formData.get('media') || null
    };
    onAddSubjectiveQuestion(questionData);
    setShowQuestionForm(false);
    setEditorData('');
    e.target.reset();
  };

  const handleAddMCQQuestion = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const questionData = {
      text: editorData,
      options: [
        formData.get('option1'),
        formData.get('option2'),
        formData.get('option3'),
        formData.get('option4')
      ],
      correctAnswer: parseInt(formData.get('correctAnswer')),
      marks: parseInt(formData.get('marks')),
      coCode: formData.get('coCode'),
      courseId: parseInt(formData.get('courseId')),
      media: formData.get('media') || null
    };
    onAddMCQQuestion(questionData);
    setShowQuestionForm(false);
    setEditorData('');
    e.target.reset();
  };

  return (
    <div className="section">
      <div className="section-header">
        <h1>Question Bank</h1>
        <button onClick={() => setShowQuestionForm(true)}>Add New Question</button>
      </div>

      {showQuestionForm && (
        <div className="modal large-modal">
          <div className="modal-content">
            <h3>Add New Question</h3>
            <select onChange={(e) => setQuestionType(e.target.value)} value={questionType}>
              <option value="subjective">Subjective Question</option>
              <option value="mcq">MCQ Question</option>
            </select>

            <form onSubmit={questionType === 'subjective' ? handleAddSubjectiveQuestion : handleAddMCQQuestion}>
              <div className="form-group">
                <label>Question Text:</label>
                <CKEditor
                  editor={ClassicEditor}
                  data={editorData}
                  onChange={(event, editor) => {
                    const data = editor.getData();
                    setEditorData(data);
                  }}
                />
              </div>

              <div className="form-row">
                <select name="courseId" required>
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>

                <select name="coCode" required>
                  <option value="">Select CO</option>
                  {courseOutcomes.map(co => (
                    <option key={co.id} value={co.code}>
                      {co.code}
                    </option>
                  ))}
                </select>

                <input type="number" name="marks" placeholder="Marks" required />
              </div>

              {questionType === 'mcq' && (
                <div className="mcq-options">
                  <h4>Options:</h4>
                  <input type="text" name="option1" placeholder="Option 1" required />
                  <input type="text" name="option2" placeholder="Option 2" required />
                  <input type="text" name="option3" placeholder="Option 3" required />
                  <input type="text" name="option4" placeholder="Option 4" required />

                  <select name="correctAnswer" required>
                    <option value="">Correct Answer</option>
                    <option value="0">Option 1</option>
                    <option value="1">Option 2</option>
                    <option value="2">Option 3</option>
                    <option value="3">Option 4</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Upload Media (Optional):</label>
                <input type="file" name="media" accept="image/*,video/*,.pdf" />
              </div>

              <div className="form-actions">
                <button type="submit">Add Question</button>
                <button type="button" onClick={() => setShowQuestionForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="questions-grid">
        {questions.map(question => (
          <div key={question.id} className="question-card">
            <div className="question-header">
              <span className={`question-type ${question.type}`}>
                {question.type.toUpperCase()}
              </span>
              <span className="co-badge">{question.coCode}</span>
            </div>
            <div
              className="question-content"
              dangerouslySetInnerHTML={{ __html: question.text }}
            />
            {question.type === 'mcq' && (
              <div className="mcq-options-preview">
                <h5>Options:</h5>
                {question.options.map((option, index) => (
                  <p key={index} className={index === question.correctAnswer ? 'correct-option' : ''}>
                    {String.fromCharCode(65 + index)}. {option}
                  </p>
                ))}
              </div>
            )}
            <div className="question-footer">
              <span>Marks: {question.marks}</span>
           <div className="question-actions">
  <button className="edit-btn" onClick={() => onUpdateQuestion(question.id, { text: 'Updated question' })}>
    Edit
  </button>
  <button className="delete-btn" onClick={() => onSoftDeleteQuestion(question.id)}>
    Delete
  </button>
</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Papers Management Component
const PapersManagement = ({
  papers,
  courses,
  questions,
  courseOutcomes,
  onCreatePaper,
  onUpdatePaper,
  onDeletePaper,
  onSubmitPaper,
  onBulkAddQuestions,
  onAddSingleQuestion,
  onRemoveQuestion,
  onReorderQuestions,
  onUpdateQuestionMapping
}) => {
  const [showPaperForm, setShowPaperForm] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);

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
        <h1>Question Papers</h1>
        <button onClick={() => setShowPaperForm(true)}>Create New Paper</button>
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

      <div className="papers-list">
        {papers.map(paper => {
          const course = courses.find(c => c.id === paper.courseId);
          const paperQuestions = questions.filter(q => paper.questions.includes(q.id));

          return (
            <div key={paper.id} className="paper-card">
              <div className="paper-header">
                <div>
                  <h3>{paper.title}</h3>
                  <p>{course?.code} - {course?.name} | {paper.type} | {paper.status}</p>
                </div>
               <div className="paper-actions">
  <button onClick={() => setSelectedPaper(selectedPaper === paper.id ? null : paper.id)}>
    {selectedPaper === paper.id ? 'Hide Details' : 'Show Details'}
  </button>
  <button onClick={() => onSubmitPaper(paper.id)}>Submit</button>
  <button 
    className="paper-delete-btn"
    onClick={() => onDeletePaper(paper.id)}
  >
    Delete
  </button>
</div>
              </div>

              {selectedPaper === paper.id && (
                <div className="paper-details">
                  <div className="questions-management">
                    <div className="management-header">
                      <h4>Questions in this Paper</h4>
                      <button onClick={() => setShowBulkAdd(true)}>Bulk Add Questions</button>
                    </div>

                    {showBulkAdd && (
                      <BulkAddQuestions
                        paper={paper}
                        questions={questions.filter(q => !paper.questions.includes(q.id))}
                        onBulkAdd={onBulkAddQuestions}
                        onClose={() => setShowBulkAdd(false)}
                      />
                    )}

                    <div className="paper-questions-list">
                      {paperQuestions.map(question => (
                        <div key={question.id} className="paper-question-item">
                          <div className="question-preview">
                            <div dangerouslySetInnerHTML={{ __html: question.text }} />
                            <span className="marks-badge">{question.marks} marks</span>
                          </div>
                          <div className="question-item-actions">
                            <button onClick={() => onRemoveQuestion(paper.id, question.id)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      {paperQuestions.length === 0 && (
                        <p className="no-questions">No questions added yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Bulk Add Questions Component
const BulkAddQuestions = ({ paper, questions, onBulkAdd, onClose }) => {
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleBulkAdd = () => {
    if (selectedQuestions.length > 0) {
      onBulkAdd(paper.id, selectedQuestions);
      onClose();
    }
  };

  return (
    <div className="bulk-add-modal">
      <div className="bulk-add-content">
        <h4>Select Questions to Add</h4>
        <div className="available-questions">
          {questions.map(question => (
            <div key={question.id} className="available-question">
              <label>
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(question.id)}
                  onChange={() => toggleQuestionSelection(question.id)}
                />
                <div
                  className="question-text-preview"
                  dangerouslySetInnerHTML={{ __html: question.text.substring(0, 100) + '...' }}
                />
                <span className="question-meta">{question.type} | {question.marks} marks</span>
              </label>
            </div>
          ))}
        </div>
        <div className="bulk-actions">
          <button onClick={handleBulkAdd} disabled={selectedQuestions.length === 0}>
            Add Selected ({selectedQuestions.length})
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// Moderation Section Component
const ModerationSection = ({
  papers,
  moderationRecords,
  getPaperModerationRecords,
  getQuestionModerationRecords,
  getQuestionModerationRecordsForPaper
}) => {
  return (
    <div className="section">
      <div className="section-header">
        <h1>Moderation Status</h1>
        <p>Track moderation progress of your papers and questions</p>
      </div>

      <div className="moderation-status">
        {papers.map(paper => {
          const paperRecords = getPaperModerationRecords(paper.id);
          const questionRecords = getQuestionModerationRecordsForPaper(paper.id);

          return (
            <div key={paper.id} className="moderation-paper-card">
              <h3>{paper.title}</h3>
              <div className="moderation-details">
                <div className="paper-moderation">
                  <h4>Paper Moderation:</h4>
                  {paperRecords.length > 0 ? (
                    paperRecords.map(record => (
                      <div key={record.id} className="moderation-record">
                        <span className={`status ${record.status}`}>{record.status}</span>
                        <span>Moderator: {record.moderatorName}</span>
                        <span>Date: {record.updatedAt}</span>
                      </div>
                    ))
                  ) : (
                    <p>No moderation records yet.</p>
                  )}
                </div>

                <div className="questions-moderation">
                  <h4>Questions Moderation:</h4>
                  {questionRecords.length > 0 ? (
                    questionRecords.map(record => (
                      <div key={record.id} className="moderation-record">
                        <span className={`status ${record.status}`}>{record.status}</span>
                        <span>Question ID: {record.questionId}</span>
                        <span>Moderator: {record.moderatorName}</span>
                      </div>
                    ))
                  ) : (
                    <p>No question moderation records yet.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InstructorDashboard;
