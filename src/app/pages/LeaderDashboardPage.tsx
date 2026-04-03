import { useEffect, useState } from 'react';
import {
  CheckCircle2, Lock, Circle, AlertTriangle, ChevronDown,
  ChevronUp, MessageSquare, Flag, Zap, Clock,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { fetchEvidenceForProfile, fetchTasksForProfile, updateTaskStatus, sendCeoComment } from '../../services/taskService';
import { uploadEvidenceFile } from '../../services/evidenceService';
import { fetchAnnouncements } from '../../services/financeService';
import type { Announcement, Evidence, EvidenceFileType, Task } from '../../types';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  blocked: 'Bloqueada',
  pending_validation: 'Esperando visto bueno del CEO',
  completed: 'Completada',
  rejected: 'Rechazada',
};

// ─── Estado del candado ──────────────────────────────────────────────────────
// 'locked'    → gris   → tarea padre no completada
// 'ceo_wait'  → amarillo → padre completada pero CEO no aprobó evidencia
// 'open'      → verde  → disponible

type LockState = 'locked' | 'ceo_wait' | 'open';

function getLockState(task: Task, allTasks: Task[]): LockState {
  if (!task.depends_on) return 'open';
  if (task.unlocked_at) return 'open';

  const parent = allTasks.find((t) => t.id === task.depends_on);
  if (!parent) return 'open';

  if (parent.status === 'completed') return 'ceo_wait';
  return 'locked';
}

function getNodeStyle(task: Task, lockState: LockState) {
  if (lockState === 'locked') {
    return {
      ring: 'border-slate-700 bg-slate-900',
      icon: <Lock className="h-6 w-6 text-slate-600" />,
      label: 'text-slate-600',
      lockBadge: (
        <span className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-500">
          <Lock className="h-3 w-3" /> Bloqueada
        </span>
      ),
    };
  }
  if (lockState === 'ceo_wait') {
    return {
      ring: 'border-yellow-500/50 bg-yellow-500/5',
      icon: <Clock className="h-6 w-6 text-yellow-400" />,
      label: 'text-yellow-300',
      lockBadge: (
        <span className="flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
          <Clock className="h-3 w-3" /> Esperando aprobación CEO
        </span>
      ),
    };
  }
  if (task.status === 'completed') {
    return {
      ring: 'border-emerald-500 bg-emerald-500/10',
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
      label: 'text-emerald-400',
      lockBadge: null,
    };
  }
  if (task.status === 'pending_validation') {
    return {
      ring: 'border-yellow-500 bg-yellow-500/10',
      icon: <Flag className="h-6 w-6 text-yellow-400" />,
      label: 'text-yellow-400',
      lockBadge: null,
    };
  }
  if (task.status === 'blocked') {
    return {
      ring: 'border-red-500 bg-red-500/10',
      icon: <AlertTriangle className="h-6 w-6 text-red-400" />,
      label: 'text-red-400',
      lockBadge: null,
    };
  }
  if (task.status === 'in_progress') {
    return {
      ring: 'border-cyan-500 bg-cyan-500/10',
      icon: <Zap className="h-6 w-6 text-cyan-400" />,
      label: 'text-cyan-400',
      lockBadge: null,
    };
  }
  return {
    ring: 'border-slate-600 bg-slate-900',
    icon: <Circle className="h-6 w-6 text-slate-400" />,
    label: 'text-slate-300',
    lockBadge: null,
  };
}

export function LeaderDashboardPage() {
  const { profile } = useAuth();
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId]     = useState<string | null>(null);

  const [completingTask, setCompletingTask]       = useState<Task | null>(null);
  const [completionComment, setCompletionComment] = useState('');

  const [evidenceTaskId, setEvidenceTaskId] = useState('');
  const [selectedType, setSelectedType]     = useState<EvidenceFileType>('image');
  const [selectedFile, setSelectedFile]     = useState<File | null>(null);
  const [uploading, setUploading]           = useState(false);
  const [uploadMessage, setUploadMessage]   = useState('');

  async function loadData() {
    if (!profile) return;
    setLoading(true);
    setError('');
    try {
      const [taskRows, evidenceRows, announcementRows] = await Promise.all([
        fetchTasksForProfile(profile),
        fetchEvidenceForProfile(profile),
        fetchAnnouncements(),
      ]);
      setTasks(taskRows);
      setEvidence(evidenceRows);
      setAnnouncements(announcementRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar tus datos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [profile?.id]);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const pastTasks    = tasks.filter((t) => t.status === 'completed');
  const currentTasks = tasks.filter((t) => ['in_progress', 'pending_validation', 'blocked'].includes(t.status));
  const futureTasks  = tasks.filter((t) => t.status === 'pending');

  async function handleComplete(task: Task) {
    setCompletingTask(task);
    setCompletionComment('');
  }

  async function confirmComplete() {
    if (!completingTask || !profile) return;
    setBusyId(completingTask.id);
    try {
      await updateTaskStatus(completingTask.id, 'pending_validation');
      if (completionComment.trim()) {
        await sendCeoComment(completingTask.id, `[Líder]: ${completionComment.trim()}`);
      }
      setCompletingTask(null);
      setCompletionComment('');
      await loadData();
    } finally {
      setBusyId(null);
    }
  }

  async function handleStartProgress(taskId: string) {
    setBusyId(taskId);
    try {
      await updateTaskStatus(taskId, 'in_progress');
      await loadData();
    } finally {
      setBusyId(null);
    }
  }

  async function handleReportBlock(taskId: string) {
    setBusyId(taskId);
    try {
      await updateTaskStatus(taskId, 'blocked');
      await loadData();
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !evidenceTaskId || !selectedFile) {
      setUploadMessage('Selecciona una tarea y un archivo.');
      return;
    }
    setUploading(true);
    setUploadMessage('');
    try {
      await uploadEvidenceFile({
        file: selectedFile,
        taskId: evidenceTaskId,
        uploadedBy: profile.id,
        fileType: selectedType,
      });
      setSelectedFile(null);
      setUploadMessage('Archivo subido. Quedó pendiente de validación del CEO.');
      await updateTaskStatus(evidenceTaskId, 'pending_validation');
      await loadData();
    } catch (err) {
      setUploadMessage(err instanceof Error ? err.message : 'No fue posible subir el archivo.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppShell title={`Hola, ${profile?.full_name?.split(' ')[0] ?? 'Líder'} 👋`} subtitle="Tu camino de progreso en BioTechK">
      {error ? <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* BARRA DE PROGRESO */}
      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Tu progreso general</h2>
            <p className="text-sm text-slate-400">{completedCount} de {tasks.length} tareas completadas</p>
          </div>
          <span className="text-3xl font-bold text-cyan-400">{progress}%</span>
        </div>
        <div className="h-4 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {announcements.length > 0 && (
        <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
          <p className="text-xs font-medium text-blue-400 flex items-center gap-2">
            📣 Avisos de Finanzas
          </p>
          {announcements.map((a) => (
            <p key={a.id} className="text-sm text-blue-200">{a.message}</p>
          ))}
        </div>
      )}

      {/* LEYENDA DE CANDADOS */}
      <div className="mb-6 flex flex-wrap gap-3">
        <span className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-400">
          <Lock className="h-3 w-3 text-slate-500" /> Gris — Bloqueada
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
          <Clock className="h-3 w-3" /> Amarillo — Esperando CEO
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Verde — Disponible
        </span>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.4fr_0.6fr]">
        {/* CAMINO DE MISIONES */}
        <section>
          <h2 className="mb-6 text-xl font-semibold">Camino de misiones</h2>
          {loading ? <p className="text-slate-400 text-sm">Cargando tareas...</p> : null}
          {!loading && tasks.length === 0 ? <p className="text-slate-400 text-sm">No tienes tareas asignadas aún.</p> : null}

          <div className="relative flex flex-col items-center gap-0">
            {tasks.map((task, index) => {
              const lockState   = getLockState(task, tasks);
              const isBlocked   = lockState === 'locked';
              const isCeoWait   = lockState === 'ceo_wait';
              const style       = getNodeStyle(task, lockState);
              const isExpanded  = expandedId === task.id;
              const taskEvidence = evidence.filter((e) => e.task_id === task.id);
              const canInteract = !isBlocked && !isCeoWait;

              return (
                <div key={task.id} className="flex w-full flex-col items-center">
                  {index > 0 && <div className="w-0.5 h-6 bg-slate-700" />}

                  <div className="w-full max-w-md">
                    <div
                      className={`rounded-2xl border-2 ${style.ring} p-4 transition-all ${
                        canInteract ? 'cursor-pointer hover:scale-[1.01]' : 'opacity-60 cursor-not-allowed'
                      }`}
                      onClick={() => canInteract && setExpandedId(isExpanded ? null : task.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${style.ring}`}>
                          {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${style.label}`}>{task.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{STATUS_LABEL[task.status]}</p>
                          {style.lockBadge && <div className="mt-1.5">{style.lockBadge}</div>}
                          {task.ceo_comment && (
                            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                              <p className="text-xs text-amber-400 flex items-center gap-1">
                                <MessageSquare className="h-3 w-3 shrink-0" />
                                <span className="font-medium">Aviso del CEO:</span>
                              </p>
                              <p className="text-xs text-amber-300 mt-0.5">{task.ceo_comment}</p>
                            </div>
                          )}
                        </div>
                        {canInteract && (
                          isExpanded
                            ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                            : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                      </div>

                      {/* Panel expandido */}
                      {isExpanded && canInteract && (
                        <div className="mt-4 border-t border-slate-700 pt-4 space-y-3">
                          {task.description && (
                            <p className="text-sm text-slate-400">{task.description}</p>
                          )}
                          {task.due_date && (
                            <p className="text-xs text-slate-500">Fecha límite: {new Date(task.due_date).toLocaleDateString('es-CO')}</p>
                          )}

                          {taskEvidence.length > 0 && (
                            <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 space-y-1">
                              <p className="text-xs font-medium text-slate-400">Evidencias subidas:</p>
                              {taskEvidence.map((e) => (
                                <p key={e.id} className="text-xs text-slate-500">
                                  {e.file_type.toUpperCase()} — {e.status === 'approved' ? '✅ Aprobada' : e.status === 'rejected' ? '❌ Rechazada' : '⏳ Pendiente CEO'}
                                </p>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 pt-1">
                            {task.status === 'pending' && (
                              <button
                                disabled={busyId === task.id}
                                onClick={(e) => { e.stopPropagation(); handleStartProgress(task.id); }}
                                className="rounded-lg border border-cyan-500/40 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50"
                              >
                                ▶ Iniciar
                              </button>
                            )}
                            {['pending', 'in_progress'].includes(task.status) && (
                              <button
                                disabled={busyId === task.id}
                                onClick={(e) => { e.stopPropagation(); handleComplete(task); }}
                                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                              >
                                ✓ Marcar lista
                              </button>
                            )}
                            {task.status !== 'blocked' && task.status !== 'completed' && task.status !== 'pending_validation' && (
                              <button
                                disabled={busyId === task.id}
                                onClick={(e) => { e.stopPropagation(); handleReportBlock(task.id); }}
                                className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                              >
                                🚨 Reportar bloqueo
                              </button>
                            )}
                            {task.status === 'in_progress' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setEvidenceTaskId(task.id); }}
                                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-400"
                              >
                                📎 Subir evidencia
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-lg font-semibold">Tu línea de tiempo</h2>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-emerald-400">✅ Completadas</p>
                {pastTasks.length === 0
                  ? <p className="text-xs text-slate-600">Aún no completaste tareas.</p>
                  : pastTasks.map((t) => <p key={t.id} className="text-sm text-slate-400 py-1 border-b border-slate-800 last:border-0">{t.title}</p>)}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-cyan-400">⚡ En curso</p>
                {currentTasks.length === 0
                  ? <p className="text-xs text-slate-600">Nada en curso ahora.</p>
                  : currentTasks.map((t) => <p key={t.id} className="text-sm text-white py-1 border-b border-slate-800 last:border-0 font-medium">{t.title}</p>)}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-slate-500">🔒 Pendientes</p>
                {futureTasks.length === 0
                  ? <p className="text-xs text-slate-600">No hay tareas pendientes.</p>
                  : futureTasks.map((t) => <p key={t.id} className="text-sm text-slate-600 py-1 border-b border-slate-800 last:border-0">{t.title}</p>)}
              </div>
            </div>
          </section>

          {evidenceTaskId && (
            <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Subir evidencia</h2>
                <button onClick={() => setEvidenceTaskId('')} className="text-slate-500 hover:text-white text-xs">✕ Cerrar</button>
              </div>
              <form className="space-y-3" onSubmit={handleUpload}>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Tarea</label>
                  <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" value={evidenceTaskId} onChange={(e) => setEvidenceTaskId(e.target.value)}>
                    {tasks.filter((t) => t.status !== 'completed').map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Tipo</label>
                  <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" value={selectedType} onChange={(e) => setSelectedType(e.target.value as EvidenceFileType)}>
                    <option value="image">Imagen</option>
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="document">Documento</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Archivo</label>
                  <input type="file" className="w-full rounded-xl border border-dashed border-slate-700 bg-slate-950 px-3 py-2 text-xs" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
                </div>
                {uploadMessage && <p className="text-xs text-slate-400">{uploadMessage}</p>}
                <button type="submit" disabled={uploading} className="w-full rounded-xl bg-cyan-500 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
                  {uploading ? 'Subiendo...' : 'Subir evidencia'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>

      {/* MODAL: COMPLETAR TAREA */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-emerald-400">¿Cómo te fue?</h3>
            <p className="mt-1 text-sm text-slate-400">{completingTask.title}</p>
            <p className="mt-2 text-xs text-slate-500">Al marcarla lista, quedará en estado "Esperando visto bueno del CEO" hasta que sea aprobada.</p>
            <textarea
              className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
              rows={4}
              value={completionComment}
              onChange={(e) => setCompletionComment(e.target.value)}
              placeholder="Opcional: cuenta qué hiciste, qué aprendiste o si hubo algo inesperado..."
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setCompletingTask(null)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancelar</button>
              <button
                onClick={confirmComplete}
                disabled={busyId === completingTask.id}
                className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {busyId === completingTask.id ? 'Guardando...' : '✓ Marcar lista'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}