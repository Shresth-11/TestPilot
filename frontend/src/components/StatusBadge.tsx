import React from 'react';

interface StatusBadgeProps {
  type: 'method' | 'status' | 'category' | 'priority';
  value: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  const val = value.toLowerCase();

  if (type === 'method') {
    const methodColors: Record<string, string> = {
      get: 'bg-blue-50 text-blue-700 border-blue-200',
      post: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      put: 'bg-amber-50 text-amber-700 border-amber-200',
      delete: 'bg-rose-50 text-rose-700 border-rose-200',
      patch: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    const style = methodColors[val] || 'bg-slate-100 text-slate-700 border-slate-200';
    return (
      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${style}`}>
        {value}
      </span>
    );
  }

  if (type === 'status') {
    const statusColors: Record<string, string> = {
      passed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      failed: 'bg-rose-50 text-rose-700 border-rose-200',
      skipped: 'bg-slate-100 text-slate-600 border-slate-200',
      generated_needs_review: 'bg-amber-50 text-amber-700 border-amber-200',
      validated: 'bg-blue-50 text-blue-700 border-blue-200',
      pending: 'bg-slate-100 text-slate-600 border-slate-200',
      running: 'bg-blue-50 text-blue-700 border-blue-300 animate-pulse',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    const style = statusColors[val] || 'bg-slate-100 text-slate-700 border-slate-200';
    const label = val === 'generated_needs_review' ? 'Needs Review' : value;
    return (
      <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${style} font-sans inline-flex items-center space-x-1.5 shadow-2xs`}>
        <span className={`w-1.5 h-1.5 rounded-full ${val === 'passed' ? 'bg-emerald-500' : val === 'failed' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
        <span className="capitalize">{label}</span>
      </span>
    );
  }

  if (type === 'category') {
    const categoryColors: Record<string, string> = {
      functional: 'bg-blue-50 text-blue-700 border-blue-200',
      negative: 'bg-rose-50 text-rose-700 border-rose-200',
      edge: 'bg-amber-50 text-amber-700 border-amber-200',
      security: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    const style = categoryColors[val] || 'bg-slate-100 text-slate-700 border-slate-200';
    return (
      <span className={`px-2 py-0.5 text-[10px] font-mono font-medium capitalize rounded border ${style}`}>
        {value}
      </span>
    );
  }

  // Priority
  const priorityColors: Record<string, string> = {
    high: 'text-rose-600 font-bold',
    medium: 'text-amber-600 font-semibold',
    low: 'text-slate-500',
  };
  return <span className={`text-[11px] font-mono uppercase font-semibold ${priorityColors[val] || 'text-slate-500'}`}>{value}</span>;
};
