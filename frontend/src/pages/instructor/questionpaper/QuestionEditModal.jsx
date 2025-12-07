import React, { useEffect, useRef, useState } from 'react';
import questionAPI from '../../../api/question.api';
import './QuestionEditModal.css';

export default function QuestionEditModal({ question = {}, onSave, onClose }) {
  const mountRef = useRef(null);
  const editorRef = useRef(null);
  const isInitRef = useRef(false);
  const changeHandlerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contentHtml, setContentHtml] = useState(question?.content_html || '');
  const [coId, setCoId] = useState(question?.co_id ?? '');
  const [marks, setMarks] = useState(question?.marks ?? '');
  const [coOptions, setCoOptions] = useState([]);
  const [isLoadingCOs, setIsLoadingCOs] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // NEW: Track upload status
  const [uploadQueue, setUploadQueue] = useState(0); // NEW: Track number of active uploads

  // Fetch COs for this paper's course when modal opens
  useEffect(() => {
    const fetchCOsForPaper = async () => {
      if (!question?.paper_id) {
        setCoOptions([]);
        return;
      }
      
      setIsLoadingCOs(true);
      try {
        const result = await questionAPI.getPaperCOs(question.paper_id);
        setCoOptions(result.cos || []);
      } catch (err) {
        console.error('Error fetching COs:', err);
        setCoOptions([]);
      } finally {
        setIsLoadingCOs(false);
      }
    };
    
    fetchCOsForPaper();
  }, [question?.paper_id]);

  // Keep local state when question prop changes
  useEffect(() => {
    setContentHtml(question?.content_html || '');
    setCoId(question?.co_id ?? '');
    setMarks(question?.marks ?? '');

    // If editor exists, update its content
    if (editorRef.current && typeof editorRef.current.setData === 'function') {
      try {
        const data = question?.content_html || '';
        if (editorRef.current.getData() !== data) {
          editorRef.current.setData(data);
        }
      } catch (err) {
        // ignore
      }
    }
  }, [question]);

  // CKEditor init with upload tracking
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mountRef.current || isInitRef.current || editorRef.current) return;

      isInitRef.current = true;

      try {
        const ClassicEditor = (await import('@ckeditor/ckeditor5-build-classic')).default;

        if (mountRef.current) mountRef.current.innerHTML = '';

        const inst = await ClassicEditor.create(mountRef.current, {
          toolbar: [
            'heading', '|',
            'bold', 'italic', '|',
            'link', 'blockQuote', '|',
            'bulletedList', 'numberedList', '|',
            'insertTable', '|',
            'imageUpload', '|',
            'undo', 'redo'
          ],
          image: {
            toolbar: [
              'imageTextAlternative', 'toggleImageCaption', 'imageStyle:inline', 'imageStyle:block', 'imageStyle:side'
            ]
          },
          table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'] },
          placeholder: 'Edit question content...'
        });

        // Enhanced upload adapter with upload tracking
        const fileRepository = inst.plugins.get('FileRepository');
        
        fileRepository.createUploadAdapter = (loader) => {
          const token = localStorage.getItem('token');
          const baseUrl = process.env.REACT_APP_API_URL || '';
          let uploadUrl;
          
          // Build correct upload URL
          if (baseUrl.includes('localhost') || baseUrl.startsWith('http')) {
            uploadUrl = `${baseUrl.replace(/\/api\/?$/, '')}/api/uploads`;
          } else if (!baseUrl) {
            uploadUrl = '/api/uploads';
          } else {
            uploadUrl = `${baseUrl}/api/uploads`;
          }
          
          console.log('CKEditor upload URL:', uploadUrl);
          
          return {
            upload: () => {
              // Increment upload queue when upload starts
              setUploadQueue(prev => prev + 1);
              setIsUploading(true);
              
              return loader.file.then(file => {
                return new Promise((resolve, reject) => {
                  const xhr = new XMLHttpRequest();
                  xhr.open('POST', uploadUrl, true);
                  xhr.responseType = 'json';
                  xhr.setRequestHeader('Accept', 'application/json');
                  
                  if (token) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                  }
                  
                  xhr.addEventListener('load', () => {
                    // Decrement upload queue when upload completes
                    setUploadQueue(prev => prev - 1);
                    
                    if (uploadQueue <= 1) {
                      setIsUploading(false);
                    }
                    
                    if (xhr.status === 201 || xhr.status === 200) {
                      const response = xhr.response;
                      if (response && response.url) {
                        resolve({ default: response.url });
                      } else {
                        reject('Upload succeeded but no URL returned');
                      }
                    } else {
                      reject(`Upload failed: ${xhr.status} ${xhr.statusText}`);
                    }
                  });
                  
                  xhr.addEventListener('error', () => {
                    // Decrement upload queue on error
                    setUploadQueue(prev => prev - 1);
                    if (uploadQueue <= 1) {
                      setIsUploading(false);
                    }
                    reject('Network error during upload');
                  });
                  
                  xhr.addEventListener('abort', () => {
                    // Decrement upload queue on abort
                    setUploadQueue(prev => prev - 1);
                    if (uploadQueue <= 1) {
                      setIsUploading(false);
                    }
                    reject('Upload cancelled');
                  });
                  
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('question_id', question?.question_id || '');
                  formData.append('paper_id', question?.paper_id || '');
                  
                  xhr.send(formData);
                });
              });
            },
            
            abort: () => {
              // Decrement upload queue on abort
              setUploadQueue(prev => Math.max(0, prev - 1));
              if (uploadQueue <= 1) {
                setIsUploading(false);
              }
            }
          };
        };

        const handler = () => {
          try {
            setContentHtml(inst.getData());
          } catch (_) {}
        };
        changeHandlerRef.current = handler;
        inst.model.document.on('change:data', handler);

        if (mounted) {
          try { inst.setData(question?.content_html || ''); } catch (_) {}
          editorRef.current = inst;
        } else {
          try { await inst.destroy(); } catch (_) {}
        }
      } catch (err) {
        console.error('CKEditor init error', err);
        isInitRef.current = false;
      }
    };

    init();

    return () => {
      mounted = false;
      if (editorRef.current) {
        try {
          if (changeHandlerRef.current && editorRef.current.model?.document?.off) {
            try { editorRef.current.model.document.off('change:data', changeHandlerRef.current); } catch (_) {}
            changeHandlerRef.current = null;
          }
        } catch (_) {}
        editorRef.current.destroy().catch(() => {});
        editorRef.current = null;
      }
      isInitRef.current = false;
    };
  }, [question?.question_id, question?.paper_id]);

  // Watch upload queue to update isUploading state
  useEffect(() => {
    if (uploadQueue === 0) {
      setIsUploading(false);
    } else {
      setIsUploading(true);
    }
  }, [uploadQueue]);

  // FIXED SUBMIT FUNCTION with upload check
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if images are still uploading
    if (isUploading) {
      alert('Please wait for image uploads to complete before saving changes.');
      return;
    }
    
    if (!contentHtml || !contentHtml.trim()) {
      alert('Question content is required');
      return;
    }

    const qid = question?.question_id ?? question?.id ?? question?.questionId;
    if (!qid) {
      alert('Missing question ID');
      return;
    }

    // Validate marks
    let marksValue = null;
    if (marks !== '' && marks !== null && marks !== undefined) {
      const marksNum = parseInt(marks, 10);
      if (isNaN(marksNum) || marksNum < 0) {
        alert('Marks must be a non-negative number or empty');
        return;
      }
      marksValue = marksNum;
    }

    setIsLoading(true);
    try {
      const payload = {
        content_html: contentHtml,
        co_id: coId === '' ? null : (Number.isNaN(Number(coId)) ? coId : Number(coId)),
        marks: marksValue,
        paper_id: question?.paper_id
      };

      // 1. Update the question
      await questionAPI.update(qid, payload);
      
      // 2. FETCH FRESH QUESTION DATA with CO info
      const freshQuestion = await questionAPI.getById(qid);
      
      // 3. Pass the complete question data to parent
      if (typeof onSave === 'function') {
        await onSave(freshQuestion.question || freshQuestion);
      }

      // 4. Close modal
      await cleanupAndClose();
    } catch (err) {
      console.error('Error updating question:', err);
      alert('Save failed: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupAndClose = async () => {
    if (editorRef.current) {
      try {
        if (changeHandlerRef.current && editorRef.current.model?.document?.off) {
          try { editorRef.current.model.document.off('change:data', changeHandlerRef.current); } catch (_) {}
          changeHandlerRef.current = null;
        }
        await editorRef.current.destroy();
      } catch (_) {}
      editorRef.current = null;
    }
    isInitRef.current = false;
    if (typeof onClose === 'function') onClose();
  };

  const handleCancel = async () => {
    await cleanupAndClose();
  };

  const onOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={onOverlayMouseDown}
      role="dialog"
      aria-modal="true"
      aria-label="Edit question dialog"
    >
      <div className="modal-content" role="document" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Question</h2>
          <button type="button" onClick={handleCancel} className="btn-close" aria-label="Close">×</button>
        </div>

        {/* Upload status indicator */}
        {isUploading && (
          <div className="upload-status-indicator">
            <div className="uploading-spinner"></div>
            <span>Uploading images... Please wait before saving</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-body">
            <div className="form-group">
              <label>Question Content *</label>
              <div className="editor-container" aria-label="Question editor">
                <div ref={mountRef} />
                {isUploading && (
                  <div className="editor-upload-hint">
                    <small>⏳ Image upload in progress. Please wait before saving.</small>
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Course Outcome</label>
                <select
                  className="input"
                  value={coId || ''}
                  onChange={(e) => setCoId(e.target.value === '' ? null : e.target.value)}
                  disabled={isLoadingCOs || isUploading}
                  aria-label="Course outcome"
                >
                  <option value="">No CO selected</option>
                  {coOptions.map(co => (
                    <option key={co.co_id} value={co.co_id}>
                      CO{co.co_number}: {co.description.substring(0, 50)}
                      {co.description.length > 50 ? '...' : ''}
                    </option>
                  ))}
                </select>
                {isLoadingCOs && <small className="help-text">Loading COs...</small>}
                {!isLoadingCOs && coOptions.length === 0 && question?.paper_id && (
                  <small className="help-text">No COs found for this paper's course</small>
                )}
                {!isLoadingCOs && !question?.paper_id && (
                  <small className="help-text">Question is not linked to a paper</small>
                )}
              </div>

              <div className="form-group">
                <label>Marks</label>
                <input
                  type="number"
                  className="input"
                  value={marks || ''}
                  onChange={(e) => setMarks(e.target.value === '' ? '' : e.target.value)}
                  min="0"
                  step="1"
                  placeholder="Enter marks (optional)"
                  aria-label="Question marks"
                  disabled={isUploading}
                />
                <small className="help-text">Leave empty for no marks</small>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={handleCancel} 
              className="btn-secondary" 
              aria-label="Cancel"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading || isLoadingCOs || isUploading} 
              className="btn-primary" 
              aria-label="Save changes"
            >
              {isLoading ? 'Saving...' : isUploading ? 'Waiting for uploads...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}