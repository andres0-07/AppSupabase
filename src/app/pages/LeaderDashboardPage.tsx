import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2, Lock, Circle, AlertTriangle, ChevronDown,
  ChevronUp, MessageSquare, Flag, Zap, Clock,
  CalendarDays, Users, Heart, Send,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchEvidenceForProfile, fetchTasksForProfile,
  updateTaskStatus, sendCeoComment, fetchAllProfiles,
} from '../../services/taskService';
import { uploadEvidenceFile } from '../../services/evidenceService';
import { fetchAnnouncements } from '../../services/financeService';
import {
  fetchCommentsForTask, addTaskComment, fetchAllTasksWithTeam, fetchEvidenceForTask,
  type TaskComment,
} from '../../services/commentService';
import { supabase } from '../../lib/supabase';
import type { Announcement, Evidence, EvidenceFileType, Profile, Task } from '../../types';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  blocked: 'Bloqueada',
  pending_validation: 'Esperando visto bueno del CEO',
  completed: 'Completada',
  rejected: 'Rechazada',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-slate-500',
  in_progress: 'bg-cyan-500',
  blocked: 'bg-red-500',
  pending_validation: 'bg-yellow-500',
  completed: 'bg-emerald-500',
  rejected: 'bg-red-700',
};

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

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
  if (lockState === 'locked') return {
    ring: 'border-slate-700 bg-slate-900',
    icon: <Lock className="h-6 w-6 text-slate-600" />,
    label: 'text-slate-600',
    lockBadge: <span className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-500"><Lock className="h-3 w-3" /> Bloqueada</span>,
  };
  if (lockState === 'ceo_wait') return {
    ring: 'border-yellow-500/50 bg-yellow-500/5',
    icon: <Clock className="h-6 w-6 text-yellow-400" />,
    label: 'text-yellow-300',
    lockBadge: <span className="flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400"><Clock className="h-3 w-3" /> Esperando aprobación CEO</span>,
  };
  if (task.status === 'completed') return { ring: 'border-emerald-500 bg-emerald-500/10', icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />, label: 'text-emerald-400', lockBadge: null };
  if (task.status === 'pending_validation') return { ring: 'border-yellow-500 bg-yellow-500/10', icon: <Flag className="h-6 w-6 text-yellow-400" />, label: 'text-yellow-400', lockBadge: null };
  if (task.status === 'blocked') return { ring: 'border-red-500 bg-red-500/10', icon: <AlertTriangle className="h-6 w-6 text-red-400" />, label: 'text-red-400', lockBadge: null };
  if (task.status === 'rejected') return { ring: 'border-red-600 bg-red-600/10', icon: <AlertTriangle className="h-6 w-6 text-red-500" />, label: 'text-red-400', lockBadge: null };
  if (task.status === 'in_progress') return { ring: 'border-cyan-500 bg-cyan-500/10', icon: <Zap className="h-6 w-6 text-cyan-400" />, label: 'text-cyan-400', lockBadge: null };
  return { ring: 'border-slate-600 bg-slate-900', icon: <Circle className="h-6 w-6 text-slate-400" />, label: 'text-slate-300', lockBadge: null };
}

function EvidenceViewer({ taskId }: { taskId: string }) {
  const [items, setItems] = useState<import('../../services/commentService').TaskEvidence[]>([]);
  const [urls, setUrls]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchEvidenceForTask(taskId).then(setItems).finally(() => setLoading(false));
  }, [taskId]);
  async function handleOpen(item: import('../../services/commentService').TaskEvidence) {
    if (urls[item.id]) { window.open(urls[item.id], '_blank'); return; }
    try {
      const { data, error } = await supabase.storage.from('evidence').createSignedUrl(item.file_url, 60 * 30);
      if (error) throw error;
      setUrls((prev) => ({ ...prev, [item.id]: data.signedUrl }));
      window.open(data.signedUrl, '_blank');
    } catch { alert('No se pudo abrir el archivo.'); }
  }
  if (loading) return <p className="text-xs text-slate-500 mb-3">Cargando evidencias...</p>;
  if (items.length === 0) return <p className="text-xs text-slate-500 mb-3">Sin evidencias subidas.</p>;
  return (
    <div className="mb-4 rounded-xl border border-slate-700 bg-slate-950/50 p-3 space-y-2">
      <p className="text-xs font-medium text-slate-400">📎 Evidencias</p>
      {items.map((item) => (
        <button key={item.id} onClick={() => handleOpen(item)} className="flex w-full items-center justify-between rounded-lg border border-slate-700 px-3 py-2 text-xs hover:border-cyan-500 hover:text-cyan-300 transition-colors">
          <span>{item.file_type.toUpperCase()} — {item.status === 'approved' ? '✅' : item.status === 'rejected' ? '❌' : '⏳'} {item.status}</span>
          <span className="text-slate-500">Abrir →</span>
        </button>
      ))}
    </div>
  );
}

export function LeaderDashboardPage() {
  const { profile } = useAuth();
  const mountedRef = useRef(true);

  const [tasks, setTasks]                 = useState<Task[]>([]);
  const [allTasks, setAllTasks]           = useState<Task[]>([]);
  const [team, setTeam]                   = useState<Profile[]>([]);
  const [evidence, setEvidence]           = useState<Evidence[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [busyId, setBusyId]               = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'missions' | 'calendar' | 'team'>('missions');

  const [expandedId, setExpandedId]               = useState<string | null>(null);
  const [completingTask, setCompletingTask]       = useState<Task | null>(null);
  const [completionComment, setCompletionComment] = useState('');
  const [evidenceTaskId, setEvidenceTaskId]       = useState('');
  const [selectedType, setSelectedType]           = useState<EvidenceFileType>('image');
  const [selectedFile, setSelectedFile]           = useState<File | null>(null);
  const [uploading, setUploading]                 = useState(false);
  const [uploadMessage, setUploadMessage]         = useState('');

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showAllTasks, setShowAllTasks] = useState(false);

  const [selectedTeamTask, setSelectedTeamTask] = useState<Task | null>(null);
  const [comments, setComments]                 = useState<TaskComment[]>([]);
  const [newComment, setNewComment]             = useState('');
  const [savingComment, setSavingComment]       = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  async function loadData() {
    if (!profile || !mountedRef.current) return;
    setLoading(true);
    setError('');
    try {
      const [taskRows, evidenceRows, announcementRows, allTaskRows, teamRows] = await Promise.all([
        fetchTasksForProfile(profile),
        fetchEvidenceForProfile(profile),
        fetchAnnouncements(),
        fetchAllTasksWithTeam(),
        fetchAllProfiles(),
      ]);
      if (!mountedRef.current) return;
      setTasks(taskRows);
      setEvidence(evidenceRows);
      setAnnouncements(announcementRows);
      setAllTasks(allTaskRows);
      setTeam(teamRows);
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : 'No fue posible cargar tus datos.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [profile?.id]);

  async function openTeamTask(task: Task) {
    setSelectedTeamTask(task);
    const c = await fetchCommentsForTask(task.id);
    setComments(c);
    setNewComment('');
  }

  async function handleAddComment(isSupport: boolean) {
    if (!profile || !selectedTeamTask) return;
    if (!isSupport && !newComment.trim()) return;
    setSavingComment(true);
    try {
      await addTaskComment({ taskId: selectedTeamTask.id, authorId: profile.id, comment: isSupport ? '👋 Apoyé esta tarea' : newComment.trim(), isSupport });
      const updated = await fetchCommentsForTask(selectedTeamTask.id);
      setComments(updated);
      setNewComment('');
    } finally { setSavingComment(false); }
  }

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const pastTasks    = tasks.filter((t) => t.status === 'completed');
  const currentTasks = tasks.filter((t) => ['in_progress', 'pending_validation', 'blocked'].includes(t.status));
  const futureTasks  = tasks.filter((t) => t.status === 'pending');
  const rejectedTasks = tasks.filter((t) => t.status === 'rejected');

  const calendarTasks = showAllTasks ? allTasks : tasks;
  const calendarDays = useMemo(() => {
    const year  = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < first; i++) days.push(null);
    for (let d = 1; d <= total; d++) days.push(d);
    return days;
  }, [calendarDate]);

  function getTasksForDay(day: number) {
    const year  = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    return calendarTasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  async function confirmComplete() {
    if (!completingTask || !profile) return;
    setBusyId(completingTask.id);
    try {
      await updateTaskStatus(completingTask.id, 'pending_validation');
      if (completionComment.trim()) await sendCeoComment(completingTask.id, `[Líder]: ${completionComment.trim()}`);
      setCompletingTask(null);
      setCompletionComment('');
      await loadData();
    } finally { if (mountedRef.current) setBusyId(null); }
  }

  async function handleStartProgress(taskId: string) {
    setBusyId(taskId);
    try { await updateTaskStatus(taskId, 'in_progress'); await loadData(); }
    finally { if (mountedRef.current) setBusyId(null); }
  }

  async function handleReportBlock(taskId: string) {
    setBusyId(taskId);
    try { await updateTaskStatus(taskId, 'blocked'); await loadData(); }
    finally { if (mountedRef.current) setBusyId(null); }
  }

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !evidenceTaskId || !selectedFile) { setUploadMessage('Selecciona una tarea y un archivo.'); return; }
    setUploading(true);
    setUploadMessage('');
    try {
      await uploadEvidenceFile({ file: selectedFile, taskId: evidenceTaskId, uploadedBy: profile.id, fileType: selectedType });
      setSelectedFile(null);
      setUploadMessage('Archivo subido. Quedó pendiente de validación del CEO.');
      await updateTaskStatus(evidenceTaskId, 'pending_validation');
      await loadData();
    } catch (err) {
      setUploadMessage(err instanceof Error ? err.message : 'No fue posible subir el archivo.');
    } finally { if (mountedRef.current) setUploading(false); }
  }

  return (
    <AppShell title={`Hola, ${profile?.full_name?.split(' ')[0] ?? 'Líder'} 👋`} subtitle="Tu camino de progreso">
      {error ? <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* ALERTA: TAREAS RECHAZADAS */}
      {rejectedTasks.length > 0 && (
        <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/5 p-4 space-y-2">
          <p className="text-sm font-semibold text-red-400 flex items-center gap-2">
            ❌ {rejectedTasks.length === 1 ? 'Una tarea fue rechazada' : `${rejectedTasks.length} tareas fueron rechazadas`} — requieren tu atención
          </p>
          {rejectedTasks.map((t) => (
            <div key={t.id} className="rounded-lg border border-red-500/20 bg-slate-950/50 px-3 py-2">
              <p className="text-sm font-medium text-white">{t.title}</p>
              {t.ceo_comment && <p className="text-xs text-red-300 mt-0.5">💬 {t.ceo_comment}</p>}
            </div>
          ))}
        </div>
      )}

      {/* BARRA DE PROGRESO */}
      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Tu progreso general</h2>
            <p className="text-sm text-slate-400">{completedCount} de {tasks.length} tareas completadas</p>
          </div>
          <span className="text-3xl font-bold text-cyan-400">{progress}%</span>
        </div>
        <div className="h-4 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-4 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </section>

      {/* AVISOS */}
      {announcements.length > 0 && (
        <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
          <p className="text-xs font-medium text-blue-400 flex items-center gap-2">📣 Avisos de Finanzas</p>
          {announcements.map((a) => <p key={a.id} className="text-sm text-blue-200">{a.message}</p>)}
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 border-b border-slate-800 mb-0">
        {([
          { key: 'missions', label: 'Mis misiones', icon: <Zap className="h-4 w-4" /> },
          { key: 'calendar', label: 'Calendario',   icon: <CalendarDays className="h-4 w-4" /> },
          { key: 'team',     label: 'Mi equipo',    icon: <Users className="h-4 w-4" /> },
        ] as const).map(({ key, label, icon }) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-all ${activeTab === key ? 'border border-b-0 border-slate-700 bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* TAB: MISIONES */}
      {activeTab === 'missions' && (
        <div className="rounded-b-2xl rounded-tr-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-6 flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-400"><Lock className="h-3 w-3 text-slate-500" /> Gris — Bloqueada</span>
            <span className="flex items-center gap-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400"><Clock className="h-3 w-3" /> Amarillo — Esperando CEO</span>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Verde — Disponible</span>
            <span className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-400"><AlertTriangle className="h-3 w-3" /> Rojo — Rechazada</span>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.4fr_0.6fr]">
            <section>
              <h2 className="mb-6 text-xl font-semibold">Camino de misiones</h2>
              {loading ? <p className="text-slate-400 text-sm">Cargando tareas...</p> : null}
              {!loading && tasks.length === 0 ? <p className="text-slate-400 text-sm">No tienes tareas asignadas aún.</p> : null}
              <div className="relative flex flex-col items-center gap-0">
                {tasks.map((task, index) => {
                  const lockState    = getLockState(task, tasks);
                  const isBlocked    = lockState === 'locked';
                  const isCeoWait    = lockState === 'ceo_wait';
                  const isRejected   = task.status === 'rejected';
                  const style        = getNodeStyle(task, lockState);
                  const isExpanded   = expandedId === task.id;
                  const taskEvidence = evidence.filter((e) => e.task_id === task.id);
                  const canInteract  = !isBlocked && !isCeoWait;
                  return (
                    <div key={task.id} className="flex w-full flex-col items-center">
                      {index > 0 && <div className="w-0.5 h-6 bg-slate-700" />}
                      <div className="w-full max-w-md">
                        <div
                          className={`rounded-2xl border-2 ${style.ring} p-4 transition-all ${canInteract ? 'cursor-pointer hover:scale-[1.01]' : 'opacity-60 cursor-not-allowed'}`}
                          onClick={() => canInteract && setExpandedId(isExpanded ? null : task.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${style.ring}`}>{style.icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold ${style.label}`}>{task.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{STATUS_LABEL[task.status]}</p>
                              {style.lockBadge && <div className="mt-1.5">{style.lockBadge}</div>}

                              {/* Alerta de rechazo */}
                              {isRejected && (
                                <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                                  <p className="text-xs text-red-400 font-medium">❌ Tarea rechazada por el CEO</p>
                                  {task.ceo_comment && <p className="text-xs text-red-300 mt-0.5">{task.ceo_comment}</p>}
                                  <p className="text-xs text-slate-400 mt-1">Corrígela y vuelve a marcarla como lista.</p>
                                </div>
                              )}

                              {/* Aviso CEO normal */}
                              {!isRejected && task.ceo_comment && (
                                <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                                  <p className="text-xs text-amber-400 flex items-center gap-1"><MessageSquare className="h-3 w-3 shrink-0" /><span className="font-medium">Aviso del CEO:</span></p>
                                  <p className="text-xs text-amber-300 mt-0.5">{task.ceo_comment}</p>
                                </div>
                              )}
                            </div>
                            {canInteract && (isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />)}
                          </div>

                          {isExpanded && canInteract && (
                            <div className="mt-4 border-t border-slate-700 pt-4 space-y-3">
                              {task.description && <p className="text-sm text-slate-400">{task.description}</p>}
                              {task.due_date && <p className="text-xs text-slate-500">Fecha límite: {new Date(task.due_date).toLocaleDateString('es-CO')}</p>}
                              {taskEvidence.length > 0 && (
                                <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 space-y-1">
                                  <p className="text-xs font-medium text-slate-400">Evidencias subidas:</p>
                                  {taskEvidence.map((e) => <p key={e.id} className="text-xs text-slate-500">{e.file_type.toUpperCase()} — {e.status === 'approved' ? '✅ Aprobada' : e.status === 'rejected' ? '❌ Rechazada' : '⏳ Pendiente CEO'}</p>)}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 pt-1">
                                {task.status === 'pending' && <button disabled={busyId === task.id} onClick={(e) => { e.stopPropagation(); handleStartProgress(task.id); }} className="rounded-lg border border-cyan-500/40 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50">▶ Iniciar</button>}
                                {['pending', 'in_progress', 'rejected'].includes(task.status) && <button disabled={busyId === task.id} onClick={(e) => { e.stopPropagation(); setCompletingTask(task); setCompletionComment(''); }} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50">✓ {task.status === 'rejected' ? 'Reenviar' : 'Marcar lista'}</button>}
                                {task.status !== 'blocked' && task.status !== 'completed' && task.status !== 'pending_validation' && task.status !== 'rejected' && <button disabled={busyId === task.id} onClick={(e) => { e.stopPropagation(); handleReportBlock(task.id); }} className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50">🚨 Reportar bloqueo</button>}
                                {task.status === 'in_progress' && <button onClick={(e) => { e.stopPropagation(); setEvidenceTaskId(task.id); }} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-400">📎 Subir evidencia</button>}
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

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="mb-4 text-lg font-semibold">Tu línea de tiempo</h2>
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-widest text-emerald-400">✅ Completadas</p>
                    {pastTasks.length === 0 ? <p className="text-xs text-slate-600">Aún no completaste tareas.</p> : pastTasks.map((t) => <p key={t.id} className="text-sm text-slate-400 py-1 border-b border-slate-800 last:border-0">{t.title}</p>)}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-widest text-cyan-400">⚡ En curso</p>
                    {currentTasks.length === 0 ? <p className="text-xs text-slate-600">Nada en curso ahora.</p> : currentTasks.map((t) => <p key={t.id} className="text-sm text-white py-1 border-b border-slate-800 last:border-0 font-medium">{t.title}</p>)}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-widest text-slate-500">🔒 Pendientes</p>
                    {futureTasks.length === 0 ? <p className="text-xs text-slate-600">No hay tareas pendientes.</p> : futureTasks.map((t) => <p key={t.id} className="text-sm text-slate-600 py-1 border-b border-slate-800 last:border-0">{t.title}</p>)}
                  </div>
                  {rejectedTasks.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-red-400">❌ Rechazadas</p>
                      {rejectedTasks.map((t) => <p key={t.id} className="text-sm text-red-400 py-1 border-b border-slate-800 last:border-0">{t.title}</p>)}
                    </div>
                  )}
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
                    <button type="submit" disabled={uploading} className="w-full rounded-xl bg-cyan-500 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-50">{uploading ? 'Subiendo...' : 'Subir evidencia'}</button>
                  </form>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: CALENDARIO */}
      {activeTab === 'calendar' && (
        <div className="rounded-b-2xl rounded-tr-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:border-slate-500">←</button>
              <h2 className="text-xl font-semibold">{MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}</h2>
              <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:border-slate-500">→</button>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`relative h-5 w-9 rounded-full transition-colors ${showAllTasks ? 'bg-cyan-500' : 'bg-slate-700'}`} onClick={() => setShowAllTasks(!showAllTasks)}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${showAllTasks ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-slate-400">Ver tareas del equipo</span>
            </label>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => <div key={d} className="text-center text-xs font-medium text-slate-500 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} />;
              const dayTasks = getTasksForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === calendarDate.getMonth() && new Date().getFullYear() === calendarDate.getFullYear();
              return (
                <div key={i} className={`min-h-[80px] rounded-xl border p-1.5 ${isToday ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-800 bg-slate-950/50'}`}>
                  <p className={`text-xs font-medium mb-1 ${isToday ? 'text-cyan-400' : 'text-slate-500'}`}>{day}</p>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((t) => {
                      const assignee = team.find((m) => m.id === t.assigned_to);
                      return (
                        <div key={t.id} className={`rounded px-1 py-0.5 text-xs truncate ${STATUS_COLOR[t.status]} bg-opacity-20 text-white`} title={`${t.title} — ${assignee?.full_name ?? ''}`}>
                          {t.title}
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && <p className="text-xs text-slate-500">+{dayTasks.length - 3} más</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(STATUS_COLOR).map(([status, color]) => (
              <span key={status} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className={`h-2 w-2 rounded-full ${color}`} />
                {STATUS_LABEL[status]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* TAB: EQUIPO */}
      {activeTab === 'team' && (
        <div className="rounded-b-2xl rounded-tr-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold mb-1">Tareas del equipo</h2>
          <p className="text-sm text-slate-400 mb-5">Puedes ver, comentar y marcar apoyo en las tareas de tus compañeros.</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {allTasks.map((task) => {
              const assignee = team.find((m) => m.id === task.assigned_to);
              const isOwn    = task.assigned_to === profile?.id;
              return (
                <div key={task.id} className={`rounded-2xl border p-4 cursor-pointer hover:border-slate-600 transition-all ${isOwn ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-slate-800 bg-slate-950/50'}`} onClick={() => openTeamTask(task)}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-white text-sm">{task.title}</p>
                    <span className={`shrink-0 h-2 w-2 rounded-full mt-1.5 ${STATUS_COLOR[task.status]}`} title={STATUS_LABEL[task.status]} />
                  </div>
                  <p className="text-xs text-slate-400">{assignee?.full_name ?? '—'} · {assignee?.role}</p>
                  <p className="text-xs text-slate-500 mt-1">{STATUS_LABEL[task.status]}</p>
                  {task.due_date && <p className="text-xs text-slate-600 mt-1">📅 {new Date(task.due_date).toLocaleDateString('es-CO')}</p>}
                  {isOwn && <span className="mt-2 inline-block rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs text-cyan-400">Tu tarea</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: TAREA DEL EQUIPO */}
      {selectedTeamTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold text-white mb-2 ${STATUS_COLOR[selectedTeamTask.status]}`}>{STATUS_LABEL[selectedTeamTask.status]}</span>
                <h3 className="text-xl font-bold text-white">{selectedTeamTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTeamTask(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            {selectedTeamTask.description && <p className="text-sm text-slate-300 mb-3">{selectedTeamTask.description}</p>}
            {selectedTeamTask.due_date && <p className="text-xs text-slate-500 mb-3">📅 {new Date(selectedTeamTask.due_date).toLocaleDateString('es-CO')}</p>}
            <EvidenceViewer taskId={selectedTeamTask.id} />
            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Comentarios</h4>
                <button disabled={savingComment} onClick={() => handleAddComment(true)} className="flex items-center gap-1.5 rounded-lg border border-pink-500/30 bg-pink-500/5 px-3 py-1 text-xs text-pink-400 hover:bg-pink-500/10">
                  <Heart className="h-3.5 w-3.5" /> Apoyar
                </button>
              </div>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-4 italic">Nadie ha comentado aún.</p>
                ) : comments.map((c) => {
                  const author = team.find(m => m.id === c.author_id);
                  return (
                    <div key={c.id} className={`rounded-xl p-3 ${c.is_support ? 'bg-pink-500/5 border border-pink-500/10' : 'bg-slate-800/50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{author?.full_name ?? 'Usuario'}</span>
                        <span className="text-[10px] text-slate-600">{new Date(c.created_at ?? '').toLocaleDateString()}</span>
                      </div>
                      <p className={`text-xs ${c.is_support ? 'text-pink-300 font-medium' : 'text-slate-300'}`}>{c.comment}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Escribe un mensaje..." className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment(false)} />
                <button disabled={savingComment || !newComment.trim()} onClick={() => handleAddComment(false)} className="rounded-xl bg-cyan-500 p-2 text-slate-950 hover:bg-cyan-400 disabled:opacity-50"><Send className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETAR */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-emerald-400">{completingTask.status === 'rejected' ? '🔁 Reenviar tarea corregida' : '¿Cómo te fue?'}</h3>
            <p className="mt-1 text-sm text-slate-400">{completingTask.title}</p>
            <p className="mt-2 text-xs text-slate-500">Quedará en "Esperando visto bueno del CEO" hasta ser aprobada.</p>
            <textarea className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white focus:border-emerald-500 focus:outline-none" placeholder={completingTask.status === 'rejected' ? 'Explica qué corregiste...' : 'Ej: Ya envié el reporte por correo...'} rows={3} value={completionComment} onChange={(e) => setCompletionComment(e.target.value)} />
            <div className="mt-6 flex gap-3">
              <button onClick={() => setCompletingTask(null)} className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800">Cancelar</button>
              <button onClick={confirmComplete} className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-slate-950 hover:bg-emerald-400">
                {completingTask.status === 'rejected' ? 'Reenviar' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}