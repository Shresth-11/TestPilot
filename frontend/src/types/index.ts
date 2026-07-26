export interface Project {
  id: string;
  name: string;
  description?: string;
  base_url?: string;
  created_at: string;
  updated_at: string;
}

export interface APISpec {
  id: string;
  project_id: string;
  title: string;
  version: string;
  spec_format: string;
  created_at: string;
  endpoint_count: number;
}

export interface APIEndpoint {
  id: string;
  spec_id: string;
  project_id: string;
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters: Array<{
    name: string;
    in: string;
    required: boolean;
    param_type: string;
    description?: string;
  }>;
  request_body?: {
    content_type: string;
    schema_def: Record<string, any>;
  };
  responses: Record<string, any>;
  test_case_count: number;
}

export interface Assertion {
  type: 'status_code' | 'header_exists' | 'json_field_equals' | 'json_field_exists' | 'response_time_below' | 'json_field_type';
  target: string;
  operator: string;
  expected_value: any;
}

export interface TestCase {
  id: string;
  project_id: string;
  endpoint_id?: string;
  name: string;
  description: string;
  category: 'functional' | 'negative' | 'edge' | 'security' | 'ui';
  method: string;
  endpoint_path: string;
  headers: Record<string, any>;
  query_params: Record<string, any>;
  path_params: Record<string, any>;
  body?: any;
  expected_status_code: number;
  expected_response_schema?: Record<string, any>;
  assertions: Assertion[];
  priority: 'low' | 'medium' | 'high';
  status: 'generated_needs_review' | 'validated' | 'passed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface TestExecutionResult {
  test_id: string;
  run_id?: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  actual_status_code?: number;
  expected_status_code: number;
  response_time_ms: number;
  response_headers?: Record<string, any>;
  response_body?: any;
  assertions_passed: number;
  assertions_failed: number;
  error?: string;
  screenshot_path?: string;
  executed_at: string;
}

export interface TestRun {
  id: string;
  project_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  results: TestExecutionResult[];
}

export interface EvaluationScores {
  test_id: string;
  correctness: number;
  consistency: number;
  coverage: number;
  usability: number;
  overall_score: number;
  feedback: Record<string, string>;
}

export interface CoverageMetrics {
  total_endpoints: number;
  tested_endpoints: number;
  endpoint_coverage_pct: number;
  total_methods: number;
  tested_methods: number;
  method_coverage_pct: number;
  total_parameters: number;
  tested_parameters: number;
  parameter_coverage_pct: number;
  response_schema_coverage_pct: number;
  negative_test_coverage_pct: number;
}
