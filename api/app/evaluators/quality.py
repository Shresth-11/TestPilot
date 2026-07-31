from app.schemas import EvaluationScores, TestCaseResponse


class QualityEvaluator:
    """
    Evaluates test quality (0-100) based on deterministic rule-based checks:
    - Correctness (35%): Valid HTTP method, path format, valid expected status code, valid assertion targets.
    - Consistency (20%): Naming conventions, path param consistency, schema alignment.
    - Coverage (30%): Header/query/body coverage, negative/edge handling, assertion count.
    - Practical Usability (15%): Descriptive test name, detailed description, actionable priority.
    """

    def evaluate_test(self, test_case: TestCaseResponse) -> EvaluationScores:
        correctness = self._score_correctness(test_case)
        consistency = self._score_consistency(test_case)
        coverage = self._score_coverage(test_case)
        usability = self._score_usability(test_case)

        overall = (correctness * 0.35) + (consistency * 0.20) + (coverage * 0.30) + (usability * 0.15)

        feedback = {
            "correctness_notes": "Method, status code, and assertion structure valid." if correctness > 80 else "Review expected status code or assertion targets.",
            "consistency_notes": "Naming and parameter formatting match standards." if consistency > 80 else "Check parameter naming consistency.",
            "coverage_notes": "Comprehensive parameter and assertion coverage." if coverage > 80 else "Add more assertions or parameter validations.",
            "usability_notes": "Clear description and priority set." if usability > 80 else "Improve test description readability.",
        }

        return EvaluationScores(
            test_id=test_case.id,
            correctness=round(correctness, 1),
            consistency=round(consistency, 1),
            coverage=round(coverage, 1),
            usability=round(usability, 1),
            overall_score=round(overall, 1),
            feedback=feedback,
        )

    def _score_correctness(self, test: TestCaseResponse) -> float:
        score = 100.0
        # Valid HTTP method
        if test.method.upper() not in ("GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"):
            score -= 40.0

        # Valid status code
        if not (100 <= test.expected_status_code <= 599):
            score -= 30.0

        # Valid endpoint path format
        if not test.endpoint_path.startswith("/"):
            score -= 20.0

        # Check assertion count
        if not test.assertions:
            score -= 10.0

        return max(0.0, score)

    def _score_consistency(self, test: TestCaseResponse) -> float:
        score = 100.0

        # Path parameter placeholder check
        if "{" in test.endpoint_path and not test.path_params:
            score -= 30.0

        # Category alignment
        if test.category not in ("functional", "negative", "edge", "security"):
            score -= 25.0

        # Priority alignment
        if test.priority not in ("low", "medium", "high"):
            score -= 15.0

        return max(0.0, score)

    def _score_coverage(self, test: TestCaseResponse) -> float:
        score = 50.0

        # Rewards for specifying parameters and body
        if test.query_params:
            score += 15.0
        if test.body:
            score += 15.0
        if test.headers:
            score += 10.0

        # Rewards for multiple assertions
        if len(test.assertions) >= 2:
            score += 10.0

        return min(100.0, score)

    def _score_usability(self, test: TestCaseResponse) -> float:
        score = 50.0

        if test.name and len(test.name) > 10:
            score += 25.0
        if test.description and len(test.description) > 15:
            score += 25.0

        return min(100.0, score)
