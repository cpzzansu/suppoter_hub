import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { clearAuth, isTokenValid } from '../../utils/auth.js';

const RequiresAuth = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!isTokenValid(token)) {
      clearAuth();
      navigate('/login', { replace: true, state: { from: location } });
    }
  }, [navigate, location]);
  return children;
};

export default RequiresAuth;
