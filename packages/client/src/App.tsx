import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import MeetingDetailPage from './pages/MeetingDetailPage';
import CreateMeetingPage from './pages/CreateMeetingPage';
import EditMeetingPage from './pages/EditMeetingPage';
import ProfilePage from './pages/ProfilePage';

function AppRoutes() {
  const { isAuthenticated, token, fetchUser } = useAuth();

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
      />
      <Route
        path="/meetings/new"
        element={isAuthenticated ? <CreateMeetingPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/meetings/:id"
        element={isAuthenticated ? <MeetingDetailPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/meetings/:id/edit"
        element={isAuthenticated ? <EditMeetingPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
