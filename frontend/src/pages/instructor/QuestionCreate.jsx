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
  const [isUploading, setIsUploading] = useState(false);

  // Data states
  const [courses, setCourses] = useState([]);
  const [papers, setPapers] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  
  // Form state
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedPaper, setSelectedPaper] = useState('');
  const [selectedCO, setSelectedCO] = useState('');
  const [marks, setMarks] = useState('');
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

  // CKEditor initialization with better error handling
  useEffect(() => {
    const initEditor = async () => {
      if (editorRef.current && !editor && !isInitializedRef.current) {
        isInitializedRef.current = true;
        
        try {
          const ClassicEditor = (await import('@ckeditor/ckeditor5-build-classic')).default;
          
          let editorInstance;
          try {
            editorInstance = await ClassicEditor.create(editorRef.current, {
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
          } catch (createError) {
            console.error('Failed to create CKEditor instance:', createError);
            setMessage({ type: 'error', text: 'Editor failed to load. Please refresh the page.' });
            isInitializedRef.current = false;
            return;
          }

          // Setup upload adapter with tracking
          const fileRepository = editorInstance.plugins.get('FileRepository');
          
          fileRepository.createUploadAdapter = (loader) => {
            const baseUrl = process.env.REACT_APP_API_URL || '';
            let uploadUrl;
            
            if (baseUrl.endsWith('/api')) {
              uploadUrl = `${baseUrl}/uploads`;
            } else if (!baseUrl) {
              uploadUrl = '/api/uploads';
            } else {
              uploadUrl = `${baseUrl}/api/uploads`;
            }
            
            console.log('Creating upload adapter for CKEditor');
            
            return {
              upload: () => {
                return loader.file.then(file => {
                  console.log('Starting upload for:', file.name);
                  setIsUploading(true);
                  
                  return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', uploadUrl, true);
                    xhr.responseType = 'json';
                    xhr.setRequestHeader('Accept', 'application/json');
                    
                    const token = localStorage.getItem('token');
                    if (token) {
                      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    }
                    
                    xhr.addEventListener('load', () => {
                      console.log('Upload completed, status:', xhr.status);
                      setIsUploading(false);
                      
                      if (xhr.status === 201) {
                        const response = xhr.response;
                        console.log('Upload successful, URL:', response?.url);
                        resolve({ default: response?.url });
                      } else {
                        reject('Upload failed');
                      }
                    });
                    
                    xhr.addEventListener('error', () => {
                      console.error('Upload error');
                      setIsUploading(false);
                      reject('Upload failed');
                    });
                    
                    const data = new FormData();
                    data.append('file', file);
                    xhr.send(data);
                  });
                });
              },
              
              abort: () => {
                console.log('Upload aborted');
                setIsUploading(false);
              }
            };
          };

          editorInstance.model.document.on('change:data', () => {
            setContentHtml(editorInstance.getData());
          });

          setEditor(editorInstance);
          
        } catch (error) {
          console.error('Error loading CKEditor module:', error);
          setMessage({ type: 'error', text: 'Failed to load editor. Try refreshing.' });
          isInitializedRef.current = false;
        }
      }
    };

    initEditor();

    return () => {
      if (editor) {
        try {
          editor.destroy();
        } catch (destroyError) {
          console.warn('Error destroying editor:', destroyError);
        }
        setEditor(null);
        isInitializedRef.current = false;
      }
    };
  }, [editor]);

  // Safe way to clear editor content
  const clearEditorContent = () => {
    if (editor) {
      // Wait a bit to avoid race conditions
      setTimeout(() => {
        if (editor && editor.setData) {
          try {
            editor.setData('');
          } catch (error) {
            console.warn('Error clearing editor:', error);
            // Fallback: create new editor instance
            if (editorRef.current) {
              editorRef.current.innerHTML = '';
            }
          }
        }
      }, 100);
    }
    setContentHtml('');
  };

  // Refresh button handler
  const handleRefresh = () => {
    // Reset everything
    setSelectedCourse('');
    setSelectedPaper('');
    setSelectedCO('');
    setMarks('');
    clearEditorContent();
    setMessage({ type: '', text: '' });
    
    // Reload courses
    loadCourses();
  };

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

    // Check if images are still uploading
    if (isUploading) {
      setMessage({ 
        type: 'error', 
        text: 'Please wait for image uploads to complete before submitting' 
      });
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
        text: 'Question created successfully! You can create another question.' 
      });
      
      // Reset only the question content and marks, keep course/paper/CO selected
      setMarks('');
      clearEditorContent();
      
    } catch (error) {
      console.error('Create question error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || 'Failed to create question' 
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
        <div className="header-content">
          <div>
            <h1>Create New Question</h1>
            <p>Select course and paper to create a question</p>
          </div>
          <button 
            type="button" 
            onClick={handleRefresh}
            className="btn-refresh"
            title="Refresh form"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {isUploading && (
        <div className="upload-status">
          <div className="uploading-indicator">
            <span className="spinner"></span>
            <span>Uploading image(s)... Please wait before submitting</span>
          </div>
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
          <div className="editor-container" style={{ height: '400px' }}>
            <div ref={editorRef} style={{ height: '100%' }}></div>
          </div>
          {isUploading && (
            <div className="upload-hint">
              <small>⏳ Image upload in progress. Please wait...</small>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="btn-secondary">
            Back to Questions
          </button>
          <button 
            type="submit" 
            disabled={isLoading || !selectedPaper || isUploading} 
            className="btn-primary"
          >
            {isLoading ? 'Creating...' : isUploading ? 'Waiting for uploads...' : 'Create Question'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionCreatePage;