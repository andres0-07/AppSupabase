import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesion.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto grid min-h-[80vh] max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-cyan-400">BioTechK / Supabase</p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Plataforma segura para tareas, validaciones y evidencias biomedicas.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-400">
            Inicia sesion con Supabase Auth. Cada usuario vera su dashboard segun su rol.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm font-semibold">CEO</p>
              <p className="mt-1 text-sm text-slate-400">Valida evidencias, revisa progreso global y monitorea lideres.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm font-semibold">Lideres</p>
              <p className="mt-1 text-sm text-slate-400">Consultan tareas, cargan evidencias y actualizan estado de trabajo.</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/50">
          <h2 className="text-2xl font-semibold">Iniciar sesion</h2>
          <p className="mt-2 text-sm text-slate-400">Usa email y contrasena creados en Supabase Auth.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Email</label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ceo@biotechk.com"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Contrasena</label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {submitting && (
              <p className="text-xs text-slate-400 text-center">Verificando credenciales...</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {submitting
                ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                : <LogIn className="h-5 w-5" />}
              Acceder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
