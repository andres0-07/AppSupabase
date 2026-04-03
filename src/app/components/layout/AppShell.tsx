import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { LogOut, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export function AppShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const navigate = useNavigate();
  const { profile, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">BioTechK</p>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            {profile?.role === 'ceo' && (
              <Link
                to="/auditoria"
                className="inline-flex items-center gap-2 rounded-lg border border-violet-500/40 px-3 py-2 text-sm text-violet-300 hover:bg-violet-500/10"
              >
                <Shield className="h-4 w-4" /> Auditoría
              </Link>
            )}
            <div className="text-right">
              <p className="font-medium">{profile?.full_name}</p>
              <p className="text-sm text-slate-400">Rol: {profile?.role}</p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-cyan-500 hover:text-cyan-300"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}