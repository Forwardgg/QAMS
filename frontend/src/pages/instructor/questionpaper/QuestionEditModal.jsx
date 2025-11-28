import React, { useEffect, useRef, useState } from 'react';
import questionAPI from '../../../api/question.api';
import { setupUploadAdapter } from '../../../utils/UploadAdapter';
import './QuestionEditModal.css';

/**
 * Props:
 * - question: object { question_id, content_html, co_id, paper_id, ... }
 * - onSave: optional async function(updatedQuestion) => returns updated question (should return the saved object)
 * - onClose: function to close modal
 *
 * Behavior:
 * - If onSave is provided: modal calls API, passes the server result to onSave, awaits it, then closes.
 * - If onSave is not provided: modal calls questionAPI.update itself and closes on success.
 */
export default function QuestionEditModal({ question = {}, onSave, onClose }) {
  const mountRef = useRef(null);          // DOM mount for CKEditor
  const editorRef = useRef(null);         // CKEditor instance
  const isInitRef = useRef(false);        // guard to prevent duplicate inits
  const changeHandlerRef = useRef(null);  // store handler to remove later
  const [isLoading, setIsLoading] = useState(false);
  const [contentHtml, setContentHtml] = useState(question?.content_html || '');
  const [coId, setCoId] = useState(question?.co_id ?? '');

  // Keep local state when question prop changes
  useEffect(() => {
    setContentHtml(question?.content_html || '');
    setCoId(question?.co_id ?? '');

    // If editor exists, update its content instead of re-creating
    if (editorRef.current && typeof editorRef.current.setData === 'function') {
      try {
        const data = question?.content_html || '';
        // Only set if different to avoid extra change events
        if (editorRef.current.getData() !== data) {
          editorRef.current.setData(data);
        }
      } catch (err) {
        // ignore
      }
    }
  }, [question]);

  // CKEditor init (single-run + defensive)
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mountRef.current || isInitRef.current || editorRef.current) return;

      // Prevent duplicate initialization while we're attempting init
      isInitRef.current = true;

      try {
        const ClassicEditor = (await import('@ckeditor/ckeditor5-build-classic')).default;

        // clear mount node if any stray content remains
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

        // wire upload adapter (your util should register FileRepository.createUploadAdapter)
        try {
          setupUploadAdapter(inst, '/api/uploads');
        } catch (err) {
          // don't block init if adapter registration fails
          console.warn('Upload adapter setup failed', err);
        }

        // sync editor -> local state
        const handler = () => {
          try {
            setContentHtml(inst.getData());
          } catch (_) {}
        };
        // store handler so we can remove it on destroy
        changeHandlerRef.current = handler;
        inst.model.document.on('change:data', handler);

        if (mounted) {
          // set initial content safely
          try { inst.setData(question?.content_html || ''); } catch (_) {}
          editorRef.current = inst;
        } else {
          try { await inst.destroy(); } catch (_) {}
        }
      } catch (err) {
        console.error('CKEditor init error', err);
        // allow retries on next mount/open by resetting the init guard
        isInitRef.current = false;
      }
    };

    init();

    return () => {
      mounted = false;
      // destroy editor if present when component unmounts
      if (editorRef.current) {
        try {
          // remove change handler if present before destroy
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
    // run only on mount/unmount
  }, []);


  // helper: close and cleanup
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

  // submit: validate -> call API (or parent) -> handle result
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

    setIsLoading(true);
    try {
      const payload = {
        content_html: contentHtml,
        co_id: coId === '' ? null : (Number.isNaN(Number(coId)) ? coId : Number(coId)),
        paper_id: question?.paper_id
      };

      // Call API first to get canonical saved object
      const apiResp = await questionAPI.update(qid, payload);
      // questionAPI.handle normally returns res.data — be defensive here
      const saved = apiResp?.question ?? apiResp?.data ?? apiResp;

      // If parent provided onSave, give it the saved object and await it
      if (typeof onSave === 'function') {
        await onSave(saved);
      }

      // close and cleanup
      await cleanupAndClose();
    } catch (err) {
      console.error('Error updating question:', err);
      alert('Save failed: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    // destroy editor and call parent close
    await cleanupAndClose();
  };

  // overlay click handler: only close when clicking the overlay itself
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

            {/* Small optional CO display/edit */}
            <div className="form-group">
              <label>Course Outcome</label>
              <input
                type="text"
                className="input"
                value={coId ?? ''}
                onChange={(e) => setCoId(e.target.value)}
                placeholder="CO id (optional)"
                aria-label="Course outcome id"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleCancel} className="btn-secondary" aria-label="Cancel">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary" aria-label="Save changes">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
