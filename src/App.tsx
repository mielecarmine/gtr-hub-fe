import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { AuthPage } from './pages/AuthPage';
import { MainApp } from './pages/MainApp';


export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? <MainApp /> : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/auth"
        element={
          !isAuthenticated ? <AuthPage /> : <Navigate to="/" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}