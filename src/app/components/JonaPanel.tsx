import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Wifi, Lock, ToggleLeft, ToggleRight, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

export function JonaPanel({ name, role, color, tasks, allTasks, onToggleTask, onValidateTask, isAdmin, energy, panicMode }: SquadPanelProps) {
  const [sslEnabled, setSslEnabled] = useState(true);
  const [latency, setLatency] = useState(45);

  // Simulated network latency data
  const latencyData = Array.from({ length: 10 }, (_, i) => ({
    time: `${i}s`,
    ms: Math.floor(Math.random() * 100) + 20,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold" style={{ color }}>{name}</h3>
          <p className="text-sm text-slate-400">{role}</p>
        </div>
        <Shield className="w-8 h-8" style={{ color }} />
      </div>

      <EnergyBar name={name} energy={energy} color={color} />

      {/* Network Monitor */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-cyan-500/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Monitor de Latencia
          </h4>
          <span className={`text-xs px-2 py-1 rounded ${latency < 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {latency}ms
          </span>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={latencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '10px' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
            <Line type="monotone" dataKey="ms" stroke="#22d3ee" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* BNO085 Sensor Status */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-emerald-500/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">Sensor BNO085</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-400">Operacional</span>
          </div>
        </div>
      </div>

      {/* Security Toggle */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-cyan-500/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Seguridad X.509</span>
          </div>
          <button
            onClick={() => setSslEnabled(!sslEnabled)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {sslEnabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </div>
        <p className={`text-xs mt-2 ${sslEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
          {sslEnabled ? '✓ Certificados activos' : '⚠ Certificados desactivados'}
        </p>
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
