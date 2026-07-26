import React from 'react';
import { TestRun } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface TestRunsProps {
  runs: TestRun[];
  activeRun: TestRun | null;
  onSelectRun: (runId: string) => void;
}

export const TestRuns: React.FC<TestRunsProps> = ({ runs, activeRun, onSelectRun }) => {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Test Execution History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time and historic test run telemetry, pass/fail counts, and step results.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Runs List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden lg:col-span-1 max-h-[600px] overflow-y-auto shadow-xs">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
            Test Runs History ({runs.length})
          </div>
          {runs.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">No test runs recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {runs.map((run) => {
                const isSelected = activeRun?.id === run.id;
                return (
                  <button
                    key={run.id}
                    onClick={() => onSelectRun(run.id)}
                    className={`w-full text-left p-3.5 transition-colors block ${
                      isSelected ? 'bg-indigo-50/70 border-l-3 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-xs font-mono">Run #{run.id.substring(0, 8)}</span>
                      <StatusBadge type="status" value={run.status} />
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-3 mt-1.5 font-mono">
                      <span className="text-emerald-700 font-bold">{run.passed} Passed</span>
                      <span className="text-rose-700 font-bold">{run.failed} Failed</span>
                      <span>{run.duration_ms.toFixed(0)} ms</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Run Telemetry & Step Results */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2 space-y-5 shadow-xs font-sans">
          {activeRun ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">Run #{activeRun.id}</h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Started: {activeRun.created_at ? new Date(activeRun.created_at).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <StatusBadge type="status" value={activeRun.status} />
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-4 gap-4 text-xs font-sans">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1 font-semibold">Total Tests</span>
                  <span className="text-xl font-bold font-mono text-slate-900">{activeRun.total_tests}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1 font-semibold">Passed</span>
                  <span className="text-xl font-bold font-mono text-emerald-600">{activeRun.passed}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1 font-semibold">Failed</span>
                  <span className="text-xl font-bold font-mono text-rose-600">{activeRun.failed}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1 font-semibold">Duration</span>
                  <span className="text-xl font-bold font-mono text-slate-900">{activeRun.duration_ms.toFixed(0)} ms</span>
                </div>
              </div>

              {/* Step Results Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Step Execution Results</h4>
                {activeRun.results?.length === 0 ? (
                  <div className="text-slate-500 text-xs py-4 text-center bg-slate-50 rounded-lg border border-slate-200">
                    Execution in progress or no result steps captured.
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-sans font-bold">
                        <tr>
                          <th className="p-3">Status</th>
                          <th className="p-3">Test ID</th>
                          <th className="p-3">Status Code</th>
                          <th className="p-3">Latency</th>
                          <th className="p-3">Error Log</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono text-[12px]">
                        {activeRun.results.map((res, i) => (
                          <tr key={i}>
                            <td className="p-3 font-sans">
                              <StatusBadge type="status" value={res.status} />
                            </td>
                            <td className="p-3 font-bold text-slate-900">{res.test_id.substring(0, 12)}...</td>
                            <td className="p-3 font-semibold">{res.actual_status_code || 'N/A'}</td>
                            <td className="p-3 text-slate-600">{res.response_time_ms.toFixed(1)} ms</td>
                            <td className="p-3 text-rose-600 font-sans max-w-xs truncate">{res.error || 'None'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500 text-xs py-12">Select a test run from the history panel.</div>
          )}
        </div>
      </div>
    </div>
  );
};
