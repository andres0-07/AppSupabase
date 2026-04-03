  import { useEffect, useMemo, useState } from 'react';
  import {
    AlertTriangle, CheckCircle2, Clock3, FileWarning,
    Lock, Plus, Pencil, Trash2, Users, X, MessageSquare,
    BarChart2, Zap, ChevronDown, ChevronUp, Shield,
  } from 'lucide-react';
  import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  } from 'recharts';
  import { EventsManager } from '../components/EventsManager';
  import { AppShell } from '../components/layout/AppShell';
  import { StatCard } from '../components/dashboard/StatCard';
  import { useAuth } from '../../contexts/AuthContext';
  import {
    createTask, deleteTask, fetchAllProfiles, fetchAllTasks,
    fetchEvidenceForProfile, forceUnlockTask, reviewEvidence, sendCeoComment, updateTask,
  } from '../../services/taskService';
  import type { Evidence, Profile, Task, TaskPriority, TaskStatus } from '../../types';

  // ─── Constantes ───────────────────────────────────────────────────────────────

  const PRIORITY_LABEL: Record<TaskPriority, string> = { high: 'Alta', medium: 'Media', low: 'Baja' };
  const PRIORITY_COLOR: Record<TaskPriority, string> = {
    high: 'text-red-400 border-red-500/40 bg-red-500/10',
    medium: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
    low: 'text-slate-400 border-slate-600 bg-slate-800/50',
  };
  const STATUS_LABEL: Record<TaskStatus, string> = {
    pending: 'Pendiente', in_progress: 'En progreso', blocked: 'Bloqueada',
    pending_validation: 'Por validar', completed: 'Completada', rejected: 'Rechazada',
  };
  const STATUS_COLOR: Record<TaskStatus, string> = {
    pending: 'text-slate-400', in_progress: 'text-cyan-400', blocked: 'text-red-400',
    pending_validation: 'text-yellow-400', completed: 'text-emerald-400', rejected: 'text-red-500',
  };

  const PHASES = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Sin fase'];

  const EMPTY_FORM = {
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium' as TaskPriority,
    due_date: '',
    depends_on: '',
    phase: '',
    week_number: '',
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  function isOverdue(task: Task) {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  }

  function isStale(task: Task) {
    if (task.status === 'completed') return false;
    const ref = task.last_evidence ?? task.created_at;
    if (!ref) return false;
    return (Date.now() - new Date(ref).getTime()) / 86_400_000 > 3;
  }

  function getWeekNumber(date: Date) {
    const start = new Date(date.getFullYear(), 0, 1);
    return Math.ceil(((date.getTime() - start.getTime()) / 86_400_000 + start.getDay() + 1) / 7);
  }

  // ─── Componente principal ─────────────────────────────────────────────────────

  export function CEODashboardPage() {
    const { profile } = useAuth();

    const [tasks, setTasks]       = useState<Task[]>([]);
    const [team, setTeam]         = useState<Profile[]>([]);
    const [evidence, setEvidence] = useState<Evidence[]>([]);
    const [loading, setLoading]   = useState(true);
    const [busyId, setBusyId]     = useState<string | null>(null);
    const [error, setError]       = useState('');

    // Vista activa
    const [activeTab, setActiveTab] = useState<'tasks' | 'phases' | 'charts' | 'evidence' | 'events'>('tasks');

    // Formulario tarea
    const [showForm, setShowForm]       = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [saving, setSaving]           = useState(false);
    const [formError, setFormError]     = useState('');

    // Eliminar
    const [deleteTarget, setDeleteTarget]       = useState<Task | null>(null);
    const [releaseChildren, setReleaseChildren] = useState(true);

    // Aviso CEO
    const [commentTarget, setCommentTarget] = useState<Task | null>(null);
    const [commentText, setCommentText]     = useState('');

    // Fases expandidas
    const [expandedPhase, setExpandedPhase] = useState<string | null>(PHASES[0]);

    // ─── Carga de datos ─────────────────────────────────────────────────────────

    async function loadData() {
      if (!profile) return;
      setLoading(true);
      setError('');
      try {
        const [taskRows, teamRows, evidenceRows] = await Promise.all([
          fetchAllTasks(),
          fetchAllProfiles(),
          fetchEvidenceForProfile(profile),
        ]);
        setTasks(taskRows);
        setTeam(teamRows);
        setEvidence(evidenceRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando datos.');
      } finally {
        setLoading(false);
      }
    }

    useEffect(() => { loadData(); }, [profile?.id]);

    // ─── Métricas ────────────────────────────────────────────────────────────────

    const teamMembers    = useMemo(() => team.filter((p) => p.role !== 'ceo'), [team]);
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const pendingEvidence = evidence.filter((e) => e.status === 'pending').length;
    const alertTasks     = tasks.filter((t) => isOverdue(t) || isStale(t));
    const blockedTasks   = tasks.filter((t) => t.status === 'blocked');

    // Alertas de dependencia: tareas bloqueadas cuya tarea padre está completada pero siguen bloqueadas
    const dependencyAlerts = useMemo(() => tasks.filter((t) => {
      if (!t.depends_on) return false;
      const parent = tasks.find((p) => p.id === t.depends_on);
      return parent?.status === 'completed' && t.status === 'pending';
    }), [tasks]);

    // Hito
    const milestoneDate = new Date('2025-05-01');
    const today         = new Date();
    const totalDays     = milestoneDate.getTime() - new Date('2025-01-01').getTime();
    const elapsed       = Math.min(today.getTime() - new Date('2025-01-01').getTime(), totalDays);
    const timeProgress  = Math.max(0, Math.round((elapsed / totalDays) * 100));
    const taskProgress  = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const daysLeft      = Math.max(0, Math.ceil((milestoneDate.getTime() - today.getTime()) / 86_400_000));

    // ─── Datos para gráficas ──────────────────────────────────────────────────────

    const weeklyChartData = useMemo(() => {
      const thisWeek = getWeekNumber(today);
      const weeks: Record<number, { completadas: number; bloqueadas: number; enProgreso: number }> = {};

      for (let w = thisWeek - 3; w <= thisWeek; w++) {
        weeks[w] = { completadas: 0, bloqueadas: 0, enProgreso: 0 };
      }

      tasks.forEach((t) => {
        const ref = t.updated_at ?? t.created_at;
        if (!ref) return;
        const w = getWeekNumber(new Date(ref));
        if (!weeks[w]) return;
        if (t.status === 'completed')   weeks[w].completadas++;
        if (t.status === 'blocked')     weeks[w].bloqueadas++;
        if (t.status === 'in_progress') weeks[w].enProgreso++;
      });

      return Object.entries(weeks).map(([week, data]) => ({
        semana: `Sem ${week}`,
        ...data,
      }));
    }, [tasks]);

    // Rachas por miembro (semanas seguidas con 100% completadas)
    const memberStreaks = useMemo(() => teamMembers.map((member) => {
      const mt    = tasks.filter((t) => t.assigned_to === member.id);
      const done  = mt.filter((t) => t.status === 'completed').length;
      const pct   = mt.length ? Math.round((done / mt.length) * 100) : 0;
      const streak = pct === 100 && mt.length > 0 ? '🔥 ¡Al 100%!' : pct >= 50 ? '⚡ Buen ritmo' : '⏳ En progreso';
      return { ...member, pct, done, total: mt.length, streak };
    }), [teamMembers, tasks]);

    // Tareas agrupadas por fase
    const tasksByPhase = useMemo(() => {
      const map: Record<string, Task[]> = {};
      PHASES.forEach((p) => { map[p] = []; });
      tasks.forEach((t) => {
        const phase = (t as any).phase ?? 'Sin fase';
        const key   = PHASES.includes(phase) ? phase : 'Sin fase';
        map[key].push(t);
      });
      return map;
    }, [tasks]);

    // ─── Acciones ────────────────────────────────────────────────────────────────

    function openCreate() {
      setEditingTask(null);
      setForm(EMPTY_FORM);
      setFormError('');
      setShowForm(true);
    }

    function openEdit(task: Task) {
      setEditingTask(task);
      setForm({
        title:       task.title,
        description: task.description ?? '',
        assigned_to: task.assigned_to,
        priority:    task.priority ?? 'medium',
        due_date:    task.due_date ? task.due_date.slice(0, 10) : '',
        depends_on:  task.depends_on ?? '',
        phase:       (task as any).phase ?? '',
        week_number: String((task as any).week_number ?? ''),
      });
      setFormError('');
      setShowForm(true);
    }

    async function handleSave() {
      if (!form.title.trim() || !form.assigned_to) {
        setFormError('Título y responsable son obligatorios.');
        return;
      }
      setSaving(true);
      setFormError('');
      try {
        const payload = {
          title:       form.title.trim(),
          description: form.description.trim() || null,
          assigned_to: form.assigned_to,
          priority:    form.priority,
          due_date:    form.due_date || null,
          depends_on:  form.depends_on || null,
          phase:       form.phase || null,
          week_number: form.week_number ? parseInt(form.week_number) : null,
        };
        if (editingTask) {
          await updateTask(editingTask.id, payload);
        } else {
          await createTask(payload);
        }
        setShowForm(false);
        await loadData();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Error guardando tarea.');
      } finally {
        setSaving(false);
      }
    }

    async function handleForceUnlock(taskId: string) {
      setBusyId(taskId);
      try {
        await forceUnlockTask(taskId);
        await loadData();
      } finally {
        setBusyId(null);
      }
    }

    async function handleDelete() {
      if (!deleteTarget) return;
      setBusyId(deleteTarget.id);
      try {
        await deleteTask(deleteTarget.id, releaseChildren);
        setDeleteTarget(null);
        await loadData();
      } finally {
        setBusyId(null);
      }
    }

    async function handleSendComment() {
      if (!commentTarget || !commentText.trim()) return;
      setBusyId(commentTarget.id);
      try {
        await sendCeoComment(commentTarget.id, commentText.trim());
        setCommentTarget(null);
        setCommentText('');
        await loadData();
      } finally {
        setBusyId(null);
      }
    }

    async function handleReview(evidenceId: string, status: 'approved' | 'rejected') {
      if (!profile) return;
      setBusyId(evidenceId);
      try {
        await reviewEvidence({
          evidenceId, status, reviewerId: profile.id,
          reviewComment: status === 'approved' ? 'Validado por CEO' : 'Requiere ajustes',
        });
        await loadData();
      } finally {
        setBusyId(null);
      }
    }

    // ─── Render ───────────────────────────────────────────────────────────────────

    return (
      <AppShell title="Centro de Mando CEO" subtitle="BioTechK — Control total del proyecto">

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
        ) : null}

        {/* STATS */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Equipo"      value={teamMembers.length}  helper="Perfiles activos"                    icon={<Users       className="h-5 w-5" />} />
          <StatCard title="Tareas"      value={tasks.length}        helper={`${completedTasks} completadas`}     icon={<CheckCircle2 className="h-5 w-5" />} />
          <StatCard title="Evidencias"  value={pendingEvidence}     helper="Por validar"                         icon={<Clock3      className="h-5 w-5" />} />
          <StatCard title="Alertas"     value={alertTasks.length}   helper="Vencidas o sin actividad 3+ días"    icon={<FileWarning className="h-5 w-5" />} />
        </section>

        {/* HITO */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Hito: Prototipo — 1 de Mayo</h2>
              <p className="text-sm text-slate-400">{daysLeft} días restantes</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Avance de tareas</p>
              <p className="text-2xl font-bold text-cyan-400">{taskProgress}%</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-400"><span>Tareas completadas</span><span>{taskProgress}%</span></div>
              <div className="h-3 rounded-full bg-slate-800"><div className="h-3 rounded-full bg-cyan-400 transition-all" style={{ width: `${taskProgress}%` }} /></div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-400"><span>Tiempo transcurrido</span><span>{timeProgress}%</span></div>
              <div className="h-3 rounded-full bg-slate-800">
                <div className="h-3 rounded-full transition-all" style={{ width: `${timeProgress}%`, backgroundColor: taskProgress >= timeProgress ? '#34d399' : '#f87171' }} />
              </div>
            </div>
          </div>
          {taskProgress < timeProgress
            ? <p className="mt-3 text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> El avance va por detrás del tiempo.</p>
            : <p className="mt-3 text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> El proyecto va a tiempo.</p>}
        </section>

        {/* ALERTAS DE BLOQUEO */}
        {blockedTasks.length > 0 && (
          <section className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/5 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-red-400">
              <Zap className="h-4 w-4" /> 🚨 Tareas bloqueadas — requieren tu atención
            </h2>
            <div className="space-y-2">
              {blockedTasks.map((task) => {
                const assignee = team.find((m) => m.id === task.assigned_to);
                return (
                  <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-slate-950/60 p-3">
                    <div>
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="text-xs text-slate-400">{assignee?.full_name} · Bloqueada por el trabajador</p>
                    </div>
                    <button
                      onClick={() => { setCommentTarget(task); setCommentText(''); }}
                      className="flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                    >
                      <MessageSquare className="h-3 w-3" /> Enviar aviso
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ALERTAS DE DEPENDENCIA */}
        {dependencyAlerts.length > 0 && (
          <section className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-amber-400">
              <Shield className="h-4 w-4" /> Tareas desbloqueadas esperando inicio
            </h2>
            <div className="space-y-2">
              {dependencyAlerts.map((task) => {
                const assignee = team.find((m) => m.id === task.assigned_to);
                const parent   = tasks.find((t) => t.id === task.depends_on);
                return (
                  <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-slate-950/60 p-3">
                    <div>
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="text-xs text-slate-400">{assignee?.full_name} · La tarea anterior "{parent?.title}" ya está completa</p>
                    </div>
                    <button onClick={() => { updateTask(task.id, { status: 'in_progress' }); loadData(); }} className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-400 hover:bg-amber-500/40 border border-amber-500/30">⚡ Urgente iniciar</button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ALERTAS GENERALES */}
        {alertTasks.length > 0 && (
          <section className="mt-4 rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-orange-400">
              <AlertTriangle className="h-4 w-4" /> Tareas vencidas o sin actividad
            </h2>
            <div className="space-y-2">
              {alertTasks.map((task) => {
                const assignee = team.find((m) => m.id === task.assigned_to);
                return (
                  <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-500/20 bg-slate-950/60 p-3">
                    <div>
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="text-xs text-slate-400">{assignee?.full_name} · {isOverdue(task) ? '⚠️ Vencida' : '🕐 Sin actividad 3+ días'}</p>
                    </div>
                    <button
                      onClick={() => { setCommentTarget(task); setCommentText(''); }}
                      className="flex items-center gap-2 rounded-lg border border-orange-500/40 px-3 py-1.5 text-xs text-orange-300 hover:bg-orange-500/10"
                    >
                      <MessageSquare className="h-3 w-3" /> Enviar aviso
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TABS */}
        <div className="mt-6 flex gap-2 border-b border-slate-800 pb-0">
          {([
            { key: 'tasks',    label: 'Tareas',    icon: <CheckCircle2 className="h-4 w-4" /> },
            { key: 'phases',   label: 'Fases',     icon: <Lock         className="h-4 w-4" /> },
            { key: 'charts',   label: 'Gráficas',  icon: <BarChart2    className="h-4 w-4" /> },
            { key: 'evidence', label: 'Evidencias', icon: <FileWarning className="h-4 w-4" /> },
            { key: 'events', label: 'Eventos', icon: <Clock3 className="h-4 w-4" /> },
          ] as const).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === key
                  ? 'border border-b-0 border-slate-700 bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* TAB: TAREAS */}
        {activeTab === 'tasks' && (
          <section className="rounded-b-2xl rounded-tr-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold">Gestión de tareas</h2>
                <p className="text-sm text-slate-400">Crea, edita o elimina tareas del equipo</p>
              </div>
              <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400">
                <Plus className="h-4 w-4" /> Nueva tarea
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="pb-3 pr-4">Tarea</th>
                    <th className="pb-3 pr-4">Asignado</th>
                    <th className="pb-3 pr-4">Prioridad</th>
                    <th className="pb-3 pr-4">Estado</th>
                    <th className="pb-3 pr-4">Fase</th>
                    <th className="pb-3 pr-4">Fecha</th>
                    <th className="pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr><td colSpan={7} className="py-6 text-center text-slate-500">Cargando tareas...</td></tr>
                  ) : tasks.length === 0 ? (
                    <tr><td colSpan={7} className="py-6 text-center text-slate-500">No hay tareas. Crea la primera.</td></tr>
                  ) : tasks.map((task) => {
                    const assignee = team.find((m) => m.id === task.assigned_to);
                    const locked   = !!task.depends_on && !task.unlocked_at;
                    const alert    = isOverdue(task) || isStale(task);
                    return (
                      <tr key={task.id} className={alert ? 'bg-red-500/5' : ''}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            {locked ? <Lock className="h-3 w-3 text-slate-500 shrink-0" /> : null}
                            <span className={`font-medium ${alert ? 'text-red-300' : 'text-white'}`}>{task.title}</span>
                          </div>
                          {task.ceo_comment ? <p className="mt-1 text-xs text-amber-400">💬 Aviso activo</p> : null}
                        </td>
                        <td className="py-3 pr-4 text-slate-400">{assignee?.full_name ?? '—'}</td>
                        <td className="py-3 pr-4">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_COLOR[task.priority ?? 'medium']}`}>
                            {PRIORITY_LABEL[task.priority ?? 'medium']}
                          </span>
                        </td>
                        <td className={`py-3 pr-4 ${STATUS_COLOR[task.status]}`}>{STATUS_LABEL[task.status]}</td>
                        <td className="py-3 pr-4 text-slate-500 text-xs">{(task as any).phase ?? '—'}</td>
                        <td className="py-3 pr-4 text-slate-400">{task.due_date ? new Date(task.due_date).toLocaleDateString('es-CO') : '—'}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(task)} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-cyan-500 hover:text-cyan-400" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { setCommentTarget(task); setCommentText(task.ceo_comment ?? ''); }} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-amber-500 hover:text-amber-400" title="Aviso"><MessageSquare className="h-3.5 w-3.5" /></button>
                            {locked && (
                              <button
                                disabled={busyId === task.id}
                                onClick={() => handleForceUnlock(task.id)}
                                className="rounded-lg border border-violet-500/40 p-1.5 text-violet-400 hover:bg-violet-500/10 disabled:opacity-50"
                                title="Forzar desbloqueo"
                              >
                                <Zap className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button onClick={() => { setDeleteTarget(task); setReleaseChildren(true); }} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-red-500 hover:text-red-400" title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB: FASES */}
        {activeTab === 'phases' && (
          <section className="rounded-b-2xl rounded-tr-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Tareas por fase / semana</h2>
              <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400">
                <Plus className="h-4 w-4" /> Nueva tarea
              </button>
            </div>
            {PHASES.map((phase) => {
              const phaseTasks  = tasksByPhase[phase] ?? [];
              const done        = phaseTasks.filter((t) => t.status === 'completed').length;
              const pct         = phaseTasks.length ? Math.round((done / phaseTasks.length) * 100) : 0;
              const isOpen      = expandedPhase === phase;
              return (
                <div key={phase} className="rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden">
                  <button
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                    onClick={() => setExpandedPhase(isOpen ? null : phase)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-white">{phase}</span>
                      <span className="text-xs text-slate-500">{phaseTasks.length} tareas · {done} completadas</span>
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-slate-800">
                          <div className="h-1.5 rounded-full bg-cyan-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-cyan-400">{pct}%</span>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-800 divide-y divide-slate-800">
                      {phaseTasks.length === 0 ? (
                        <p className="px-5 py-4 text-sm text-slate-500">No hay tareas en esta fase.</p>
                      ) : phaseTasks.map((task) => {
                        const assignee = team.find((m) => m.id === task.assigned_to);
                        return (
                          <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                            <div>
                              <p className="font-medium text-white">{task.title}</p>
                              <p className="text-xs text-slate-500">{assignee?.full_name} · <span className={STATUS_COLOR[task.status]}>{STATUS_LABEL[task.status]}</span></p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => openEdit(task)} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-cyan-500 hover:text-cyan-400"><Pencil className="h-3.5 w-3.5" /></button>
                              <button onClick={() => { setDeleteTarget(task); setReleaseChildren(true); }} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-red-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* TAB: GRÁFICAS */}
        {activeTab === 'charts' && (
          <section className="rounded-b-2xl rounded-tr-2xl border border-slate-800 bg-slate-900 p-6 space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-1">Actividad por semana</h2>
              <p className="text-sm text-slate-400 mb-5">Comparación de las últimas 4 semanas</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyChartData} barSize={18}>
                  <XAxis dataKey="semana" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#94a3b8' }}
                  />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Bar dataKey="completadas" name="Completadas" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="enProgreso"  name="En progreso" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bloqueadas"  name="Bloqueadas"  fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Rachas por miembro */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Rachas del equipo</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {memberStreaks.map((member) => (
                  <div key={member.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-white">{member.full_name}</p>
                        <p className="text-xs text-slate-400">{member.role}</p>
                      </div>
                      <span className="text-sm font-bold text-cyan-400">{member.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 mb-2">
                      <div className="h-2 rounded-full bg-cyan-400 transition-all" style={{ width: `${member.pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-500">{member.total} tareas · {member.done} completadas</p>
                    <p className="mt-2 text-xs font-medium">{member.streak}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TAB: EVENTOS */}
        {activeTab === 'events' && (
          <section className="rounded-b-2xl rounded-tr-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold mb-1">Eventos y actividades</h2>
            <p className="text-sm text-slate-400 mb-5">Gestiona los eventos del equipo</p>
            <EventsManager />
          </section>
        )}

        {/* TAB: EVIDENCIAS */}
        {activeTab === 'evidence' && (
          <section className="rounded-b-2xl rounded-tr-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold mb-4">Tareas esperando visto bueno</h2>
          {tasks.filter((t) => t.status === 'pending_validation').length === 0 ? (
            <p className="text-sm text-slate-500">No hay tareas esperando aprobación. ✅</p>
          ) : (
            <div className="space-y-3 mb-8">
              {tasks.filter((t) => t.status === 'pending_validation').map((task) => {
                const assignee = team.find((m) => m.id === task.assigned_to);
                return (
                  <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                    <div>
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="text-xs text-slate-400">{assignee?.full_name} · {task.phase ?? 'Sin fase'}</p>
                      {task.ceo_comment && <p className="text-xs text-amber-400 mt-1">💬 {task.ceo_comment}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={busyId === task.id}
                        onClick={async () => { setBusyId(task.id); try { await updateTask(task.id, { status: 'completed' }); await loadData(); } finally { setBusyId(null); } }}
                        className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                      >✓ Aprobar</button>
                      <button
                        disabled={busyId === task.id}
                        onClick={async () => { setBusyId(task.id); try { await updateTask(task.id, { status: 'rejected' }); await loadData(); } finally { setBusyId(null); } }}
                        className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >Rechazar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <h2 className="text-xl font-semibold mb-4">Tareas esperando aprobación</h2>
          {tasks.filter((t) => t.status === 'pending_validation').length === 0 ? (
            <p className="text-sm text-slate-500 mb-6">No hay tareas esperando aprobación. ✅</p>
          ) : (
            <div className="space-y-3 mb-8">
              {tasks.filter((t) => t.status === 'pending_validation').map((task) => {
                const assignee = team.find((m) => m.id === task.assigned_to);
                return (
                  <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                    <div>
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{assignee?.full_name} · {task.phase ?? 'Sin fase'}</p>
                      {task.ceo_comment && <p className="text-xs text-amber-400 mt-1">💬 {task.ceo_comment}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={busyId === task.id}
                        onClick={async () => { setBusyId(task.id); try { await updateTask(task.id, { status: 'completed' }); await loadData(); } finally { setBusyId(null); } }}
                        className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                      >✓ Aprobar</button>
                      <button
                        disabled={busyId === task.id}
                        onClick={async () => { setBusyId(task.id); try { await updateTask(task.id, { status: 'rejected' }); await loadData(); } finally { setBusyId(null); } }}
                        className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >Rechazar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <h2 className="text-xl font-semibold mb-4">Evidencias por validar</h2>
            {evidence.filter((e) => e.status === 'pending').length === 0 ? (
              <p className="text-sm text-slate-500">No hay evidencias pendientes. ✅</p>
            ) : (
              <div className="space-y-3">
                {evidence.filter((e) => e.status === 'pending').map((item) => {
                  const task = tasks.find((t) => t.id === item.task_id);
                  return (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                      <div>
                        <p className="font-medium text-white">{item.file_type.toUpperCase()}</p>
                        <p className="text-xs text-slate-400">Tarea: {task?.title ?? item.task_id}</p>
                      </div>
                      <div className="flex gap-2">
                        <button disabled={busyId === item.id} onClick={() => handleReview(item.id, 'approved')} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50">Validar ✓</button>
                        <button disabled={busyId === item.id} onClick={() => handleReview(item.id, 'rejected')} className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50">Rechazar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Historial aprobadas/rechazadas */}
            {evidence.filter((e) => e.status !== 'pending').length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-semibold mb-3 text-slate-400">Historial revisado</h3>
                <div className="space-y-2">
                  {evidence.filter((e) => e.status !== 'pending').map((item) => {
                    const task = tasks.find((t) => t.id === item.task_id);
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{task?.title ?? 'Tarea'} — {item.file_type.toUpperCase()}</p>
                          {item.review_comment && <p className="text-xs text-slate-500 mt-0.5">{item.review_comment}</p>}
                        </div>
                        <span className={`text-xs font-medium ${item.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {item.status === 'approved' ? '✅ Aprobada' : '❌ Rechazada'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* PROGRESO POR MIEMBRO (siempre visible) */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">Progreso por miembro</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {memberStreaks.map((member) => (
              <div key={member.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{member.full_name}</p>
                    <p className="text-xs text-slate-400">{member.role}</p>
                  </div>
                  <span className="text-sm font-semibold text-cyan-400">{member.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-cyan-400 transition-all" style={{ width: `${member.pct}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{member.total} tareas · {member.done} completadas</p>
                <p className="mt-1 text-xs">{member.streak}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MODAL: CREAR / EDITAR */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold">{editingTask ? 'Editar tarea' : 'Nueva tarea'}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Título *</label>
                  <input className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Revisión de sensores biométricos" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Descripción</label>
                  <textarea className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalles de la tarea..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Asignado a *</label>
                    <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
                      <option value="">— Seleccionar —</option>
                      {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Prioridad</label>
                    <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baja</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Fase</label>
                    <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500" value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}>
                      <option value="">— Sin fase —</option>
                      {PHASES.filter((p) => p !== 'Sin fase').map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Fecha límite</label>
                    <input type="date" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Depende de</label>
                  <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500" value={form.depends_on} onChange={(e) => setForm({ ...form, depends_on: e.target.value })}>
                    <option value="">— Ninguna —</option>
                    {tasks.filter((t) => t.id !== editingTask?.id).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
                {formError && <p className="text-sm text-red-400">{formError}</p>}
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500">Cancelar</button>
                  <button onClick={handleSave} disabled={saving} className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
                    {saving ? 'Guardando...' : editingTask ? 'Guardar cambios' : 'Crear tarea'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ELIMINAR */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-red-400">Eliminar tarea</h3>
              <p className="mt-2 text-sm text-slate-300">¿Eliminar <span className="font-semibold text-white">"{deleteTarget.title}"</span>?</p>
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="mb-3 text-sm text-slate-400">Tareas que dependan de esta:</p>
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="radio" checked={releaseChildren} onChange={() => setReleaseChildren(true)} className="accent-cyan-400" />
                  <span className="text-sm text-slate-300">Liberar (quitar dependencia)</span>
                </label>
                <label className="mt-2 flex cursor-pointer items-center gap-3">
                  <input type="radio" checked={!releaseChildren} onChange={() => setReleaseChildren(false)} className="accent-red-400" />
                  <span className="text-sm text-slate-300">Eliminar también las tareas hijas</span>
                </label>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancelar</button>
                <button onClick={handleDelete} disabled={busyId === deleteTarget.id} className="rounded-xl bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-400 disabled:opacity-50">
                  {busyId === deleteTarget.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: AVISO CEO */}
        {commentTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-amber-400">Enviar aviso al equipo</h3>
                <button onClick={() => setCommentTarget(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <p className="mb-3 text-sm text-slate-400">Tarea: <span className="text-white">{commentTarget.title}</span></p>
              <textarea
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe el aviso que verá el responsable en su panel..."
              />
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setCommentTarget(null)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancelar</button>
                <button onClick={handleSendComment} disabled={!commentText.trim() || busyId === commentTarget.id} className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400 disabled:opacity-50">
                  {busyId === commentTarget.id ? 'Enviando...' : 'Enviar aviso'}
                </button>
              </div>
            </div>
          </div>
        )}

      </AppShell>
    );
  }