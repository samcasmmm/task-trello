import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// You can add interceptors here if needed
// api.interceptors.request.use(config => { ... })
// api.interceptors.response.use(response => { ... })

export default api;
