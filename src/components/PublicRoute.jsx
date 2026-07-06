import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = () => {
  const { user } = useAuth();

  if (user === 'true') {
    const role = localStorage.getItem('role');
    if (role === 'STUDENT') {
      return <Navigate to="/student" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
