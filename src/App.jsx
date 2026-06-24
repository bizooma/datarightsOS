import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import RequestInbox from '@/pages/RequestInbox';
import RequestDetail from '@/pages/RequestDetail';
import ConsentLog from '@/pages/ConsentLog';
import WidgetStudio from '@/pages/WidgetStudio';
import AuditTrail from '@/pages/AuditTrail';
import AccessibilityReports from '@/pages/AccessibilityReports';
import Settings from '@/pages/Settings';
import Organizations from '@/pages/Organizations';
import PrivacyCenter from '@/pages/PrivacyCenter';
import Home from '@/pages/Home';
import AdminUsers from '@/pages/AdminUsers';
import About from '@/pages/About';
import Contact from '@/pages/Contact';

const AuthenticatedApp = () => {
  const { authError } = useAuth();

  // Only block rendering for user_not_registered — let all routes (including public "/") render normally.
  // auth_required is handled per-route by ProtectedRoute.
  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* Public marketing homepage — handles its own auth redirect */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<RequestInbox />} />
          <Route path="/request/:id" element={<RequestDetail />} />
          <Route path="/consent-log" element={<ConsentLog />} />
          <Route path="/widget-studio" element={<WidgetStudio />} />
          <Route path="/audit-trail" element={<AuditTrail />} />
          <Route path="/accessibility" element={<AccessibilityReports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>
      </Route>
      <Route path="/privacy-center" element={<PrivacyCenter />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App