import React, { useState, useRef, useEffect } from 'react';
import { setupUploadAdapter } from '../../../utils/UploadAdapter';
import './QuestionEditModal.css';

const QuestionEditModal = ({ question, onSave, onClose }) => {
  const editorRef = useRef();
  const isInitializedRef = useRef(false);
  const [editor, setEditor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    content_html: question.content_html,
    co_id: question.co_id || ''
  });

  // Initialize CKEditor
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
            initialData: formData.content_html
          });

          setupUploadAdapter(editorInstance, '/api/uploads');

          editorInstance.model.document.on('change:data', () => {
            setFormData(prev => ({
              ...prev,
              content_html: editorInstance.getData()
            }));
          });

          setEditor(editorInstance);
          
        } catch (error) {
          console.error('Error initializing CKEditor:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content_html.trim()) {
      alert('Question content is required');
      return;
    }

    setIsLoading(true);
    
    try {
      await onSave({
        ...question,
        ...formData
      });
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Question</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Question Content *</label>
            <div className="editor-container">
              <div ref={editorRef}></div>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionEditModal;