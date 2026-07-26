import React, { useState } from 'react';
import { TestCase } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Play, Edit3, Trash2 } from 'lucide-react';

interface GeneratedTestsProps {
  tests: TestCase[];
  onRunSingleTest: (testId: string) => void;
  onRunSuite: () => void;
  onDeleteTest: (testId: string) => void;
  onSelectTest: (test: TestCase) => void;
}

export const GeneratedTests: React.FC<GeneratedTestsProps> = ({
  tests,
  onRunSingleTest,
  onRunSuite,
  onDeleteTest,
  onDeleteTest: _,
  onSelectTest,
}) => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTests = tests.filter((t) => {
    const matchesCategory = categoryFilter === 'all' || t.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Generated Test Cases</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and execute test suites against target endpoints.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onRunSuite}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-md transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run All Tests ({tests.length})</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Status Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg text-xs font-sans shadow-2xs">
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500 font-medium mr-1 uppercase text-[11px]">Category:</span>
          {['all', 'functional', 'negative', 'edge', 'security'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium uppercase text-[11px]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 text-slate-800 border border-slate-300 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="generated_needs_review">Needs Review</option>
            <option value="validated">Validated</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Test Cases Table */}
      {tests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs shadow-2xs">
          No generated test cases yet. Upload an OpenAPI spec and click "Generate Test Cases" in Endpoints.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] font-sans font-medium">
                <tr>
                  <th className="p-3">Test Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Method & Path</th>
                  <th className="p-3">Expected Code</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTests.map((tc) => (
                  <tr key={tc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <button
                        onClick={() => onSelectTest(tc)}
                        className="font-medium text-slate-900 hover:text-indigo-600 text-left transition-colors block text-xs"
                      >
                        {tc.name}
                      </button>
                      <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{tc.description}</span>
                    </td>
                    <td className="p-3">
                      <StatusBadge type="category" value={tc.category} />
                    </td>
                    <td className="p-3 font-mono">
                      <div className="flex items-center space-x-2">
                        <StatusBadge type="method" value={tc.method} />
                        <span className="text-slate-800 font-medium">{tc.endpoint_path}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-800">{tc.expected_status_code}</td>
                    <td className="p-3">
                      <StatusBadge type="priority" value={tc.priority} />
                    </td>
                    <td className="p-3">
                      <StatusBadge type="status" value={tc.status} />
                    </td>
                    <td className="p-3 text-right font-sans">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onRunSingleTest(tc.id)}
                          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-[11px] px-2.5 py-1 rounded-md transition-colors flex items-center space-x-1 font-medium shadow-2xs"
                          title="Execute test"
                        >
                          <Play className="w-3 h-3 text-slate-600" />
                          <span>Run</span>
                        </button>
                        <button
                          onClick={() => onSelectTest(tc)}
                          className="text-slate-400 hover:text-slate-700 p-1"
                          title="View Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTest(tc.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete Test Case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
