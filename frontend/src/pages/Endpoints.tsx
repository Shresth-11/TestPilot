import React, { useState } from 'react';
import { APIEndpoint } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CodeViewer } from '../components/CodeViewer';
import { Search } from 'lucide-react';

interface EndpointsProps {
  endpoints: APIEndpoint[];
  onGenerateEndpointTests: (endpointId: string) => void;
}

export const Endpoints: React.FC<EndpointsProps> = ({ endpoints, onGenerateEndpointTests }) => {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(endpoints[0] || null);

  const filteredEndpoints = endpoints.filter((ep) => {
    const matchesSearch = ep.path.toLowerCase().includes(search.toLowerCase()) || ep.summary?.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === 'all' || ep.method.toLowerCase() === methodFilter.toLowerCase();
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">API Endpoints</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Endpoints extracted from uploaded OpenAPI specification.
          </p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg shadow-2xs">
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 w-72">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search path or summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-slate-900 focus:outline-none w-full font-sans placeholder-slate-400"
          />
        </div>

        <div className="flex items-center space-x-1.5 text-xs">
          <span className="text-slate-500 font-medium text-[11px] uppercase mr-1">Method:</span>
          {['all', 'get', 'post', 'put', 'delete'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-2.5 py-1 rounded-md text-[11px] uppercase font-mono font-medium transition-colors ${
                methodFilter === m
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split View */}
      {endpoints.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs shadow-2xs">
          No endpoints parsed yet. Upload an OpenAPI specification in Projects.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* List panel */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden lg:col-span-1 max-h-[600px] overflow-y-auto shadow-2xs">
            <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
              Endpoints ({filteredEndpoints.length})
            </div>
            <div className="divide-y divide-slate-100">
              {filteredEndpoints.map((ep) => {
                const isSelected = selectedEndpoint?.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => setSelectedEndpoint(ep)}
                    className={`w-full text-left p-3 transition-colors block ${
                      isSelected ? 'bg-slate-100 border-l-2 border-slate-900' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <StatusBadge type="method" value={ep.method} />
                      <span className="text-[11px] font-mono text-slate-400">{ep.test_case_count} tests</span>
                    </div>
                    <div className="text-xs font-mono font-medium text-slate-900 truncate">{ep.path}</div>
                    {ep.summary && <div className="text-[11px] font-sans text-slate-500 truncate mt-0.5">{ep.summary}</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details panel */}
          <div className="bg-white border border-slate-200 rounded-lg p-4.5 lg:col-span-2 space-y-4 font-sans shadow-2xs">
            {selectedEndpoint ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <StatusBadge type="method" value={selectedEndpoint.method} />
                    <h3 className="text-xs font-mono font-semibold text-slate-900">{selectedEndpoint.path}</h3>
                  </div>
                  <button
                    onClick={() => onGenerateEndpointTests(selectedEndpoint.id)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors shadow-2xs"
                  >
                    Generate Test Cases
                  </button>
                </div>

                {selectedEndpoint.summary && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-0.5">Summary</span>
                    {selectedEndpoint.summary}
                  </div>
                )}

                {/* Parameters list */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Parameters ({selectedEndpoint.parameters.length})</h4>
                  {selectedEndpoint.parameters.length === 0 ? (
                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-200">
                      No parameters defined.
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-md border border-slate-200 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-sans font-semibold">
                          <tr>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">In</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Required</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                          {selectedEndpoint.parameters.map((p, i) => (
                            <tr key={i}>
                              <td className="p-2.5 font-semibold text-slate-900">{p.name}</td>
                              <td className="p-2.5 text-slate-500">{p.in}</td>
                              <td className="p-2.5 text-indigo-600">{p.param_type}</td>
                              <td className="p-2.5 font-sans">{p.required ? 'Yes' : 'No'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Request body schema */}
                {selectedEndpoint.request_body && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Request Body Schema</h4>
                    <CodeViewer code={selectedEndpoint.request_body.schema_def} />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-slate-500 text-xs py-12">Select an endpoint from the left panel to inspect details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
