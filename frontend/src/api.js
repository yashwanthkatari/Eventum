import axios from 'axios';

// Instantiating a centralized Axios interface focused entirely on your FastAPI backend port
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// A dynamic processing middleware interceptor that structuralizes security injections automatically
api.interceptors.request.use(
  (config) => {
    // Check local storage records for an active cryptographic session token block
    const token = localStorage.getItem('token');
    if (token) {
      // Apply the standardized OAuth2 Bearer authorization signature directly to the transaction headers
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;