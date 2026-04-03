import { useState } from 'react';
import { motion } from 'motion/react';
import { Stethoscope, TrendingUp, Activity, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

const exerciseData = [
  { exercise: 'Flexión', real: 85, ideal: 90, status: 'good' },
  { exercise: 'Extensión', real: 70, ideal: 80, status: 'warning' },
  { exercise: 'Rotación Int.', real: 45, ideal: 50, status: 'good' },
  { exercise: 'Rotación Ext.', real: 38, ideal: 45, status: 'warning' },
];

const validatedExercises = [
  { id: 1, name: 'Sentadilla Profunda', validated: true },
  { id: 2, name: 'Extensión de Rodilla', validated: true },
  { id: 3, name: 'Flexión Isométrica', validated: true },
  { id: 4, name: 'Marcha en Rampa', validated: false },
  { id: 5, name: 'Subir Escaleras', validated: false },
];

export function CuchoPanel({ name, role, color, tasks, allTasks, onToggleTask, onValidateTask, isAdmin, energy, panicMode }: SquadPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold" style={{ color }}>{name}</h3>
          <p className="text-sm text-slate-400">{role}</p>
        </div>
        <Stethoscope className="w-8 h-8" style={{ color }} />
      </div>

      <EnergyBar name={name} energy={energy} color={color} />

      {/* ROM Comparator */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-emerald-500/30 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-white">Comparador de Ángulos ROM</h4>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={exerciseData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="exercise" stroke="#64748b" style={{ fontSize: '10px' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '10px' }} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="real" name="Real" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ideal" name="Ideal" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-cyan-400 rounded-full" />
            <span className="text-slate-400">Ángulo Real</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            <span className="text-slate-400">Ángulo Ideal</span>
          </div>
        </div>
      </div>

      {/* Exercise Validation Library */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-cyan-500/30 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-semibold text-white">Biblioteca de Validación</h4>
        </div>
        <div className="space-y-2">
          {validatedExercises.map(exercise => (
            <motion.div
              key={exercise.id}
              className={`p-3 rounded-lg border ${
                exercise.validated 
                  ? 'border-emerald-500/30 bg-emerald-500/10' 
                  : 'border-slate-600/30 bg-slate-800/20'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: exercise.id * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">{exercise.name}</span>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  exercise.validated 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {exercise.validated ? '✓ Validado' : '⏳ Pendiente'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border border-emerald-500/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-white">Resumen de Desempeño</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="text-center p-2 rounded bg-slate-900/50">
            <div className="text-2xl font-bold text-emerald-400">87%</div>
            <div className="text-xs text-slate-400">Precisión ROM</div>
          </div>
          <div className="text-center p-2 rounded bg-slate-900/50">
            <div className="text-2xl font-bold text-cyan-400">3/5</div>
            <div className="text-xs text-slate-400">Ejercicios OK</div>
          </div>
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
