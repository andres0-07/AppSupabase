import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CEODashboardPage } from './CEODashboardPage';
import { LeaderDashboardPage } from './LeaderDashboardPage';

export function DashboardPage() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role === 'ceo') {
    return <CEODashboardPage />;
  }

  return <LeaderDashboardPage />;
}
