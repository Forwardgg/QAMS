// src/utils/UploadAdapter.js
import authService from "../services/authService";

export class UploadAdapter {
  constructor(loader, apiUrl) {
    this.loader = loader;
    this.apiUrl = apiUrl || this.getDefaultApiUrl();
  }

  // Helper to get default API URL
  getDefaultApiUrl() {
    const baseUrl = process.env.REACT_APP_API_URL || '';
    
    // If baseUrl already ends with /api, we need /api/uploads
    if (baseUrl.endsWith('/api')) {
      return `${baseUrl}/uploads`;
    } 
    // If no baseUrl (development), use relative path
    else if (!baseUrl) {
      return '/api/uploads';
    }
    // If baseUrl doesn't end with /api (production without /api)
    else {
      return `${baseUrl}/api/uploads`;
    }
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
    
    const uploadUrl = this.apiUrl;
    console.log('Upload URL:', uploadUrl); // Debug
    
    xhr.open('POST', uploadUrl, true);
    xhr.responseType = 'json';
    
    const token = authService.getToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
  }

  _initListeners(resolve, reject, file) {
    const xhr = this.xhr;
    const loader = this.loader;
    const genericErrorText = `Couldn't upload file: ${file.name}.`;

    xhr.addEventListener('error', () => reject(genericErrorText));
    xhr.addEventListener('abort', () => reject());
    xhr.addEventListener('load', () => {
      const response = xhr.response;

      if (!response || xhr.status !== 201) {
        return reject(response && response.error ? response.error : genericErrorText);
      }

      resolve({
        default: response.url
      });
    });

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

export function setupUploadAdapter(editor, apiUrl) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    // If explicit apiUrl provided, use it
    if (apiUrl) {
      return new UploadAdapter(loader, apiUrl);
    }
    // Otherwise use automatic detection
    return new UploadAdapter(loader);
  };
}