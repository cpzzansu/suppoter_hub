import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://xn----qd6ew2cx70c6uae40epc.com/api',
  // baseURL: 'http://localhost:8080/api',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.request.use(
  async (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // localStorage 접근 불가(시크릿/임베드 등) 시 무시
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
        try {
          localStorage.removeItem('token');
        } catch {}
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default instance;
