import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import MainLayout from './layout/MainLayout';


import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import GroupDetail from './pages/GroupDetail';
import AddStudentsToGroup from './pages/AddStudentsToGroup';
import CreateHomework from './pages/CreateHomework';
import CreateExam from './pages/CreateExam';
import ExamDetail from './pages/ExamDetail';
import ExamSubmission from './pages/ExamSubmission';
import Students from './pages/Students';
import Gifts from './pages/Gifts';
import Management from './pages/Management';
import Subscription from './pages/Subscription';

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route path="/" element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="teachers" element={<Teachers />} />
              <Route path="classes">
                <Route index element={<Classes />} />
                <Route path=":id" element={<GroupDetail />} />
                <Route path=":id/add-students" element={<AddStudentsToGroup />} />
                <Route path=":id/homework/create" element={<CreateHomework />} />
                <Route path=":id/exam/create" element={<CreateExam />} />
                <Route path=":id/exam/:examId" element={<ExamDetail />} />
                <Route path=":id/exam/:examId/submission/:submissionId" element={<ExamSubmission />} />
                <Route path=":id/homework/:examId/results" element={<ExamDetail />} />
                <Route path=":id/homework/:examId/result/:submissionId" element={<ExamSubmission />} />
              </Route>
              <Route path="students" element={<Students />} />
              <Route path="gifts" element={<Gifts />} />
              <Route path="management" element={<Management />} />
              <Route path="subscription" element={<Subscription />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
