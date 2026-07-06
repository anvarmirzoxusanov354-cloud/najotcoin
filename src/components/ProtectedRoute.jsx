
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth();

  if (!user || user !== 'true') {
    return <Navigate to="/login" replace />;
  }

  // Student admin sahifalariga kira olmaydi
  const role = localStorage.getItem('role');
  if (role === 'STUDENT') {
    return <Navigate to="/student" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
