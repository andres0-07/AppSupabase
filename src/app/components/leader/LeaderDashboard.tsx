import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { Task, Evidence } from '../../../types';
import { mockDB } from '../../../services/mockDatabase';
import { CheckCircle2, Clock, Lock, Upload, FileText, LogOut, AlertCircle, TrendingUp } from 'lucide-react';

export function LeaderDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [uploadData, setUploadData] = useState({
    description: '',
    painPoints: '',
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    if (!user) return;
    setTasks(mockDB.getTasks(user.id, user.role));
    setEvidence(mockDB.getEvidence());
  };

  const handleToggleTask = (taskId: string) => {
    const task = mockDB.getTaskById(taskId);
    if (!task) return;
    
    mockDB.updateTask(taskId, {
      completed: !task.completed,
      status: !task.completed ? 'completed' : 'in_progress',
    });
    loadData();
  };

  const handleUploadEvidence = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowUploadForm(true);
  };

  const handleSubmitEvidence = () => {
    if (!user || !selectedTaskId) return;

    mockDB.addEvidence({
      taskId: selectedTaskId,
      uploadedBy: user.id,
      fileType: 'photo',
      fileName: `evidencia-${Date.now()}.jpg`,
      fileSize: 1024000,
      description: uploadData.description,
      painPoints: uploadData.painPoints.split(',').map(p => p.trim()).filter(Boolean),
      status: 'pending',
      url: 'https://example.com/placeholder.jpg',
    });

    setShowUploadForm(false);
    setUploadData({ description: '', painPoints: '' });
    setSelectedTaskId('');
    loadData();
    alert('Evidencia subida exitosamente. El CEO será notificado para su revisión.');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const myTasks = tasks;
  const completedTasks = myTasks.filter(t => t.completed).length;
  const validatedTasks = myTasks.filter(t => t.validated).length;
  const progress = myTasks.length > 0 ? Math.round((validatedTasks / myTasks.length) * 100) : 0;

  const isBlocked = (task: Task) => {
    if (!task.dependsOn) return false;
    const depTask = mockDB.getTaskById(task.dependsOn);
    return !depTask?.validated;
  };

  const getRoleInfo = () => {
    switch (user?.role) {
      case 'HardwareLeader':
        return { title: 'Hardware / Seguridad', color: '#22d3ee', icon: '🔧' };
      case 'SoftwareLeader':
        return { title: 'Cloud / App', color: '#10b981', icon: '☁️' };
      case 'LegalLeader':
        return { title: 'Legal / Biz', color: '#f59e0b', icon: '⚖️' };
      case 'MedicalLeader':
        return { title: 'Médico / Ortopedia', color: '#8b5cf6', icon: '🩺' };
      default:
        return { title: 'Líder', color: '#64748b', icon: '👤' };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/50 border-b border-cyan-500/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>{roleInfo.icon}</span>
                {user?.fullName}
              </h1>
              <p className="text-sm text-slate-400">{roleInfo.title}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium" style={{ color: roleInfo.color }}>
                  Progreso: {progress}%
                </p>
                <p className="text-xs text-slate-400">
                  {validatedTasks}/{myTasks.length} tareas validadas
                </p>
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
        {/* Progress Card */}
        <motion.div
          className="mb-8 p-6 rounded-xl bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Tu Progreso</h2>
              <p className="text-sm text-slate-400">Estado de tus tareas asignadas</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold" style={{ color: roleInfo.color }}>
                {progress}%
              </div>
              <div className="text-xs text-slate-400">Completado</div>
            </div>
          </div>
          
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: roleInfo.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-white">{myTasks.length}</div>
              <div className="text-xs text-slate-400">Total Tareas</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-500/10">
              <div className="text-2xl font-bold text-emerald-400">{completedTasks}</div>
              <div className="text-xs text-slate-400">Completadas</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-500/10">
              <div className="text-2xl font-bold text-amber-400">{completedTasks - validatedTasks}</div>
              <div className="text-xs text-slate-400">Esperando Validación</div>
            </div>
          </div>
        </motion.div>

        {/* Tasks Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Mis Tareas</h2>
          <div className="space-y-3">
            {myTasks.map((task, idx) => {
              const blocked = isBlocked(task);
              return (
                <motion.div
                  key={task.id}
                  className={`p-4 rounded-lg border ${
                    task.validated ? 'bg-emerald-500/10 border-emerald-500/30' :
                    task.completed ? 'bg-amber-500/10 border-amber-500/30' :
                    blocked ? 'bg-slate-900/30 border-red-500/30' :
                    'bg-slate-900/50 border-slate-700/50'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {blocked && <Lock className="w-4 h-4 text-red-400" />}
                        {task.priority === 'high' && <AlertCircle className="w-4 h-4 text-red-400" />}
                        {task.validated && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        <h4 className={`font-semibold ${
                          task.validated ? 'text-emerald-400' :
                          task.completed ? 'text-amber-400' :
                          'text-white'
                        }`}>
                          {task.title}
                        </h4>
                      </div>

                      {task.description && (
                        <p className="text-sm text-slate-400 mb-2">{task.description}</p>
                      )}

                      {blocked && (
                        <div className="flex items-center gap-1 mb-2 text-xs text-red-400">
                          <Lock className="w-3 h-3" />
                          <span>Bloqueada: Esperando dependencia</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.priority === 'high' || task.priority === 'critical'
                            ? 'bg-red-500/20 text-red-400'
                            : task.priority === 'medium'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {task.priority}
                        </span>
                        
                        {task.validated && (
                          <span className="text-xs flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Validado por CEO
                          </span>
                        )}

                        {task.completed && !task.validated && (
                          <span className="text-xs flex items-center gap-1 text-amber-400">
                            <Clock className="w-3 h-3" />
                            Esperando validación
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {!task.completed && !blocked && (
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          Marcar completada
                        </button>
                      )}

                      {task.completed && !task.validated && (
                        <button
                          onClick={() => handleUploadEvidence(task.id)}
                          className="px-3 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                        >
                          <Upload className="w-4 h-4" />
                          Subir Evidencia
                        </button>
                      )}

                      {task.validated && (
                        <div className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium text-center">
                          ✓ Validada
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {myTasks.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tienes tareas asignadas</p>
              </div>
            )}
          </div>
        </div>

        {/* My Evidence */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Mis Evidencias</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidence
              .filter(e => e.uploadedBy === user?.id)
              .map((ev, idx) => (
                <motion.div
                  key={ev.id}
                  className={`p-4 rounded-lg border ${
                    ev.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/30' :
                    ev.status === 'rejected' ? 'bg-red-500/10 border-red-500/30' :
                    'bg-slate-900/50 border-purple-500/30'
                  }`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-start gap-3">
                    <FileText className={`w-5 h-5 ${
                      ev.status === 'approved' ? 'text-emerald-400' :
                      ev.status === 'rejected' ? 'text-red-400' :
                      'text-purple-400'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{ev.fileName}</h4>
                      <p className="text-sm text-slate-400">{ev.description}</p>
                      
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          ev.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          ev.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {ev.status === 'approved' ? '✓ Aprobado' :
                           ev.status === 'rejected' ? '✗ Rechazado' :
                           '⏳ Pendiente de revisión'}
                        </span>
                      </div>

                      {ev.approvalComment && (
                        <p className="text-xs text-slate-400 mt-2 italic">
                          CEO: {ev.approvalComment}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

            {evidence.filter(e => e.uploadedBy === user?.id).length === 0 && (
              <div className="col-span-2 text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No has subido evidencias aún</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Upload Evidence Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <motion.div
            className="w-full max-w-md p-6 rounded-xl bg-slate-900 border border-cyan-500/30"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Subir Evidencia</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 text-white resize-none focus:outline-none focus:border-cyan-500"
                  rows={3}
                  placeholder="Describe la evidencia..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Puntos de dolor (separados por comas)
                </label>
                <input
                  type="text"
                  value={uploadData.painPoints}
                  onChange={(e) => setUploadData({ ...uploadData, painPoints: e.target.value })}
                  className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Dolor en flexión, sensor incómodo, etc."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmitEvidence}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors font-medium"
                >
                  Subir
                </button>
                <button
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadData({ description: '', painPoints: '' });
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
