import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://support.wanjeon.co.kr/api',
  // baseURL: 'http://localhost:8080/api',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response) {
      const { status, data } = response;

      if (
        status === 500 &&
        typeof data.message === 'string' &&
        data.message.includes('JWT expired')
      ) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default instance;
