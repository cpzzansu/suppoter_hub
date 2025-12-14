import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { clearAuth, isTokenValid } from '../../utils/auth.js';

export default function RequiresAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!isTokenValid(token)) {
      clearAuth();
      navigate('/login', { replace: true, state: { from: location } });
    }
  }, [navigate, location]);

  return <Outlet />;
}
