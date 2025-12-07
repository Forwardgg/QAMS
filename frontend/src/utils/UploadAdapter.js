// src/utils/UploadAdapter.js (simplified)
export function setupUploadAdapter(editor) {
  // Just setup the adapter - tracking is now in QuestionCreate.jsx
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    const baseUrl = process.env.REACT_APP_API_URL || '';
    let uploadUrl;
    
    if (baseUrl.endsWith('/api')) {
      uploadUrl = `${baseUrl}/uploads`;
    } else if (!baseUrl) {
      uploadUrl = '/api/uploads';
    } else {
      uploadUrl = `${baseUrl}/api/uploads`;
    }
    
    console.log('Upload adapter created for:', uploadUrl);
    
    return {
      upload: () => {
        return loader.file.then(file => {
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
              if (xhr.status === 201) {
                const response = xhr.response;
                resolve({ default: response?.url });
              } else {
                reject('Upload failed');
              }
            });
            
            xhr.addEventListener('error', () => reject('Upload failed'));
            
            const data = new FormData();
            data.append('file', file);
            xhr.send(data);
          });
        });
      },
      
      abort: () => {
        console.log('Upload aborted');
      }
    };
  };
}