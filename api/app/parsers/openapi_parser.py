import json
from typing import Any
import yaml

from app.schemas import APIEndpoint, APIParameter, RequestSchema, ResponseSchema


class OpenAPIParser:
    """Parses OpenAPI 3.x specifications (JSON or YAML) into normalized internal models."""

    def __init__(self, raw_content: str, spec_format: str = "json"):
        self.raw_content = raw_content
        self.spec_format = spec_format.lower()
        self.doc: dict[str, Any] = {}
        self._load_doc()

    def _load_doc(self) -> None:
        try:
            if self.spec_format == "yaml" or self.raw_content.strip().startswith("openapi:"):
                self.doc = yaml.safe_load(self.raw_content)
            else:
                self.doc = json.loads(self.raw_content)
        except Exception as err:
            raise ValueError(f"Could not parse OpenAPI specification ({self.spec_format}): {str(err)}")

        if not isinstance(self.doc, dict):
            raise ValueError("Invalid OpenAPI document: Root structure must be a JSON object.")

        version = self.doc.get("openapi", "")
        if not version.startswith("3."):
            raise ValueError(f"Unsupported OpenAPI version '{version}'. TestPilot supports OpenAPI 3.x specifications.")

    def _resolve_ref(self, ref_path: str) -> dict[str, Any]:
        """Resolves internal JSON pointer references like '#/components/schemas/User'."""
        if not ref_path.startswith("#/"):
            return {}
        parts = ref_path.lstrip("#/").split("/")
        current = self.doc
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return {}
        return current if isinstance(current, dict) else {}

    def _dereference(self, schema_or_ref: dict[str, Any] | None) -> dict[str, Any]:
        """Deep dereference of `$ref` pointers within schema dictionaries."""
        if not schema_or_ref or not isinstance(schema_or_ref, dict):
            return {}

        if "$ref" in schema_or_ref:
            resolved = self._resolve_ref(schema_or_ref["$ref"])
            # Merge resolved attributes while giving precedence to local inline keys
            merged = {**resolved, **{k: v for k, v in schema_or_ref.items() if k != "$ref"}}
            return self._dereference(merged)

        result = {}
        for key, value in schema_or_ref.items():
            if isinstance(value, dict):
                result[key] = self._dereference(value)
            elif isinstance(value, list):
                result[key] = [self._dereference(item) if isinstance(item, dict) else item for item in value]
            else:
                result[key] = value
        return result

    def get_title(self) -> str:
        return self.doc.get("info", {}).get("title", "Untitled API")

    def get_version(self) -> str:
        return self.doc.get("info", {}).get("version", "1.0.0")

    def get_base_url(self) -> str:
        servers = self.doc.get("servers", [])
        if servers and isinstance(servers, list) and len(servers) > 0:
            return servers[0].get("url", "")
        return ""

    def parse_endpoints(self) -> list[APIEndpoint]:
        endpoints: list[APIEndpoint] = []
        paths = self.doc.get("paths", {})
        if not isinstance(paths, dict):
            return endpoints

        for path_str, path_item in paths.items():
            if not isinstance(path_item, dict):
                continue

            # Shared parameters at the path level
            common_params = path_item.get("parameters", [])

            for method_str, operation in path_item.items():
                if method_str.lower() not in ("get", "post", "put", "delete", "patch", "head", "options"):
                    continue
                if not isinstance(operation, dict):
                    continue

                endpoints.append(self._parse_operation(path_str, method_str.upper(), operation, common_params))

        return endpoints

    def _parse_operation(
        self, path: str, method: str, operation: dict[str, Any], common_params: list[Any]
    ) -> APIEndpoint:
        summary = operation.get("summary")
        description = operation.get("description")

        # Parse parameters
        all_raw_params = list(common_params) + operation.get("parameters", [])
        parameters: list[APIParameter] = []
        for raw_p in all_raw_params:
            deref_p = self._dereference(raw_p)
            if not deref_p.get("name"):
                continue

            schema_def = self._dereference(deref_p.get("schema", {}))
            param_type = schema_def.get("type", "string")

            parameters.append(
                APIParameter(
                    name=deref_p["name"],
                    location=deref_p.get("in", "query"),
                    required=deref_p.get("required", False),
                    param_type=param_type,
                    description=deref_p.get("description"),
                    schema_def=schema_def,
                )
            )

        # Parse requestBody
        request_body_obj = None
        raw_body = operation.get("requestBody")
        if raw_body:
            deref_body = self._dereference(raw_body)
            content = deref_body.get("content", {})
            json_content = content.get("application/json") or next(iter(content.values()), None)
            if json_content and isinstance(json_content, dict):
                body_schema = self._dereference(json_content.get("schema", {}))
                request_body_obj = RequestSchema(
                    content_type="application/json",
                    schema_def=body_schema,
                    example=json_content.get("example"),
                )

        # Parse responses
        responses: list[ResponseSchema] = []
        raw_responses = operation.get("responses", {})
        if isinstance(raw_responses, dict):
            for code_str, resp_item in raw_responses.items():
                deref_resp = self._dereference(resp_item)
                code = 200
                if code_str.isdigit():
                    code = int(code_str)

                resp_content = deref_resp.get("content", {})
                resp_schema_def = {}
                if isinstance(resp_content, dict):
                    json_resp = resp_content.get("application/json") or next(iter(resp_content.values()), None)
                    if json_resp and isinstance(json_resp, dict):
                        resp_schema_def = self._dereference(json_resp.get("schema", {}))

                responses.append(
                    ResponseSchema(
                        status_code=code,
                        description=deref_resp.get("description", ""),
                        schema_def=resp_schema_def,
                    )
                )

        # Parse security requirements
        security = operation.get("security", self.doc.get("security", []))

        return APIEndpoint(
            path=path,
            method=method,
            summary=summary,
            description=description,
            parameters=parameters,
            request_body=request_body_obj,
            responses=responses,
            security=security if isinstance(security, list) else [],
        )
