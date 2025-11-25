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
export default function QuestionEditModal({ question, onSave, onClose }) {
  const mountRef = useRef(null);          // DOM mount for CKEditor
  const editorRef = useRef(null);         // CKEditor instance
  const isInitRef = useRef(false);        // guard to prevent duplicate inits
  const [isLoading, setIsLoading] = useState(false);
  const [contentHtml, setContentHtml] = useState(question?.content_html || '');
  const [coId, setCoId] = useState(question?.co_id ?? '');

  // Keep local state when question prop changes
  useEffect(() => {
    setContentHtml(question?.content_html || '');
    setCoId(question?.co_id ?? '');

    // If editor exists, update its content instead of re-creating
    if (editorRef.current && typeof editorRef.current.setData === 'function') {
      try { editorRef.current.setData(question?.content_html || ''); } catch (_) {}
    }
  }, [question]);

  // CKEditor init (single-run + defensive)
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mountRef.current || isInitRef.current || editorRef.current) return;

      // Prevent duplicate initialization (StrictMode or repeated opens)
      isInitRef.current = true;

      try {
        const ClassicEditor = (await import('@ckeditor/ckeditor5-build-classic')).default;

        // clear mount node if any stray content remains
        mountRef.current.innerHTML = '';

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

        setupUploadAdapter(inst, '/api/uploads');

        // sync editor -> local state
        inst.model.document.on('change:data', () => {
          try {
            setContentHtml(inst.getData());
          } catch (_) {}
        });

        if (mounted) {
          inst.setData(question?.content_html || '');
          editorRef.current = inst;
        } else {
          try { await inst.destroy(); } catch (_) {}
        }
      } catch (err) {
        console.error('CKEditor init error', err);
        // leave isInitRef true to avoid repeated failing attempts; you can change this if you prefer retries
      }
    };

    init();

    return () => {
      mounted = false;
      // destroy editor if present when component unmounts
      if (editorRef.current) {
        editorRef.current.destroy().catch(() => {});
        editorRef.current = null;
      }
      isInitRef.current = false;
    };
  }, []); // run once on mount

  // helper: close and cleanup
  const cleanupAndClose = async () => {
    if (editorRef.current) {
      try { await editorRef.current.destroy(); } catch (_) {}
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
        co_id: coId === '' ? null : coId,
        paper_id: question?.paper_id // keep paper_id unchanged - include if needed
      };

      // Call API first to get canonical saved object
      const apiResp = await questionAPI.update(qid, payload);
      // your server returns { success: true, question: {...} }
      const saved = apiResp?.question ?? apiResp?.data ?? apiResp;

      // If parent provided onSave, give it the saved object and await it
      if (typeof onSave === 'function') {
        await onSave(saved);
      }

      // close and cleanup
      await cleanupAndClose();
    } catch (err) {
      // your questionAPI.handle throws Error with message from server
      console.error('Error updating question:', err);
      alert('Save failed: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // destroy editor and call parent close
    cleanupAndClose();
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) handleCancel(); }} role="dialog" aria-modal="true">
      <div className="modal-content" role="document">
        <div className="modal-header">
          <h2>Edit Question</h2>
          <button onClick={handleCancel} className="btn-close" aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-body">
            <div className="form-group">
              <label>Question Content *</label>
              <div className="editor-container">
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
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleCancel} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
