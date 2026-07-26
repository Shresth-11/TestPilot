import React, { useState } from 'react';
import { TestCase, TestExecutionResult } from '../types';
import { CodeViewer } from './CodeViewer';
import { StatusBadge } from './StatusBadge';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface RequestResponseViewerProps {
  testCase: TestCase;
  result?: TestExecutionResult | null;
}

export const RequestResponseViewer: React.FC<RequestResponseViewerProps> = ({ testCase, result }) => {
  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'assertions'>('request');

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs font-sans">
      {/* Header bar */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <StatusBadge type="method" value={testCase.method} />
          <span className="font-mono text-sm font-semibold text-slate-900">{testCase.endpoint_path}</span>
          <StatusBadge type="category" value={testCase.category} />
        </div>

        {result && (
          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-700 font-medium shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{result.response_time_ms.toFixed(1)} ms</span>
            </div>
            <StatusBadge type="status" value={result.status} />
          </div>
        )}
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('request')}
          className={`py-2.5 px-4 border-b-2 transition-all ${
            activeTab === 'request'
              ? 'border-indigo-600 text-indigo-700 font-semibold bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          HTTP Request
        </button>
        <button
          onClick={() => setActiveTab('response')}
          className={`py-2.5 px-4 border-b-2 transition-all ${
            activeTab === 'response'
              ? 'border-indigo-600 text-indigo-700 font-semibold bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          HTTP Response {result ? `(${result.actual_status_code || 'Err'})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('assertions')}
          className={`py-2.5 px-4 border-b-2 transition-all ${
            activeTab === 'assertions'
              ? 'border-indigo-600 text-indigo-700 font-semibold bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Assertions ({testCase.assertions?.length || 0})
        </button>
      </div>

      {/* Content panel */}
      <div className="p-5 space-y-4 text-xs">
        {activeTab === 'request' && (
          <div className="space-y-3 font-sans">
            <div>
              <span className="text-slate-500 text-[11px] block mb-1.5 font-bold uppercase tracking-wider">Headers</span>
              <CodeViewer code={testCase.headers} />
            </div>

            {Object.keys(testCase.query_params || {}).length > 0 && (
              <div>
                <span className="text-slate-500 text-[11px] block mb-1.5 font-bold uppercase tracking-wider">Query Parameters</span>
                <CodeViewer code={testCase.query_params} />
              </div>
            )}

            {Object.keys(testCase.path_params || {}).length > 0 && (
              <div>
                <span className="text-slate-500 text-[11px] block mb-1.5 font-bold uppercase tracking-wider">Path Parameters</span>
                <CodeViewer code={testCase.path_params} />
              </div>
            )}

            {testCase.body && (
              <div>
                <span className="text-slate-500 text-[11px] block mb-1.5 font-bold uppercase tracking-wider">Request Body</span>
                <CodeViewer code={testCase.body} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'response' && (
          <div>
            {!result ? (
              <div className="py-8 text-center text-slate-500 font-sans text-xs">
                No execution run recorded yet. Click "Run Test" to execute HTTP request.
              </div>
            ) : (
              <div className="space-y-3 font-sans">
                {result.error && (
                  <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-rose-800 text-xs flex items-start space-x-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-rose-900">Execution Failure</span>
                      <span>{result.error}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md border border-slate-200 text-slate-700">
                  <div className="flex items-center space-x-4">
                    <span>
                      Status Code:{' '}
                      <strong
                        className={
                          result.actual_status_code === result.expected_status_code
                            ? 'text-emerald-700 font-bold'
                            : 'text-rose-700 font-bold'
                        }
                      >
                        {result.actual_status_code || 'N/A'}
                      </strong>{' '}
                      (Expected: {result.expected_status_code})
                    </span>
                  </div>
                  <span>Latency: <strong className="font-mono">{result.response_time_ms.toFixed(1)} ms</strong></span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block mb-1.5 font-bold uppercase tracking-wider">Response Body</span>
                  <CodeViewer code={result.response_body || {}} />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assertions' && (
          <div className="space-y-2 font-sans">
            {testCase.assertions?.length === 0 ? (
              <div className="text-slate-500 text-xs">No assertions configured for this test case.</div>
            ) : (
              testCase.assertions.map((ast, idx) => {
                const isPassed = result ? result.status === 'passed' : null;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200 text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      {isPassed === true && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {isPassed === false && <XCircle className="w-4 h-4 text-rose-600" />}
                      {isPassed === null && <span className="w-4 h-4 rounded-full border border-slate-300"></span>}
                      <span>
                        <strong className="text-indigo-600 font-mono">{ast.type}</strong>
                        {ast.target ? ` on '${ast.target}'` : ''} {ast.operator} {JSON.stringify(ast.expected_value)}
                      </span>
                    </div>
                    {isPassed !== null && (
                      <span className={isPassed ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {isPassed ? 'PASSED' : 'FAILED'}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
