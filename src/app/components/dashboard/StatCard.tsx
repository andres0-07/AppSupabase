import type { ReactNode } from 'react';

export function StatCard({ title, value, helper, icon }: { title: string; value: string | number; helper: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/30">
      <div className="mb-3 flex items-center justify-between text-slate-400">
        <span className="text-sm font-medium">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-semibold text-white">{value}</div>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}
