require('fs').writeFileSync('src/app/routes.tsx', import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { RoleGuard } from './components/auth/RoleGuard';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuditPage } from './pages/AuditPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/dashboard', element: (<PrivateRoute><DashboardPage /></PrivateRoute>) },
  { path: '/auditoria', element: (<PrivateRoute><RoleGuard allowedRoles={['ceo']}><AuditPage /></RoleGuard></PrivateRoute>) },
  { path: '/', element: <Navigate to='/dashboard' replace /> },
  { path: '*', element: <Navigate to='/dashboard' replace /> },
]);, 'utf8'); console.log('OK');