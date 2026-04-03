import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Image as ImageIcon, Mic, MessageCircle, ThumbsUp, ThumbsDown, Upload } from 'lucide-react';

export interface FeedbackItem {
  id: string;
  type: 'video' | 'photo' | 'audio';
  title: string;
  patientName: string;
  date: string;
  painPoints: string[];
  likes: number;
  url?: string;
}

interface FeedbackGalleryProps {
  feedbackItems: FeedbackItem[];
  onAddFeedback: (item: Omit<FeedbackItem, 'id' | 'date' | 'likes'>) => void;
}

export function FeedbackGallery({ feedbackItems, onAddFeedback }: FeedbackGalleryProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedType, setSelectedType] = useState<'video' | 'photo' | 'audio'>('video');
  const [title, setTitle] = useState('');
  const [patientName, setPatientName] = useState('');
  const [painPoints, setPainPoints] = useState('');

  const handleSubmit = () => {
    if (title && patientName) {
      onAddFeedback({
        type: selectedType,
        title,
        patientName,
        painPoints: painPoints.split(',').map(p => p.trim()).filter(Boolean),
        url: 'https://example.com/placeholder',
      });
      setTitle('');
      setPatientName('');
      setPainPoints('');
      setShowUpload(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'photo': return <ImageIcon className="w-5 h-5" />;
      case 'audio': return <Mic className="w-5 h-5" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'photo': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'audio': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <motion.div
      className="p-6 rounded-xl bg-slate-900/50 border border-cyan-500/30 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-cyan-400" />
            Feedback Real de Pacientes
          </h3>
          <p className="text-sm text-slate-400 mt-1">Videos, fotos y audios del prototipo en uso</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Subir Feedback
        </button>
      </div>

      <AnimatePresence>
        {showUpload && (
          <motion.div
            className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-cyan-500/30"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                {(['video', 'photo', 'audio'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      selectedType === type
                        ? getTypeColor(type)
                        : 'border-slate-600/30 bg-slate-900/30 text-slate-400 hover:border-slate-500/50'
                    }`}
                  >
                    {getTypeIcon(type)}
                    <span className="text-sm font-medium capitalize">{type}</span>
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del feedback"
                className="w-full p-3 rounded-lg bg-slate-900/80 border border-slate-600/30 text-white text-sm focus:outline-none focus:border-cyan-500"
              />

              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nombre del paciente (opcional)"
                className="w-full p-3 rounded-lg bg-slate-900/80 border border-slate-600/30 text-white text-sm focus:outline-none focus:border-cyan-500"
              />

              <input
                type="text"
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                placeholder="Puntos de dolor (separados por comas)"
                className="w-full p-3 rounded-lg bg-slate-900/80 border border-slate-600/30 text-white text-sm focus:outline-none focus:border-cyan-500"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                >
                  Guardar Feedback
                </button>
                <button
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700/70 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feedbackItems.map((item) => (
          <motion.div
            key={item.id}
            className="p-4 rounded-lg bg-slate-800/50 border border-slate-600/30 hover:border-cyan-500/50 transition-all"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg border ${getTypeColor(item.type)}`}>
                {getTypeIcon(item.type)}
              </div>
              <span className="text-xs text-slate-400">{item.date}</span>
            </div>

            <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
            <p className="text-xs text-slate-400 mb-3">Paciente: {item.patientName}</p>

            {item.painPoints.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-1">Puntos de Dolor:</p>
                <div className="flex flex-wrap gap-1">
                  {item.painPoints.map((point, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-slate-700">
              <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors">
                <ThumbsUp className="w-3 h-3" />
                <span>{item.likes}</span>
              </button>
              <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors">
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {feedbackItems.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay feedback registrado aún</p>
          <p className="text-sm mt-1">Sube el primer video, foto o audio de pacientes</p>
        </div>
      )}
    </motion.div>
  );
}
