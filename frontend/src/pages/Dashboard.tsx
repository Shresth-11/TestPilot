import React from 'react';
import { CoverageMetrics, Project, TestCase, TestRun } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, ArrowRight } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  tests: TestCase[];
  runs: TestRun[];
  coverage: CoverageMetrics | null;
  activeProject: Project | null;
  onNavigate: (tab: any) => void;
  onOpenCreateModal: () => void;
  onLoadDemoData: () => void;
  loadingDemo: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  tests,
  runs,
  coverage,
  activeProject,
  onNavigate,
  onOpenCreateModal,
  onLoadDemoData,
  loadingDemo,
}) => {
  const totalTests = tests.length;
  const passedTests = tests.filter((t) => t.status === 'passed').length;
  const failedTests = tests.filter((t) => t.status === 'failed').length;
  const needsReviewTests = tests.filter((t) => t.status === 'generated_needs_review').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeProject ? `Workspace: ${activeProject.name}` : 'No active workspace selected.'}
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onLoadDemoData}
            disabled={loadingDemo}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-1.5 rounded-md transition-colors shadow-2xs disabled:opacity-50"
          >
            {loadingDemo ? 'Loading Demo...' : 'Load Demo Workspace'}
          </button>
          <button
            onClick={onOpenCreateModal}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-md transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Empty State Banner */}
      {projects.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center space-y-3 shadow-2xs">
          <h3 className="text-sm font-semibold text-slate-900">No Projects Configured</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Create a project and upload an OpenAPI specification to generate automated test suites.
          </p>
          <div className="pt-1 flex items-center justify-center space-x-2.5">
            <button
              onClick={onLoadDemoData}
              disabled={loadingDemo}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-md transition-colors shadow-2xs disabled:opacity-50"
            >
              {loadingDemo ? 'Loading Data...' : 'Load Demo Workspace'}
            </button>
            <button
              onClick={onOpenCreateModal}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3.5 py-1.5 rounded-md transition-colors shadow-2xs"
            >
              Create Project
            </button>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Projects</div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{projects.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Configured Workspaces</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Test Cases</div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{totalTests}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-sans">
            {passedTests} passed · {failedTests} failed · {needsReviewTests} unreviewed
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Endpoint Coverage</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {coverage ? `${coverage.endpoint_coverage_pct}%` : '0%'}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-200">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all"
              style={{ width: `${coverage ? coverage.endpoint_coverage_pct : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Test Runs</div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{runs.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Executed Suite Runs</div>
        </div>
      </div>

      {/* Recent Runs Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-sans">Recent Test Runs</h3>
          <button
            onClick={() => onNavigate('runs')}
            className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors flex items-center space-x-1 font-medium"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {runs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No test runs recorded yet. Upload a spec and click "Run All Tests".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] font-sans font-medium">
                <tr>
                  <th className="p-3">Run ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Total Tests</th>
                  <th className="p-3">Passed</th>
                  <th className="p-3">Failed</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Executed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs">
                {runs.slice(0, 5).map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-medium text-slate-900">#{run.id.substring(0, 8)}</td>
                    <td className="p-3">
                      <StatusBadge type="status" value={run.status} />
                    </td>
                    <td className="p-3 text-slate-700">{run.total_tests}</td>
                    <td className="p-3 text-emerald-600 font-medium">{run.passed}</td>
                    <td className="p-3 text-rose-600 font-medium">{run.failed}</td>
                    <td className="p-3 text-slate-500 font-mono">{run.duration_ms.toFixed(0)} ms</td>
                    <td className="p-3 text-slate-500 text-[11px]">{new Date(run.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
