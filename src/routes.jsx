
import { Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import GroupDetail from './pages/GroupDetail';
import AddStudentsToGroup from './pages/AddStudentsToGroup';
import CreateHomework from './pages/CreateHomework';
import Students from './pages/Students';
import Gifts from './pages/Gifts';
import Management from './pages/Management';
import StudentDashboard from './pages/StudentDashboard';

const routes = [
  {
    path: '/login',
    element: <PublicRoute />,
    children: [
      {
        path: '',
        element: <Login />,
      }
    ]
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: 'teachers',
            element: <Teachers />,
          },
          {
            path: 'classes/:id',
            element: <GroupDetail />,
          },
          {
            path: 'classes/:id/add-students',
            element: <AddStudentsToGroup />,
          },
          {
            path: 'classes/:id/homework/create',
            element: <CreateHomework />,
          },
          {
            path: 'classes',
            element: <Classes />,
          },
          {
            path: 'students',
            element: <Students />,
          },
          {
            path: 'gifts',
            element: <Gifts />,
          },
          {
            path: 'management',
            element: <Management />,
          },
        ],
      },
    ],
  },
  {
    path: '/student',
    element: <StudentDashboard />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export default routes;
