import { motion } from 'motion/react';
import { Lock, Check, Clock, AlertCircle } from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dependsOn?: string[];
  validated: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  onToggle: (id: string) => void;
  onValidate: (id: string) => void;
  isAdmin: boolean;
  panicMode: boolean;
}

export function TaskCard({ task, allTasks, onToggle, onValidate, isAdmin, panicMode }: TaskCardProps) {
  // Check if task is blocked by dependencies
  const isBlocked = task.dependsOn?.some(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    return !depTask?.validated;
  });

  const priorityColors = {
    low: 'border-slate-600',
    medium: 'border-cyan-500/50',
    high: 'border-emerald-500',
  };

  const isPanicRelevant = panicMode && task.priority !== 'high';

  return (
    <motion.div
      className={`relative p-4 rounded-lg border backdrop-blur-sm ${
        isPanicRelevant ? 'opacity-40' : 'opacity-100'
      } ${priorityColors[task.priority]} ${
        isBlocked ? 'bg-slate-900/30' : 'bg-slate-800/30'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isPanicRelevant ? 0.4 : 1, y: 0 }}
      whileHover={{ scale: isPanicRelevant ? 1 : 1.02 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isBlocked && <Lock className="w-4 h-4 text-red-400" />}
            {task.priority === 'high' && <AlertCircle className="w-4 h-4 text-emerald-400" />}
            <h4 className={`font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
              {task.title}
            </h4>
          </div>
          
          {isBlocked && (
            <p className="text-xs text-red-400 mb-2 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Bloqueada por dependencias
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle(task.id)}
              disabled={isBlocked || isPanicRelevant}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                task.completed
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } ${(isBlocked || isPanicRelevant) && 'opacity-50 cursor-not-allowed'}`}
            >
              {task.completed ? 'Completada' : 'Marcar completada'}
            </button>

            {isAdmin && task.completed && !task.validated && (
              <button
                onClick={() => onValidate(task.id)}
                className="px-3 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Validar CEO
              </button>
            )}

            {task.validated && (
              <div className="flex items-center gap-1 text-emerald-400 text-xs">
                <Check className="w-4 h-4" />
                <span>Validado</span>
              </div>
            )}
          </div>
        </div>

        {!task.completed && (
          <Clock className="w-4 h-4 text-slate-500" />
        )}
      </div>
    </motion.div>
  );
}
