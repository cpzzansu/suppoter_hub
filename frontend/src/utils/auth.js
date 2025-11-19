import { jwtDecode } from 'jwt-decode';

export function isTokenValid(token) {
  if (!token) return false;

  try {
    const { exp } = jwtDecode(token);
    return Date.now() < exp * 1000;
  } catch {
    return false;
  }
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('memberId');
}
