import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ToastContainer } from './components/Toast';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ResetPassword from './pages/auth/ResetPassword';
import Home from './pages/Home';
import Event from './pages/Event';
import './App.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const toast = useToast();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/events/:eventId"
          element={
            <PrivateRoute>
              <Event />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </BrowserRouter>
  );
}

export default App;
