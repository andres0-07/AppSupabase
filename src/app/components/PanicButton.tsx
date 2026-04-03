import { motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface PanicButtonProps {
  panicMode: boolean;
  onTogglePanic: () => void;
}

export function PanicButton({ panicMode, onTogglePanic }: PanicButtonProps) {
  return (
    <motion.div
      className="fixed bottom-8 right-8 z-50"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {panicMode && (
        <motion.div
          className="absolute -top-20 right-0 p-4 bg-red-900/90 border border-red-500 rounded-lg shadow-2xl backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-white font-semibold">Modo Alerta Activo</p>
          <p className="text-xs text-red-300 mt-1">Tareas secundarias bloqueadas</p>
        </motion.div>
      )}

      <motion.button
        onClick={onTogglePanic}
        className={`w-20 h-20 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          panicMode
            ? 'bg-gradient-to-br from-emerald-500 to-cyan-500'
            : 'bg-gradient-to-br from-red-600 to-red-700'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: panicMode
            ? [
                '0 0 20px rgba(34, 211, 238, 0.5)',
                '0 0 40px rgba(34, 211, 238, 0.8)',
                '0 0 20px rgba(34, 211, 238, 0.5)',
              ]
            : [
                '0 0 20px rgba(220, 38, 38, 0.5)',
                '0 0 40px rgba(220, 38, 38, 0.8)',
                '0 0 20px rgba(220, 38, 38, 0.5)',
              ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          animate={{
            rotate: panicMode ? 0 : [0, -10, 10, -10, 10, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: panicMode ? 0 : Infinity,
            repeatDelay: 1,
          }}
        >
          {panicMode ? (
            <X className="w-10 h-10 text-white" />
          ) : (
            <AlertTriangle className="w-10 h-10 text-white" />
          )}
        </motion.div>
      </motion.button>

      <div className="text-center mt-2">
        <p className={`text-xs font-semibold ${panicMode ? 'text-cyan-400' : 'text-red-400'}`}>
          {panicMode ? 'Desactivar' : 'PÁNICO'}
        </p>
      </div>
    </motion.div>
  );
}
