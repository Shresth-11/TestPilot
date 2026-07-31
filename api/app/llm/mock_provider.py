import re
from app.llm.base import BaseLLMProvider
from app.schemas import APIEndpoint, Assertion, GeneratedTestCase


class MockLLMProvider(BaseLLMProvider):
    """
    Deterministic Mock LLM generator for local development and offline testing.
    Generates structured test cases directly from endpoint parameters and schemas.
    """

    async def generate_test_cases(self, endpoint: APIEndpoint) -> list[GeneratedTestCase]:
        test_cases: list[GeneratedTestCase] = []

        # Extract path parameters
        path_param_names = re.findall(r"\{([^}]+)\}", endpoint.path)
        sample_path_params = {p: "1" if "id" in p.lower() else "sample_val" for p in path_param_names}

        # Extract query parameters
        sample_query_params = {}
        missing_query_params = {}
        for param in endpoint.parameters:
            if param.location == "query":
                sample_query_params[param.name] = "test"
                if not param.required:
                    missing_query_params[param.name] = None

        # Build sample body from request_body schema
        sample_body = None
        invalid_body = None
        if endpoint.request_body and endpoint.request_body.schema_def:
            properties = endpoint.request_body.schema_def.get("properties", {})
            if properties:
                sample_body = {}
                invalid_body = {}
                for key, prop in properties.items():
                    prop_type = prop.get("type", "string")
                    if prop_type == "integer":
                        sample_body[key] = 42
                        invalid_body[key] = "not_an_int"
                    elif prop_type == "boolean":
                        sample_body[key] = True
                        invalid_body[key] = "not_a_bool"
                    elif prop_type == "array":
                        sample_body[key] = ["item1"]
                        invalid_body[key] = "not_an_array"
                    else:
                        sample_body[key] = "sample_" + key
                        invalid_body[key] = 12345

        success_status = 201 if endpoint.method.upper() == "POST" else 200

        # 1. FUNCTIONAL - Happy Path
        test_cases.append(
            GeneratedTestCase(
                name=f"{endpoint.method} {endpoint.path} - Happy Path",
                description=f"Verify valid {endpoint.method} request to {endpoint.path} returns expected response code.",
                category="functional",
                method=endpoint.method,
                endpoint=endpoint.path,
                headers={"Content-Type": "application/json"},
                query_params=sample_query_params,
                path_params=sample_path_params,
                body=sample_body,
                expected_status_code=success_status,
                assertions=[
                    Assertion(type="status_code", operator="equals", expected_value=success_status),
                    Assertion(type="response_time_below", operator="less_than", expected_value=2000),
                ],
                priority="high",
            )
        )

        # 2. NEGATIVE - Missing Required Parameters / Resource Not Found
        if path_param_names:
            neg_path_params = {p: "non_existent_99999" for p in path_param_names}
            test_cases.append(
                GeneratedTestCase(
                    name=f"{endpoint.method} {endpoint.path} - Resource Not Found",
                    description="Verify requesting a non-existent resource ID returns 404 Not Found.",
                    category="negative",
                    method=endpoint.method,
                    endpoint=endpoint.path,
                    headers={"Content-Type": "application/json"},
                    query_params=sample_query_params,
                    path_params=neg_path_params,
                    body=sample_body,
                    expected_status_code=404,
                    assertions=[
                        Assertion(type="status_code", operator="equals", expected_value=404),
                    ],
                    priority="medium",
                )
            )

        if invalid_body:
            test_cases.append(
                GeneratedTestCase(
                    name=f"{endpoint.method} {endpoint.path} - Invalid Schema Types",
                    description="Verify sending invalid parameter types in request body returns 422/400 validation error.",
                    category="negative",
                    method=endpoint.method,
                    endpoint=endpoint.path,
                    headers={"Content-Type": "application/json"},
                    query_params=sample_query_params,
                    path_params=sample_path_params,
                    body=invalid_body,
                    expected_status_code=422,
                    assertions=[
                        Assertion(type="status_code", operator="equals", expected_value=422),
                    ],
                    priority="high",
                )
            )

        # 3. EDGE CASE - Malformed Data / Unexpected Values
        edge_body = {"malformed_field": "X" * 5000} if sample_body else None
        test_cases.append(
            GeneratedTestCase(
                name=f"{endpoint.method} {endpoint.path} - Malformed Payload / Large Field",
                description="Verify endpoint handles oversized or unexpected fields gracefully without internal crash.",
                category="edge",
                method=endpoint.method,
                endpoint=endpoint.path,
                headers={"Content-Type": "application/json"},
                query_params={"unexpected_param": "!@#$%^&*()"},
                path_params=sample_path_params,
                body=edge_body,
                expected_status_code=400,
                assertions=[
                    Assertion(type="status_code", operator="equals", expected_value=400),
                ],
                priority="medium",
            )
        )

        # 4. SECURITY - Missing Auth Token
        test_cases.append(
            GeneratedTestCase(
                name=f"{endpoint.method} {endpoint.path} - Unauthorized Access",
                description="Verify endpoint denies requests missing proper authentication headers.",
                category="security",
                method=endpoint.method,
                endpoint=endpoint.path,
                headers={},
                query_params=sample_query_params,
                path_params=sample_path_params,
                body=sample_body,
                expected_status_code=401,
                assertions=[
                    Assertion(type="status_code", operator="equals", expected_value=401),
                ],
                priority="high",
            )
        )

        return test_cases
