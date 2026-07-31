from app.models import Endpoint, TestCase
from app.schemas import CoverageMetrics


class CoverageCalculator:
    """Calculates API test coverage metrics across endpoints, methods, parameters, and negative test cases."""

    def calculate_coverage(
        self,
        endpoints: list[Endpoint],
        test_cases: list[TestCase],
    ) -> CoverageMetrics:
        total_endpoints = len(endpoints)
        if total_endpoints == 0:
            return CoverageMetrics()

        # Endpoint coverage
        tested_endpoint_ids = {t.endpoint_id for t in test_cases if t.endpoint_id}
        tested_endpoints = len(tested_endpoint_ids)
        endpoint_pct = (tested_endpoints / total_endpoints) * 100.0

        # Method coverage
        all_methods = {(e.path, e.method.upper()) for e in endpoints}
        tested_methods = {(t.endpoint_path, t.method.upper()) for t in test_cases}
        total_methods = len(all_methods)
        covered_methods = len(all_methods.intersection(tested_methods))
        method_pct = (covered_methods / total_methods * 100.0) if total_methods > 0 else 0.0

        # Parameter coverage
        total_params = sum(len(e.parameters or []) for e in endpoints)
        tested_param_names = set()
        for t in test_cases:
            if t.query_params:
                tested_param_names.update(t.query_params.keys())
            if t.path_params:
                tested_param_names.update(t.path_params.keys())

        param_pct = (len(tested_param_names) / total_params * 100.0) if total_params > 0 else 100.0

        # Negative test coverage
        total_tests = len(test_cases)
        negative_tests = sum(1 for t in test_cases if t.category in ("negative", "edge", "security"))
        negative_pct = (negative_tests / total_tests * 100.0) if total_tests > 0 else 0.0

        # Schema coverage estimate
        tests_with_schema = sum(1 for t in test_cases if t.expected_response_schema or t.body)
        schema_pct = (tests_with_schema / total_tests * 100.0) if total_tests > 0 else 0.0

        return CoverageMetrics(
            total_endpoints=total_endpoints,
            tested_endpoints=tested_endpoints,
            endpoint_coverage_pct=round(endpoint_pct, 1),
            total_methods=total_methods,
            tested_methods=covered_methods,
            method_coverage_pct=round(method_pct, 1),
            total_parameters=total_params,
            tested_parameters=len(tested_param_names),
            parameter_coverage_pct=round(param_pct, 1),
            response_schema_coverage_pct=round(schema_pct, 1),
            negative_test_coverage_pct=round(negative_pct, 1),
        )
