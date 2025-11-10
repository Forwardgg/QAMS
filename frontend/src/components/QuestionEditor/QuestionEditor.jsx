// src/components/QuestionEditor/QuestionEditor.jsx
import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import './QuestionEditor.css';

const QuestionEditor = ({ initialData = '', onChange, editorConfig = {} }) => {
  return (
    <div className="question-editor-container">
      <CKEditor
        editor={ClassicEditor}
        data={initialData}
        config={{
          toolbar: [ 'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|', 'undo', 'redo' ],
          // You can add more configuration here, e.g., image upload, font sizes
          ...editorConfig,
        }}
        onChange={(event, editor) => {
          const data = editor.getData();
          if (onChange) {
            onChange(data);
          }
        }}
        onReady={editor => {
          // You can store the "editor" and use it when needed.
          console.log('CKEditor is ready to use!', editor);
        }}
        onError={({ willEditorRestart }) => {
          // If you see a warning or error in the console, you can handle it here.
          console.warn('CKEditor error. Will editor restart?', willEditorRestart);
        }}
      />
    </div>
  );
};

export default QuestionEditor;