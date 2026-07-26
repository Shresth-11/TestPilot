import React, { useEffect, useState } from 'react';
import { EvaluationScores, TestCase, TestExecutionResult } from '../types';
import { api } from '../services/api';
import { RequestResponseViewer } from '../components/RequestResponseViewer';
import { ArrowLeft, Play, Award, CheckCircle2 } from 'lucide-react';

interface TestDetailProps {
  testCase: TestCase;
  onBack: () => void;
}

export const TestDetail: React.FC<TestDetailProps> = ({ testCase, onBack }) => {
  const [evaluation, setEvaluation] = useState<EvaluationScores | null>(null);
  const [lastResult, setLastResult] = useState<TestExecutionResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetchEvaluation();
  }, [testCase.id]);

  const fetchEvaluation = async () => {
    try {
      const evalData = await api.getEvaluation(testCase.id);
      setEvaluation(evalData);
    } catch (_) {}
  };

  const handleRunTest = async () => {
    setRunning(true);
    try {
      const res = await api.runSingleTest(testCase.id);
      setLastResult(res);
    } catch (err: any) {
      console.error('Test run error:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-md transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{testCase.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{testCase.description}</p>
          </div>
        </div>

        <button
          onClick={handleRunTest}
          disabled={running}
          className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium px-3.5 py-1.5 rounded-md transition-colors shadow-2xs"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{running ? 'Running...' : 'Run Test'}</span>
        </button>
      </div>

      {/* Main Request & Response Viewer */}
      <RequestResponseViewer testCase={testCase} result={lastResult} />

      {/* Quality Evaluation Score Card */}
      {evaluation && (
        <div className="bg-white border border-slate-200 rounded-lg p-4.5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Quality Score</h3>
            </div>
            <div className="text-xs font-mono font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">
              Score: {evaluation.overall_score}/100
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans">
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <span className="text-slate-500 block mb-1 font-medium">Correctness (35%)</span>
              <span className="text-base font-bold font-mono text-slate-900">{evaluation.correctness}/100</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <span className="text-slate-500 block mb-1 font-medium">Consistency (20%)</span>
              <span className="text-base font-bold font-mono text-slate-900">{evaluation.consistency}/100</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <span className="text-slate-500 block mb-1 font-medium">Coverage (30%)</span>
              <span className="text-base font-bold font-mono text-slate-900">{evaluation.coverage}/100</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <span className="text-slate-500 block mb-1 font-medium">Usability (15%)</span>
              <span className="text-base font-bold font-mono text-slate-900">{evaluation.usability}/100</span>
            </div>
          </div>

          {evaluation.feedback && Object.keys(evaluation.feedback).length > 0 && (
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-xs text-slate-600 space-y-1 font-sans">
              <span className="text-slate-400 uppercase font-semibold text-[10px] block mb-1 tracking-wider">Evaluation Notes</span>
              {Object.entries(evaluation.feedback).map(([k, v]) => (
                <div key={k} className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
