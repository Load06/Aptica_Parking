import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AppShell } from './components/AppShell';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { PendingScreen } from './screens/PendingScreen';
import { ResetPasswordScreen } from './screens/ResetPasswordScreen';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-2 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginScreen /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <RegisterScreen /> : <Navigate to="/" replace />} />
      <Route path="/pending" element={<PendingScreen />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route path="/*" element={user ? <AppShell /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
