import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { CEODashboard } from './ceo/CEODashboard';
import { LeaderDashboard } from './leader/LeaderDashboard';

export function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  if (user.role === 'CEO') {
    return <CEODashboard />;
  }

  // All other roles go to leader dashboard
  return <LeaderDashboard />;
}
