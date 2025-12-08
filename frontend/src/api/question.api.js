import api from "./axios";

async function handle(promise) {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    // Better error handling with detailed logging
    console.error('API Error Details:', {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      config: err.response?.config,
      message: err.message
    });
    
    if (err.response && err.response.data) {
      const data = err.response.data;
      const msg = data.message ?? data.error ?? JSON.stringify(data);
      throw new Error(msg); // This is throwing generic error
    }
    throw new Error(err.message || 'Server error while creating question');
  }
}

const questionAPI = {
  create: (data, config = {}) =>
    handle(api.post("/questions", data, config)),

  getById: (questionId, config = {}) =>
    handle(api.get(`/questions/${encodeURIComponent(questionId)}`, config)),

  update: (questionId, data, config = {}) =>
    handle(api.put(`/questions/${encodeURIComponent(questionId)}`, data, config)),

  delete: (questionId, config = {}) =>
    handle(api.delete(`/questions/${encodeURIComponent(questionId)}`, config)),

  getByPaper: (paperId, config = {}) =>
    handle(api.get(`/questions/paper/${encodeURIComponent(paperId)}`, config)),

  getPaperCOs: (paperId, config = {}) =>
    handle(api.get(`/questions/paper/${encodeURIComponent(paperId)}/cos`, config)),

  search: (filters = {}, config = {}) => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params[k] = v;
    });
    return handle(api.get("/questions/search", { params, ...config }));
  },

  updateSequence: (paperId, sequenceUpdates, config = {}) =>
    handle(api.patch(`/questions/paper/${encodeURIComponent(paperId)}/sequence`, {
      sequence_updates: sequenceUpdates
    }, config)),

  getUploadConfig: (config = {}) =>
    handle(api.get("/uploads/config", config)),

  uploadFile: (formData, config = {}) =>
    handle(api.post("/uploads", formData, { ...config }))
};

export default questionAPI;