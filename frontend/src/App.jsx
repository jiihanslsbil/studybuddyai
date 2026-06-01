import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SummarizerPage from './pages/SummarizerPage';
import QuizPage from './pages/QuizPage';
import PlannerPage from './pages/PlannerPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mx-auto mb-3" />
        <p style={{ color: 'var(--text-muted)' }} className="text-sm">Loading...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function ToastWrapper() {
  const { dark } = useTheme();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: dark ? '#150d15' : '#fff0f6',
          color:      dark ? '#fce7f3' : '#1a0a14',
          border:     `1px solid rgba(236,72,153,${dark ? '0.15' : '0.25'})`,
          borderRadius: '14px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          boxShadow: '0 8px 32px rgba(236,72,153,0.12)',
        },
        success: { iconTheme: { primary: '#f472b6', secondary: dark ? '#150d15' : '#fff0f6' } },
        error:   { iconTheme: { primary: '#fb7185', secondary: dark ? '#150d15' : '#fff0f6' } },
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ToastWrapper />
          <Routes>
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"  element={<DashboardPage />} />
              <Route path="summarizer" element={<SummarizerPage />} />
              <Route path="quiz"       element={<QuizPage />} />
              <Route path="planner"    element={<PlannerPage />} />
              <Route path="history"    element={<HistoryPage />} />
              <Route path="profile"    element={<ProfilePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
