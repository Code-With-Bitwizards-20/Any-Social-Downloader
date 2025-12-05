import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens or other headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle common errors here
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// API methods
export const youtubeApi = {
  getVideoInfo: (url) => api.post('/youtube/info', { url }),
  downloadVideo: (url, format) => api.post('/youtube/download', { url, format }),
};

export const facebookApi = {
  getVideoInfo: (url) => api.post('/facebook/info', { url }),
  downloadVideo: (url, format) => api.post('/facebook/download', { url, format }),
};

export const instagramApi = {
  getMediaInfo: (url) => api.post('/instagram/info', { url }),
  downloadMedia: (url, format) => api.post('/instagram/download', { url, format }),
};

export const tiktokApi = {
  getVideoInfo: (url) => api.post('/tiktok/info', { url }),
  downloadVideo: (url, format) => api.post('/tiktok/download', { url, format }),
};

export const twitterApi = {
  getMediaInfo: (url) => api.post('/twitter/info', { url }),
  downloadMedia: (url, format) => api.post('/twitter/download', { url, format }),
};

export const healthCheck = () => api.get('/health');

export default api;
