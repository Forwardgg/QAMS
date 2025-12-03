import React, { useEffect, useRef, useState } from 'react';
import questionAPI from '../../../api/question.api';
import { setupUploadAdapter } from '../../../utils/UploadAdapter';
import './QuestionEditModal.css';

export default function QuestionEditModal({ question = {}, onSave, onClose }) {
  const mountRef = useRef(null);
  const editorRef = useRef(null);
  const isInitRef = useRef(false);
  const changeHandlerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contentHtml, setContentHtml] = useState(question?.content_html || '');
  const [coId, setCoId] = useState(question?.co_id ?? '');
  const [marks, setMarks] = useState(question?.marks ?? ''); // NEW: Add marks state
  const [coOptions, setCoOptions] = useState([]);
  const [isLoadingCOs, setIsLoadingCOs] = useState(false);

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
    setMarks(question?.marks ?? ''); // NEW: Update marks state

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

  // CKEditor init
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

        try {
          setupUploadAdapter(inst, '/api/uploads');
        } catch (err) {
          console.warn('Upload adapter setup failed', err);
        }

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
  }, []);

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

  // FIXED SUBMIT FUNCTION - Fetches fresh question data
  const handleSubmit = async (e) => {
    e.preventDefault();
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
        marks: marksValue, // NEW: Add marks to payload
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

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-body">
            <div className="form-group">
              <label>Question Content *</label>
              <div className="editor-container" aria-label="Question editor">
                <div ref={mountRef} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Course Outcome</label>
                <select
                  className="input"
                  value={coId || ''}
                  onChange={(e) => setCoId(e.target.value === '' ? null : e.target.value)}
                  disabled={isLoadingCOs}
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

              {/* NEW: Marks input field */}
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
                />
                <small className="help-text">Leave empty for no marks</small>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleCancel} className="btn-secondary" aria-label="Cancel">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading || isLoadingCOs} 
              className="btn-primary" 
              aria-label="Save changes"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}