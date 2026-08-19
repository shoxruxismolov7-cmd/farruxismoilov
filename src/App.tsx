import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import OnboardingPage from '@/pages/OnboardingPage';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ExamLibraryPage from '@/pages/dashboard/ExamLibraryPage';
import ExamPage from '@/pages/dashboard/ExamPage';
import ResultsPage from '@/pages/dashboard/ResultsPage';
import VocabularyPage from '@/pages/dashboard/VocabularyPage';
import ReadingPage from '@/pages/dashboard/ReadingPage';
import ListeningPage from '@/pages/dashboard/ListeningPage';
import WritingPage from '@/pages/dashboard/WritingPage';
import SpeakingPage from '@/pages/dashboard/SpeakingPage';
import ProfilePage from '@/pages/dashboard/ProfilePage';
import SettingsPage from '@/pages/dashboard/SettingsPage';
import SubscriptionPage from '@/pages/dashboard/SubscriptionPage';
import PaymentPage from '@/pages/dashboard/PaymentPage';
import ChatPage from '@/pages/dashboard/ChatPage';
import NotificationsPage from '@/pages/dashboard/NotificationsPage';
import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminPaymentsPage from '@/pages/admin/AdminPaymentsPage';
import AdminTestsPage from '@/pages/admin/AdminTestsPage';
import AdminChatPage from '@/pages/admin/AdminChatPage';
import AdminNotificationsPage from '@/pages/admin/AdminNotificationsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (!session || (profile?.role !== 'admin' && profile?.role !== 'super_admin'))
    return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <OnboardingGuard>
            <DashboardLayout />
          </OnboardingGuard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="exam-library" element={<ExamLibraryPage />} />
        <Route path="exam/:examId" element={<ExamPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="vocabulary" element={<VocabularyPage />} />
        <Route path="reading" element={<ReadingPage />} />
        <Route path="listening" element={<ListeningPage />} />
        <Route path="writing" element={<WritingPage />} />
        <Route path="speaking" element={<SpeakingPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="tests" element={<AdminTestsPage />} />
        <Route path="chat" element={<AdminChatPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
