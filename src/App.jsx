import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { useEffect } from 'react';
import { captureReferral } from '@/lib/referral';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import RequestInbox from '@/pages/RequestInbox';
import Analytics from '@/pages/Analytics';
import RequestDetail from '@/pages/RequestDetail';
import ConsentLog from '@/pages/ConsentLog';
import WidgetStudio from '@/pages/WidgetStudio';
import AuditTrail from '@/pages/AuditTrail';
import AccessibilityReports from '@/pages/AccessibilityReports';
import AccessibilityReportDetail from '@/pages/AccessibilityReportDetail';
import Settings from '@/pages/Settings';
import KnowledgeBase from '@/pages/KnowledgeBase';
import Support from '@/pages/Support';
import Organizations from '@/pages/Organizations';
import PrivacyCenter from '@/pages/PrivacyCenter';
import Home from '@/pages/Home';
import Pricing from '@/pages/Pricing';
import AdminUsers from '@/pages/AdminUsers';
import ScanEmails from '@/pages/ScanEmails';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import CookieConsent from '@/pages/CookieConsent';
import WebAccessibility from '@/pages/WebAccessibility';
import DataPrivacy from '@/pages/DataPrivacy';
import AiDisclosure from '@/pages/AiDisclosure';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import PublicSupport from '@/pages/PublicSupport';
import Scan from '@/pages/Scan';
import ScanPrintReport from '@/pages/ScanPrintReport';

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
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/request/:id" element={<RequestDetail />} />
          <Route path="/consent-log" element={<ConsentLog />} />
          <Route path="/widget-studio" element={<WidgetStudio />} />
          <Route path="/audit-trail" element={<AuditTrail />} />
          <Route path="/accessibility" element={<AccessibilityReports />} />
          <Route path="/accessibility/:id" element={<AccessibilityReportDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/support" element={<Support />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/scan-emails" element={<ScanEmails />} />
        </Route>
      </Route>
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/privacy-center" element={<PrivacyCenter />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/cookie-consent" element={<CookieConsent />} />
      <Route path="/web-accessibility" element={<WebAccessibility />} />
      <Route path="/data-privacy" element={<DataPrivacy />} />
      <Route path="/ai-disclosure" element={<AiDisclosure />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/support-request" element={<PublicSupport />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/scan/report/:id" element={<ScanPrintReport />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    captureReferral();
  }, []);

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