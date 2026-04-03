import { useState } from 'react';
import { motion } from 'motion/react';
import { Scale, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { TaskCard, Task } from './TaskCard';
import { EnergyBar } from './EnergyBar';

interface SquadPanelProps {
  name: string;
  role: string;
  color: string;
  tasks: Task[];
  allTasks: Task[];
  onToggleTask: (id: string) => void;
  onValidateTask: (id: string) => void;
  isAdmin: boolean;
  energy: number;
  panicMode: boolean;
}

const regulatoryMilestones = [
  { id: 1, name: 'Documentación Técnica', status: 'completed', authority: 'INVIMA' },
  { id: 2, name: 'Estudios Clínicos Fase I', status: 'completed', authority: 'INVIMA' },
  { id: 3, name: 'Análisis de Riesgos ISO 14971', status: 'in-progress', authority: 'ISO' },
  { id: 4, name: 'Registro Sanitario Colombia', status: 'pending', authority: 'INVIMA' },
  { id: 5, name: 'Pre-submission FDA', status: 'pending', authority: 'FDA' },
  { id: 6, name: '510(k) Clearance', status: 'pending', authority: 'FDA' },
];

export function HeduPanel({ name, role, color, tasks, allTasks, onToggleTask, onValidateTask, isAdmin, energy, panicMode }: SquadPanelProps) {
  const [daysToLaunch, setDaysToLaunch] = useState(147);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 bg-emerald-500/20';
      case 'in-progress': return 'text-cyan-400 bg-cyan-500/20';
      case 'pending': return 'text-slate-400 bg-slate-500/20';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4 animate-pulse" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold" style={{ color }}>{name}</h3>
          <p className="text-sm text-slate-400">{role}</p>
        </div>
        <Scale className="w-8 h-8" style={{ color }} />
      </div>

      <EnergyBar name={name} energy={energy} color={color} />

      {/* Launch Countdown */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border border-emerald-500/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <h4 className="text-sm font-semibold text-white">Cronómetro de Lanzamiento</h4>
        </div>
        <div className="text-center">
          <motion.div
            className="text-5xl font-bold text-emerald-400"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {daysToLaunch}
          </motion.div>
          <p className="text-sm text-slate-300 mt-1">Días para el lanzamiento</p>
        </div>
        <div className="mt-3 h-2 bg-slate-800/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${((365 - daysToLaunch) / 365) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {/* Regulatory Checklist */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-cyan-500/30 backdrop-blur-sm">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          Checklist Regulatorio INVIMA/FDA
        </h4>
        <div className="space-y-2">
          {regulatoryMilestones.map(milestone => (
            <motion.div
              key={milestone.id}
              className={`p-3 rounded-lg border ${
                milestone.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/10' :
                milestone.status === 'in-progress' ? 'border-cyan-500/30 bg-cyan-500/10' :
                'border-slate-600/30 bg-slate-800/20'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: milestone.id * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(milestone.status)}
                  <span className="text-sm text-white">{milestone.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{milestone.authority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(milestone.status)}`}>
                    {milestone.status === 'completed' ? 'Completado' :
                     milestone.status === 'in-progress' ? 'En progreso' :
                     'Pendiente'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-white">Tareas de {name}</h4>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            allTasks={allTasks}
            onToggle={onToggleTask}
            onValidate={onValidateTask}
            isAdmin={isAdmin}
            panicMode={panicMode}
          />
        ))}
      </div>
    </div>
  );
}
