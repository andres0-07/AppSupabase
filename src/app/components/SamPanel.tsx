import { useState } from 'react';
import { motion } from 'motion/react';
import { Cloud, Database, Box, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

export function SamPanel({ name, role, color, tasks, allTasks, onToggleTask, onValidateTask, isAdmin, energy, panicMode }: SquadPanelProps) {
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const [modelLoadTime, setModelLoadTime] = useState(2.4);

  // Simulated inertial telemetry data (sine/cosine waves)
  const telemetryData = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    pitch: Math.sin(i * 0.3) * 45,
    roll: Math.cos(i * 0.4) * 30,
    yaw: Math.sin(i * 0.2) * 20,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold" style={{ color }}>{name}</h3>
          <p className="text-sm text-slate-400">{role}</p>
        </div>
        <Cloud className="w-8 h-8" style={{ color }} />
      </div>

      <EnergyBar name={name} energy={energy} color={color} />

      {/* Inertial Telemetry */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-cyan-500/30 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-semibold text-white">Telemetría Inercial en Vivo</h4>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={telemetryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '10px' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
            <Area type="monotone" dataKey="pitch" stackId="1" stroke="#22d3ee" fill="#22d3ee40" />
            <Area type="monotone" dataKey="roll" stackId="2" stroke="#10b981" fill="#10b98140" />
            <Area type="monotone" dataKey="yaw" stackId="3" stroke="#8b5cf6" fill="#8b5cf640" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-cyan-400 rounded-full" />
            <span className="text-slate-400">Pitch</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            <span className="text-slate-400">Roll</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full" />
            <span className="text-slate-400">Yaw</span>
          </div>
        </div>
      </div>

      {/* Database Status */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-emerald-500/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">Base de Datos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              dbStatus === 'online' ? 'bg-emerald-400 animate-pulse' :
              dbStatus === 'syncing' ? 'bg-cyan-400 animate-pulse' :
              'bg-red-400'
            }`} />
            <span className={`text-xs ${
              dbStatus === 'online' ? 'text-emerald-400' :
              dbStatus === 'syncing' ? 'text-cyan-400' :
              'text-red-400'
            }`}>
              {dbStatus === 'online' ? 'En línea' :
               dbStatus === 'syncing' ? 'Sincronizando' :
               'Fuera de línea'}
            </span>
          </div>
        </div>
      </div>

      {/* 3D Model Load Time */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-cyan-500/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Modelo 3D</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${
            modelLoadTime < 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {modelLoadTime.toFixed(1)}s
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: modelLoadTime, repeat: Infinity }}
          />
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
