import React from "react";
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import PortalShell from "./components/portal/PortalShell";
import { StudentPortalPage } from "./pages/student/student-portal-page";
import { LoginPage } from "./pages/auth/login-page";
import { RegisterPage } from "./pages/auth/register-page";
import { ForgotPasswordPage } from "./pages/auth/forgot-password-page";
import GlobalAiChatbot from "./components/common/GlobalAiChatbot";
import { LandingLayout } from "./layouts/LandingLayout";
import { HomePage } from "./pages/landing/HomePage";
import { LaboratoriesPage } from "./pages/landing/LaboratoriesPage";
import { FeaturesPage } from "./pages/landing/FeaturesPage";
import { AboutPage } from "./pages/landing/AboutPage";

const VALID_AUTH_ROLES = ["admin", "instructor"];

const AuthRoleGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useParams<{ role: string }>();
  if (!role || !VALID_AUTH_ROLES.includes(role.toLowerCase())) {
    return <Navigate to="/404" replace />;
  }
  return <>{children}</>;
};

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
    <div className="text-8xl font-black text-slate-800 leading-none mb-4">404</div>
    <h1 className="text-2xl font-black text-white mb-4">Page Not Found</h1>
    <p className="text-sm text-slate-400 mb-6 max-w-md">
      The page you are trying to reach does not exist or has been moved.
    </p>
    <div className="space-y-2 max-w-md">
      <p className="text-sm text-slate-400">
        Please verify the URL or scan the QR code posted on your workstation monitor.
      </p>
      <p className="text-xs text-slate-500">
        If the issue continues, contact your laboratory administrator for assistance.
      </p>
    </div>
  </div>
);

const ProtectedRoute = ({ allowedRole, children }: { allowedRole: string, children: React.ReactNode }) => {
  const userStr = sessionStorage.getItem("labtrack_user") || localStorage.getItem("labtrack_user");
  
  if (!userStr) return <Navigate to={`/login/${allowedRole}`} replace />;
  
  try {
    const user = JSON.parse(userStr);
    if (!user.role || user.role.toLowerCase() !== allowedRole.toLowerCase()) {
      return <Navigate to={`/login/${allowedRole}`} replace />;
    }
  } catch (e) {
    return <Navigate to={`/login/${allowedRole}`} replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("labtrack_user");
    localStorage.removeItem("labtrack_token");
    sessionStorage.clear();
    navigate("/login/admin");
  };

  return (
    <>
      <GlobalAiChatbot />
      <Routes>
        {/* LANDING PAGES */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/laboratories" element={<LaboratoriesPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>

        {/* AUTH ROUTES */}
        <Route path="/login/:role" element={<AuthRoleGuard><LoginPage /></AuthRoleGuard>} />
        <Route path="/register/:role" element={<AuthRoleGuard><RegisterPage /></AuthRoleGuard>} />
        <Route path="/forgot-password/:role" element={<AuthRoleGuard><ForgotPasswordPage /></AuthRoleGuard>} />

        {/* SECURED PORTAL ROUTES */}
        <Route path="/admin/*" element={<ProtectedRoute allowedRole="admin"><PortalShell userRole="ADMIN_TECHNICIAN" onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/instructor/*" element={<ProtectedRoute allowedRole="instructor"><PortalShell userRole="INSTRUCTOR" onLogout={handleLogout} /></ProtectedRoute>} />
        
        {/* STUDENT ROUTES */}
        <Route path="/student" element={<StudentPortalPage />} />
        <Route path="/student/:workstationId" element={<StudentPortalPage />} />

        {/* NOT FOUND & FALLBACK */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}