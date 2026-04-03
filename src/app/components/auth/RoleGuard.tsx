import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { UserRole } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

export function RoleGuard({ children, allowedRoles }: { children: ReactNode; allowedRoles: UserRole[] }) {
  const { profile } = useAuth();

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
