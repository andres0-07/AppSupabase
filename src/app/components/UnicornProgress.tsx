import { motion } from 'motion/react';
import { Sparkles, TrendingUp } from 'lucide-react';

interface UnicornProgressProps {
  progress: number;
  panicMode: boolean;
}

export function UnicornProgress({ progress, panicMode }: UnicornProgressProps) {
  const circumference = 2 * Math.PI * 120;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <motion.div
        className="relative"
        animate={{
          scale: panicMode ? [1, 1.05, 1] : 1,
        }}
        transition={{ duration: 0.5, repeat: panicMode ? Infinity : 0 }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 blur-2xl opacity-50 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" />
        
        {/* Main circle */}
        <svg className="relative" width="280" height="280">
          {/* Background circle */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="rgba(34, 211, 238, 0.1)"
            strokeWidth="12"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 140 140)"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            animate={{
              rotate: panicMode ? 0 : 360,
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-12 h-12 text-cyan-400 mb-2" />
          </motion.div>
          <div className="text-5xl font-bold text-white">{progress}%</div>
          <div className="text-sm text-cyan-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Progreso Unicornio
          </div>
        </div>
      </motion.div>
      
      {panicMode && (
        <motion.div
          className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-red-400 font-semibold">🚨 MODO ALERTA ACTIVADO</p>
        </motion.div>
      )}
    </div>
  );
}
