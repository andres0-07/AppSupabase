import { useState } from 'react';
import { motion } from 'motion/react';
import { Brain, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

export interface Question {
  id: string;
  role: string;
  question: string;
  answer: string;
  answered: boolean;
}

interface OracleProps {
  questions: Question[];
  onAnswerQuestion: (id: string, answer: string) => void;
}

export function Oracle({ questions, onAnswerQuestion }: OracleProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');

  const handleSubmit = (questionId: string) => {
    if (answer.trim()) {
      onAnswerQuestion(questionId, answer);
      setAnswer('');
      setSelectedQuestion(null);
    }
  };

  const roleColors: Record<string, string> = {
    Jona: '#22d3ee',
    Sam: '#10b981',
    Hedu: '#f59e0b',
    Cucho: '#8b5cf6',
  };

  const answeredCount = questions.filter(q => q.answered).length;

  return (
    <motion.div
      className="p-6 rounded-xl bg-gradient-to-br from-purple-900/30 to-cyan-900/30 border border-purple-500/50 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">El Oráculo</h3>
            <p className="text-sm text-slate-400">Preguntas Críticas Semanales</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-400">{answeredCount}/{questions.length}</div>
          <div className="text-xs text-slate-400">Respondidas</div>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q) => (
          <motion.div
            key={q.id}
            className={`p-4 rounded-lg border transition-all ${
              q.answered
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : selectedQuestion === q.id
                ? 'border-cyan-500/50 bg-cyan-500/10'
                : 'border-slate-600/30 bg-slate-800/20 hover:border-slate-500/50'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${roleColors[q.role]}20`,
                      color: roleColors[q.role],
                    }}
                  >
                    {q.role}
                  </span>
                  {q.answered ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-sm text-white mb-2">{q.question}</p>
                
                {q.answered ? (
                  <div className="mt-2 p-3 rounded bg-slate-900/50 border border-emerald-500/20">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-300">{q.answer}</p>
                    </div>
                  </div>
                ) : selectedQuestion === q.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Escribe tu respuesta aquí..."
                      className="w-full p-3 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-white text-sm resize-none focus:outline-none focus:border-cyan-500"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSubmit(q.id)}
                        className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                      >
                        Enviar Respuesta
                      </button>
                      <button
                        onClick={() => {
                          setSelectedQuestion(null);
                          setAnswer('');
                        }}
                        className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700/70 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedQuestion(q.id)}
                    className="mt-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors"
                  >
                    Responder
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
