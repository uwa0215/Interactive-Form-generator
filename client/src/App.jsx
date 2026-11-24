import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import LiveMonitor from './pages/LiveMonitor';
import QuizPlayer from './pages/QuizPlayer';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/forms/:id"
        element={
          <ProtectedRoute>
            <LiveMonitor />
          </ProtectedRoute>
        }
      />
      <Route path="/play/:slug" element={<QuizPlayer />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
