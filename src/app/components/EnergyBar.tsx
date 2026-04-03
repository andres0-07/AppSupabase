import { motion } from 'motion/react';
import { Battery, TrendingUp, TrendingDown } from 'lucide-react';

interface EnergyBarProps {
  name: string;
  energy: number;
  color: string;
}

export function EnergyBar({ name, energy, color }: EnergyBarProps) {
  const getEnergyStatus = () => {
    if (energy >= 70) return { icon: TrendingUp, text: 'Alta energía', color: 'text-emerald-400' };
    if (energy >= 40) return { icon: Battery, text: 'Energía media', color: 'text-cyan-400' };
    return { icon: TrendingDown, text: 'Energía baja', color: 'text-red-400' };
  };

  const status = getEnergyStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Battery className={`w-4 h-4 ${status.color}`} />
          <span className="text-sm font-medium text-slate-300">{name}</span>
        </div>
        <div className="flex items-center gap-1">
          <StatusIcon className={`w-3 h-3 ${status.color}`} />
          <span className={`text-xs ${status.color}`}>{energy}%</span>
        </div>
      </div>
      
      <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${energy}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      
      <p className={`text-xs ${status.color}`}>{status.text}</p>
    </div>
  );
}
