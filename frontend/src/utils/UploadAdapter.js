// src/utils/UploadAdapter.js
import authService from "../services/authService";

export class UploadAdapter {
  constructor(loader, apiUrl) {
    this.loader = loader;
    // Store the full API URL passed from setupUploadAdapter
    this.apiUrl = apiUrl || '/api/uploads';
  }

  upload() {
    return this.loader.file
      .then(file => new Promise((resolve, reject) => {
        this._initRequest();
        this._initListeners(resolve, reject, file);
        this._sendRequest(file);
      }));
  }

  abort() {
    if (this.xhr) {
      this.xhr.abort();
    }
  }

  _initRequest() {
    const xhr = this.xhr = new XMLHttpRequest();
    
    // Use the full API URL from constructor
    const uploadUrl = this.apiUrl;
    
    console.log('UploadAdapter - Upload URL:', uploadUrl); // Debug
    
    xhr.open('POST', uploadUrl, true);
    xhr.responseType = 'json';
    
    // Use authService instead of getAuthToken()
    const token = authService.getToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
  }

  _initListeners(resolve, reject, file) {
    const xhr = this.xhr;
    const loader = this.loader;
    const genericErrorText = `Couldn't upload file: ${file.name}.`;

    xhr.addEventListener('error', () => {
      console.error('Upload XHR error - Status:', xhr.status, 'URL:', this.apiUrl);
      reject(genericErrorText);
    });
    
    xhr.addEventListener('abort', () => reject());
    
    xhr.addEventListener('load', () => {
      console.log('Upload response - Status:', xhr.status, 'URL:', this.apiUrl); // Debug
      const response = xhr.response;

      if (!response || xhr.status !== 201) {
        console.error('Upload failed:', response);
        return reject(response && response.error ? response.error : genericErrorText);
      }

      // Success - return the URL for CKEditor
      resolve({
        default: response.url
      });
    });

    // Upload progress (optional)
    if (xhr.upload) {
      xhr.upload.addEventListener('progress', evt => {
        if (evt.lengthComputable) {
          loader.uploadTotal = evt.total;
          loader.uploaded = evt.loaded;
        }
      });
    }
  }

  _sendRequest(file) {
    const data = new FormData();
    data.append('file', file);

    this.xhr.send(data);
  }
}

// Helper function to setup upload adapter in CKEditor
export function setupUploadAdapter(editor, apiUrl) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    // Build the complete URL here
    const baseUrl = process.env.REACT_APP_API_URL || '';
    const fullApiUrl = apiUrl ? apiUrl : `${baseUrl}/api/uploads`;
    
    console.log('setupUploadAdapter - Full API URL:', fullApiUrl); // Debug
    
    return new UploadAdapter(loader, fullApiUrl);
  };
}