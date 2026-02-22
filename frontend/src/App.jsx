import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/patient/Dashboard';
import SymptomForm from './pages/patient/SymptomForm';
import Reports from './pages/patient/Reports';
import Suggestions from './pages/patient/Suggestions';
import Reminders from './pages/patient/Reminders';
import PatientProfile from './pages/patient/Profile';
import DoctorDashboard from './pages/doctor/Dashboard';
import PatientDetail from './pages/doctor/PatientDetail';
import './index.css';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// Redirects logged-in users to their dashboard when hitting /app
function AppRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'doctor' || user.role === 'admin') return <Navigate to="/doctor" replace />;
  return <Navigate to="/patient" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<AppRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Patient routes */}
      <Route path="/patient" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/symptoms" element={<ProtectedRoute roles={['patient']}><SymptomForm /></ProtectedRoute>} />
      <Route path="/patient/reports" element={<ProtectedRoute roles={['patient']}><Reports /></ProtectedRoute>} />
      <Route path="/patient/suggestions" element={<ProtectedRoute roles={['patient']}><Suggestions /></ProtectedRoute>} />
      <Route path="/patient/reminders" element={<ProtectedRoute roles={['patient']}><Reminders /></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute roles={['patient']}><PatientProfile /></ProtectedRoute>} />

      {/* Doctor routes */}
      <Route path="/doctor" element={<ProtectedRoute roles={['doctor', 'admin']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/patient/:id" element={<ProtectedRoute roles={['doctor', 'admin']}><PatientDetail /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
