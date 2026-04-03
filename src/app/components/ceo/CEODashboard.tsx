import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { Task, Evidence } from '../../../types';
import { mockDB } from '../../../services/mockDatabase';
import { Shield, Cloud, Scale, Stethoscope, CheckCircle2, Clock, AlertCircle, TrendingUp, FileText, LogOut } from 'lucide-react';

export function CEODashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTasks(mockDB.getTasks(user?.id, user?.role));
    setEvidence(mockDB.getEvidence());
  };

  const handleValidateTask = (taskId: string) => {
    try {
      mockDB.validateTask(taskId, user!.id);
      loadData();
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleApproveEvidence = (evidenceId: string) => {
    mockDB.approveEvidence(evidenceId, user!.id, 'Aprobado por CEO');
    loadData();
  };

  const handleRejectEvidence = (evidenceId: string) => {
    const comment = prompt('Motivo del rechazo:');
    if (comment) {
      mockDB.rejectEvidence(evidenceId, user!.id, comment);
      loadData();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calculate metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const validatedTasks = tasks.filter(t => t.validated).length;
  const progress = totalTasks > 0 ? Math.round((validatedTasks / totalTasks) * 100) : 0;
  const pendingEvidence = evidence.filter(e => e.status === 'pending').length;

  // Group tasks by leader
  const hardwareTasks = tasks.filter(t => t.assignedTo === 'user-2');
  const softwareTasks = tasks.filter(t => t.assignedTo === 'user-3');
  const legalTasks = tasks.filter(t => t.assignedTo === 'user-4');
  const medicalTasks = tasks.filter(t => t.assignedTo === 'user-5');

  const getLeaderProgress = (leaderTasks: Task[]) => {
    const total = leaderTasks.length;
    const validated = leaderTasks.filter(t => t.validated).length;
    return total > 0 ? Math.round((validated / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/50 border-b border-cyan-500/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                CEO Dashboard
              </h1>
              <p className="text-sm text-slate-400">Vista Global del Proyecto</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.fullName}</p>
                <p className="text-xs text-slate-400">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            className="p-6 rounded-xl bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 border border-cyan-500/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-cyan-400" />
              <span className="text-3xl font-bold text-cyan-400">{progress}%</span>
            </div>
            <p className="text-sm text-slate-300">Progreso Global</p>
          </motion.div>

          <motion.div
            className="p-6 rounded-xl bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-500/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span className="text-3xl font-bold text-emerald-400">{validatedTasks}</span>
            </div>
            <p className="text-sm text-slate-300">Tareas Validadas</p>
          </motion.div>

          <motion.div
            className="p-6 rounded-xl bg-gradient-to-br from-amber-900/30 to-amber-800/20 border border-amber-500/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-amber-400" />
              <span className="text-3xl font-bold text-amber-400">{completedTasks - validatedTasks}</span>
            </div>
            <p className="text-sm text-slate-300">Pendientes de Validar</p>
          </motion.div>

          <motion.div
            className="p-6 rounded-xl bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-purple-400" />
              <span className="text-3xl font-bold text-purple-400">{pendingEvidence}</span>
            </div>
            <p className="text-sm text-slate-300">Evidencias Pendientes</p>
          </motion.div>
        </div>

        {/* Team Progress */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Progreso por Líder</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Jona', role: 'Hardware', tasks: hardwareTasks, icon: Shield, color: '#22d3ee' },
              { name: 'Sam', role: 'Software', tasks: softwareTasks, icon: Cloud, color: '#10b981' },
              { name: 'Hedu', role: 'Legal', tasks: legalTasks, icon: Scale, color: '#f59e0b' },
              { name: 'Cucho', role: 'Médico', tasks: medicalTasks, icon: Stethoscope, color: '#8b5cf6' },
            ].map((leader, idx) => {
              const Icon = leader.icon;
              const leaderProgress = getLeaderProgress(leader.tasks);
              return (
                <motion.div
                  key={leader.name}
                  className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-6 h-6" style={{ color: leader.color }} />
                    <div>
                      <h3 className="font-semibold text-white">{leader.name}</h3>
                      <p className="text-xs text-slate-400">{leader.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Progreso</span>
                      <span className="font-semibold" style={{ color: leader.color }}>{leaderProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: leader.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${leaderProgress}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{leader.tasks.filter(t => t.validated).length}/{leader.tasks.length} validadas</span>
                      <span>{leader.tasks.filter(t => t.completed && !t.validated).length} pendientes</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Validation Queue */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Cola de Validación</h2>
          <div className="space-y-3">
            {tasks
              .filter(t => t.completed && !t.validated)
              .map(task => (
                <motion.div
                  key={task.id}
                  className="p-4 rounded-lg bg-slate-900/50 border border-amber-500/30"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{task.title}</h4>
                      <p className="text-sm text-slate-400">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.priority === 'high' || task.priority === 'critical'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {task.priority}
                        </span>
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-amber-400">Esperando validación</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleValidateTask(task.id)}
                      className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Validar
                    </button>
                  </div>
                </motion.div>
              ))}
            {tasks.filter(t => t.completed && !t.validated).length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay tareas pendientes de validación</p>
              </div>
            )}
          </div>
        </div>

        {/* Evidence Review */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Revisión de Evidencias</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidence
              .filter(e => e.status === 'pending')
              .map(ev => (
                <motion.div
                  key={ev.id}
                  className="p-4 rounded-lg bg-slate-900/50 border border-purple-500/30"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      ev.fileType === 'video' ? 'bg-purple-500/20' :
                      ev.fileType === 'photo' ? 'bg-cyan-500/20' :
                      'bg-slate-500/20'
                    }`}>
                      <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{ev.fileName}</h4>
                      <p className="text-sm text-slate-400">{ev.description}</p>
                      {ev.painPoints.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ev.painPoints.map((point, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400"
                            >
                              {point}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveEvidence(ev.id)}
                      className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleRejectEvidence(ev.id)}
                      className="flex-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
                    >
                      Rechazar
                    </button>
                  </div>
                </motion.div>
              ))}
            {evidence.filter(e => e.status === 'pending').length === 0 && (
              <div className="col-span-2 text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay evidencias pendientes de revisión</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
