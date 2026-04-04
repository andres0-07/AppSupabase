import { useEffect, useMemo, useRef, useState } from 'react';
import { Shield, Filter, ExternalLink, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAllProfiles, fetchEvidenceForProfile, reviewEvidence, fetchAllTasks } from '../../services/taskService';
import { getSignedEvidenceUrl } from '../../services/evidenceService';
import type { Evidence, Profile, Task } from '../../types';

const STATUS_CONFIG = {
  pending:  { label: 'Pendiente',  color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
  approved: { label: 'Aprobada',   color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  rejected: { label: 'Rechazada',  color: 'text-red-400 border-red-500/30 bg-red-500/10' },
};

export function AuditPage() {
  const { profile } = useAuth();
  const mountedRef = useRef(true);

  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [team, setTeam]         = useState<Profile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [busyId, setBusyId]     = useState<string | null>(null);

  const [filterUser, setFilterUser]     = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType]     = useState('all');

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  async function loadData() {
    if (!profile || !mountedRef.current) return;
    setLoading(true);
    setError('');
    try {
      const [evidenceRows, taskRows, teamRows] = await Promise.all([
        fetchEvidenceForProfile(profile),
        fetchAllTasks(),
        fetchAllProfiles(),
      ]);
      if (!mountedRef.current) return;
      setEvidence(evidenceRows);
      setTasks(taskRows);
      setTeam(teamRows);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error cargando auditoría.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [profile?.id]);

  const filtered = useMemo(() => evidence.filter((e) => {
    if (filterUser !== 'all' && e.uploaded_by !== filterUser) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterType !== 'all' && e.file_type !== filterType) return false;
    return true;
  }), [evidence, filterUser, filterStatus, filterType]);

  const totalPending  = evidence.filter((e) => e.status === 'pending').length;
  const totalApproved = evidence.filter((e) => e.status === 'approved').length;
  const totalRejected = evidence.filter((e) => e.status === 'rejected').length;

  async function handleGetUrl(evidenceId: string, filePath: string) {
    if (signedUrls[evidenceId]) { window.open(signedUrls[evidenceId], '_blank'); return; }
    setLoadingUrl(evidenceId);
    try {
      const url = await getSignedEvidenceUrl(filePath);
      if (!mountedRef.current) return;
      setSignedUrls((prev) => ({ ...prev, [evidenceId]: url }));
      window.open(url, '_blank');
    } catch {
      alert('No se pudo generar el enlace.');
    } finally {
      if (mountedRef.current) setLoadingUrl(null);
    }
  }

  async function handleReview(evidenceId: string, status: 'approved' | 'rejected') {
    if (!profile) return;
    setBusyId(evidenceId);
    try {
      await reviewEvidence({
        evidenceId, status,
        reviewerId: profile.id,
        reviewComment: status === 'approved' ? 'Aprobado en auditoría' : 'Rechazado en auditoría',
      });
      if (!mountedRef.current) return;
      await loadData();
    } finally {
      if (mountedRef.current) setBusyId(null);
    }
  }

  return (
    <AppShell title="Auditoría de Evidencias" subtitle="Trazabilidad completa de archivos por tarea y usuario">
      {error ? <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-yellow-400 font-medium">Pendientes</span><Clock3 className="h-5 w-5 text-yellow-400" /></div>
          <p className="text-3xl font-bold text-white">{totalPending}</p>
          <p className="text-xs text-slate-500 mt-1">Esperando revisión</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-emerald-400 font-medium">Aprobadas</span><CheckCircle2 className="h-5 w-5 text-emerald-400" /></div>
          <p className="text-3xl font-bold text-white">{totalApproved}</p>
          <p className="text-xs text-slate-500 mt-1">Validadas por CEO</p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-red-400 font-medium">Rechazadas</span><XCircle className="h-5 w-5 text-red-400" /></div>
          <p className="text-3xl font-bold text-white">{totalRejected}</p>
          <p className="text-xs text-slate-500 mt-1">Requieren corrección</p>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-400"><Filter className="h-4 w-4" /> Filtrar por:</div>
          <select className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
            <option value="all">Todos los usuarios</option>
            {team.filter((m) => m.role !== 'ceo').map((m) => <option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>)}
          </select>
          <select className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Aprobada</option>
            <option value="rejected">Rechazada</option>
          </select>
          <select className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Todos los tipos</option>
            <option value="image">Imagen</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="document">Documento</option>
          </select>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} evidencias</span>
        </div>
      </section>

      <section>
        {loading ? (
          <p className="text-center text-slate-400 py-12">Cargando evidencias...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
            <Shield className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay evidencias con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const task     = tasks.find((t) => t.id === item.task_id);
              const uploader = team.find((m) => m.id === item.uploaded_by);
              const cfg      = STATUS_CONFIG[item.status];
              const hasUrl   = !!signedUrls[item.id];
              return (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{task?.title ?? 'Tarea eliminada'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{uploader?.full_name ?? '—'} · {uploader?.role}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-lg border border-slate-700 px-2 py-1 uppercase">{item.file_type}</span>
                    {item.created_at && <span className="rounded-lg border border-slate-700 px-2 py-1">{new Date(item.created_at).toLocaleDateString('es-CO')}</span>}
                    {task?.phase && <span className="rounded-lg border border-slate-700 px-2 py-1">{task.phase}</span>}
                  </div>
                  {item.review_comment && <p className="text-xs text-slate-400 italic border-l-2 border-slate-700 pl-3">"{item.review_comment}"</p>}
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <button
                      onClick={() => handleGetUrl(item.id, item.file_url)}
                      disabled={loadingUrl === item.id}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {loadingUrl === item.id ? 'Generando...' : hasUrl ? 'Abrir archivo' : 'Ver archivo'}
                    </button>
                    {item.status === 'pending' && (
                      <>
                        <button disabled={busyId === item.id} onClick={() => handleReview(item.id, 'approved')} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                        </button>
                        <button disabled={busyId === item.id} onClick={() => handleReview(item.id, 'rejected')} className="flex items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50">
                          <XCircle className="h-3.5 w-3.5" /> Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}