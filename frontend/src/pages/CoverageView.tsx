import React from 'react';
import { CoverageMetrics } from '../types';
import { ShieldCheck, BarChart3, Target, Layers } from 'lucide-react';

interface CoverageViewProps {
  coverage: CoverageMetrics | null;
}

export const CoverageView: React.FC<CoverageViewProps> = ({ coverage }) => {
  if (!coverage) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs font-sans shadow-2xs">
        Loading coverage metrics...
      </div>
    );
  }

  const items = [
    {
      title: 'Endpoint Coverage',
      value: `${coverage.endpoint_coverage_pct}%`,
      subtitle: `${coverage.tested_endpoints} of ${coverage.total_endpoints} endpoints tested`,
      color: 'text-indigo-600',
      barColor: 'bg-indigo-600',
      pct: coverage.endpoint_coverage_pct,
      icon: Target,
    },
    {
      title: 'HTTP Method Coverage',
      value: `${coverage.method_coverage_pct}%`,
      subtitle: `${coverage.tested_methods} of ${coverage.total_methods} method variations tested`,
      color: 'text-emerald-600',
      barColor: 'bg-emerald-600',
      pct: coverage.method_coverage_pct,
      icon: Layers,
    },
    {
      title: 'Parameter Coverage',
      value: `${coverage.parameter_coverage_pct}%`,
      subtitle: `${coverage.tested_parameters} of ${coverage.total_parameters} parameters tested`,
      color: 'text-amber-600',
      barColor: 'bg-amber-500',
      pct: coverage.parameter_coverage_pct,
      icon: BarChart3,
    },
    {
      title: 'Negative Test Coverage',
      value: `${coverage.negative_test_coverage_pct}%`,
      subtitle: 'Negative, edge, and security test ratio',
      color: 'text-rose-600',
      barColor: 'bg-rose-500',
      pct: coverage.negative_test_coverage_pct,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Coverage & Metrics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Test coverage across discovered endpoints, HTTP methods, and input parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4.5 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-900">{item.title}</h3>
                </div>
                <span className="text-xl font-bold font-mono text-slate-900">{item.value}</span>
              </div>
              <p className="text-xs text-slate-500">{item.subtitle}</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                <div className={`${item.barColor} h-1.5 rounded-full transition-all`} style={{ width: `${item.pct}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
