import {
  APISpec,
  APIEndpoint,
  CoverageMetrics,
  EvaluationScores,
  Project,
  TestCase,
  TestExecutionResult,
  TestRun,
} from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let message = `HTTP Error ${res.status}`;
    try {
      const errData = await res.json();
      message = errData.error?.message || errData.detail || message;
    } catch (_) {}
    throw new Error(message);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Projects
  getProjects: () => request<Project[]>('/projects'),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  createProject: (data: { name: string; description?: string; base_url?: string }) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Specs
  getProjectSpecs: (projectId: string) => request<APISpec[]>(`/projects/${projectId}/specs`),
  uploadSpec: (projectId: string, rawSpec: string, format: 'json' | 'yaml') =>
    request<APISpec>(`/projects/${projectId}/specs`, {
      method: 'POST',
      body: JSON.stringify({ raw_spec: rawSpec, format }),
    }),

  // Endpoints
  getSpecEndpoints: (specId: string) => request<APIEndpoint[]>(`/specs/${specId}/endpoints`),
  getEndpoint: (endpointId: string) => request<APIEndpoint>(`/endpoints/${endpointId}`),

  // Test Generation
  generateEndpointTests: (endpointId: string) =>
    request<TestCase[]>(`/endpoints/${endpointId}/generate-tests`, { method: 'POST' }),
  generateSpecTests: (specId: string) =>
    request<TestCase[]>(`/specs/${specId}/generate-tests`, { method: 'POST' }),

  // Test Cases
  getProjectTests: (projectId: string) => request<TestCase[]>(`/projects/${projectId}/tests`),
  getTest: (testId: string) => request<TestCase>(`/tests/${testId}`),
  updateTest: (testId: string, updates: Partial<TestCase>) =>
    request<TestCase>(`/tests/${testId}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteTest: (testId: string) => request<void>(`/tests/${testId}`, { method: 'DELETE' }),

  // Execution
  runSingleTest: (testId: string) => request<TestExecutionResult>(`/tests/${testId}/run`, { method: 'POST' }),
  runProjectSuite: (projectId: string) => request<TestRun>(`/projects/${projectId}/run`, { method: 'POST' }),

  // Runs
  getProjectRuns: (projectId: string) => request<TestRun[]>(`/projects/${projectId}/runs`),
  getRun: (runId: string) => request<TestRun>(`/runs/${runId}`),

  // Evaluation & Coverage
  evaluateTest: (testId: string) => request<EvaluationScores>(`/tests/${testId}/evaluate`, { method: 'POST' }),
  getEvaluation: (testId: string) => request<EvaluationScores>(`/tests/${testId}/evaluation`),
  getCoverage: (projectId: string) => request<CoverageMetrics>(`/projects/${projectId}/coverage`),
};
