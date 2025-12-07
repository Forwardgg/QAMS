// frontend/src/pages/instructor/QuestionCreate.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import questionAPI from '../../api/question.api';
import courseAPI from '../../api/course.api';
import questionPaperAPI from '../../api/questionPaper.api';
import coAPI from '../../api/co.api';
import { setupUploadAdapter } from '../../utils/UploadAdapter';
import './QuestionCreate.css';

const QuestionCreatePage = () => {
  const navigate = useNavigate();
  const editorRef = useRef();
  const isInitializedRef = useRef(false);
  const [editor, setEditor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Data states
  const [courses, setCourses] = useState([]);
  const [papers, setPapers] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  
  // Form state
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedPaper, setSelectedPaper] = useState('');
  const [selectedCO, setSelectedCO] = useState('');
  const [marks, setMarks] = useState(''); // NEW: Add marks state
  const [content_html, setContentHtml] = useState('');

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Load papers when course changes
  useEffect(() => {
    if (selectedCourse) {
      loadPapers(selectedCourse);
      loadCourseOutcomes(selectedCourse);
    } else {
      setPapers([]);
      setCourseOutcomes([]);
      setSelectedPaper('');
      setSelectedCO('');
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const response = await courseAPI.getAll();
      // Handle different response structures
      if (response.rows) {
        setCourses(response.rows);
      } else if (Array.isArray(response)) {
        setCourses(response);
      } else if (response.data) {
        setCourses(response.data.rows || response.data);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setMessage({ type: 'error', text: 'Failed to load courses' });
    }
  };

  const loadPapers = async (courseCode) => {
    try {
      const response = await questionPaperAPI.getByCourse(courseCode);
      // Handle different response structures
      if (Array.isArray(response)) {
        setPapers(response);
      } else if (response.rows) {
        setPapers(response.rows);
      } else if (response.data) {
        setPapers(response.data.rows || response.data);
      } else {
        setPapers([]);
      }
    } catch (error) {
      console.error('Error loading papers:', error);
      setMessage({ type: 'error', text: 'Failed to load papers' });
    }
  };

  const loadCourseOutcomes = async (courseCode) => {
    try {
      const response = await coAPI.getByCourseCode(courseCode);
      // Handle different response structures
      if (Array.isArray(response)) {
        setCourseOutcomes(response);
      } else if (response.rows) {
        setCourseOutcomes(response.rows);
      } else if (response.data) {
        setCourseOutcomes(response.data.rows || response.data);
      } else {
        setCourseOutcomes([]);
      }
    } catch (error) {
      console.error('Error loading course outcomes:', error);
      setMessage({ type: 'error', text: 'Failed to load course outcomes' });
    }
  };

  // CKEditor initialization
  useEffect(() => {
    const initEditor = async () => {
      if (editorRef.current && !editor && !isInitializedRef.current) {
        isInitializedRef.current = true;
        
        try {
          const ClassicEditor = (await import('@ckeditor/ckeditor5-build-classic')).default;
          
          const editorInstance = await ClassicEditor.create(editorRef.current, {
            toolbar: {
              items: [
                'heading', '|',
                'bold', 'italic', '|',
                'link', 'blockQuote', '|',
                'bulletedList', 'numberedList', '|',
                'insertTable', '|',
                'imageUpload', '|',
                'undo', 'redo'
              ]
            },
            image: {
              toolbar: [
                'imageTextAlternative',
                'toggleImageCaption',
                'imageStyle:inline',
                'imageStyle:block',
                'imageStyle:side'
              ]
            },
            table: {
              contentToolbar: [
                'tableColumn',
                'tableRow',
                'mergeTableCells'
              ]
            },
            link: {
              addTargetToExternalLinks: true,
              defaultProtocol: 'https://'
            },
            placeholder: 'Type your question here... You can insert images, tables, and format text.',
          });

          setupUploadAdapter(editorInstance, '/api/uploads');

          editorInstance.model.document.on('change:data', () => {
            setContentHtml(editorInstance.getData());
          });

          setEditor(editorInstance);
          
        } catch (error) {
          console.error('Error initializing CKEditor:', error);
          setMessage({ type: 'error', text: 'Failed to load editor' });
          isInitializedRef.current = false;
        }
      }
    };

    initEditor();

    return () => {
      if (editor) {
        editor.destroy();
        setEditor(null);
        isInitializedRef.current = false;
      }
    };
  }, [editor]);

  const safeEditorClear = () => {
  if (editor) {
    try {
      // IMPORTANT: Remove focus from editor first
      editor.editing.view.focus();
      
      // Wait a tiny bit before clearing
      setTimeout(() => {
        try {
          // Clear selection first
          editor.model.change(writer => {
            const selection = editor.model.document.selection;
            writer.setSelection(selection.getFirstPosition());
          });
          
          // Then clear data
          editor.setData('');
        } catch (err) {
          console.warn('Error in safe clear:', err);
        }
      }, 50);
    } catch (error) {
      console.warn('Safe editor clear failed:', error);
    }
  }
};

// Update the success part of handleSubmit:
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!selectedPaper) {
    setMessage({ type: 'error', text: 'Please select a paper' });
    return;
  }

  if (!content_html.trim()) {
    setMessage({ type: 'error', text: 'Question content is required' });
    return;
  }

  // Validate marks
  let marksValue = null;
  if (marks.trim() !== '') {
    const marksNum = parseInt(marks, 10);
    if (isNaN(marksNum) || marksNum < 0) {
      setMessage({ type: 'error', text: 'Marks must be a non-negative number' });
      return;
    }
    marksValue = marksNum;
  }

  setIsLoading(true);
  setMessage({ type: '', text: '' });

  try {
    const submissionData = {
      content_html,
      paper_id: parseInt(selectedPaper),
      co_id: selectedCO ? parseInt(selectedCO) : null,
      marks: marksValue
    };

    await questionAPI.create(submissionData);
    
    setMessage({ 
      type: 'success', 
      text: 'Question created successfully!' 
    });
    
    // FIX: Use safe clear for images
    setContentHtml('');
    setMarks('');
    
    // Don't clear CO if you want to keep it
    // setSelectedCO('');
    
    // Use safe clear instead of direct editor.setData('')
    safeEditorClear();
    
  } catch (error) {
    setMessage({ 
      type: 'error', 
      text: error.message || 'Failed to create question' 
    });
  } finally {
    setIsLoading(false);
  }
};

  const handleCancel = () => {
    navigate('/instructor/questions');
  };

  return (
    <div className="question-create-page">
      <div className="question-create-header">
        <h1>Create New Question</h1>
        <p>Select course and paper to create a question</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="question-create-form">
        <div className="form-section">
          <h3>Course & Paper Selection</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="course">Course *</label>
              <select
                id="course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                required
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course.course_id} value={course.code}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="paper">Paper *</label>
              <select
                id="paper"
                value={selectedPaper}
                onChange={(e) => setSelectedPaper(e.target.value)}
                required
                disabled={!selectedCourse}
              >
                <option value="">Select a paper</option>
                {papers.map(paper => (
                  <option key={paper.paper_id} value={paper.paper_id}>
                    {paper.title} ({paper.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="co">Course Outcome</label>
              <select
                id="co"
                value={selectedCO}
                onChange={(e) => setSelectedCO(e.target.value)}
                disabled={!selectedCourse}
              >
                <option value="">Select CO (optional)</option>
                {courseOutcomes.map(co => (
                  <option key={co.co_id} value={co.co_id}>
                    CO{co.co_number} - {co.description.substring(0, 50)}...
                  </option>
                ))}
              </select>
            </div>

            {/* NEW: Marks input field */}
            <div className="form-group">
              <label htmlFor="marks">Marks</label>
              <input
                type="number"
                id="marks"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                min="0"
                placeholder="Enter marks (optional)"
                step="1"
              />
              <small className="form-hint">Leave blank if not applicable</small>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Question Content *</h3>
          <div className="editor-container">
            <div ref={editorRef}></div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="btn-secondary">
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isLoading || !selectedPaper} 
            className="btn-primary"
          >
            {isLoading ? 'Creating...' : 'Create Question'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionCreatePage;