import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import GuestRegister from './pages/GuestRegister';
import GuestBillSearch from './pages/GuestBillSearch';
import GuestLogin from './pages/GuestLogin';
import GuestRegistration from './pages/GuestRegistration';
import GuestDashboard from './pages/GuestDashboard';
import CodeInvite from './pages/CodeInvite';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Upgrade from './pages/Upgrade';
import BillDetail from './pages/BillDetail';
import ForgotPass from './pages/ForgotPass';
import ChangePass from './pages/ChangePass';
import VerifyEmail from './pages/VerifyEmail';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route Component (redirect if logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/guest/search"
          element={
            <PublicRoute>
              <GuestBillSearch />
            </PublicRoute>
          }
        />
        <Route
          path="/code-invite"
          element={
            <PublicRoute>
              <CodeInvite />
            </PublicRoute>
          }
        />
        <Route
          path="/guest/login"
          element={
            <PublicRoute>
              <GuestLogin />
            </PublicRoute>
          }
        />
        <Route
          path="/guest/registration"
          element={
            <PublicRoute>
              <GuestRegistration />
            </PublicRoute>
          }
        />
        <Route
          path="/guest/dashboard"
          element={
            <PublicRoute>
              <GuestDashboard />
            </PublicRoute>
          }
        />
        <Route
          path="/guest/register/:code"
          element={
            <PublicRoute>
              <GuestRegister />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upgrade"
          element={
            <ProtectedRoute>
              <Upgrade />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bills/:id"
          element={
            <ProtectedRoute>
              <BillDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPass />
            </PublicRoute>
          }
        />
        <Route
          path="/change-password/:token"
          element={
            <PublicRoute>
              <ChangePass />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PublicRoute>
              <VerifyEmail />
            </PublicRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
