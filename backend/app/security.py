import ipaddress
import re
from urllib.parse import urlparse

from app.config import settings

SENSITIVE_KEYS = {"password", "token", "authorization", "api_key", "apikey", "secret", "bearer"}


def validate_target_url(url: str) -> None:
    """
    Validate target API URL to prevent SSRF attacks.
    Blocks private IP ranges and localhost unless explicitly allowed in settings.
    """
    parsed = urlparse(url)
    if not parsed.scheme or parsed.scheme not in ("http", "https"):
        raise ValueError(f"Invalid URL scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("Invalid target URL: missing hostname.")

    if settings.ALLOW_LOCAL_TARGETS:
        return

    # Check for localhost / loopback string hostnames
    if hostname.lower() in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
        raise ValueError("Requests to local/loopback endpoints are prohibited.")

    # Check for IP address literals
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise ValueError(f"Requests to private IP space ({hostname}) are prohibited.")
    except ValueError:
        # Not an IP literal, standard hostname resolution can occur at runtime
        pass


def sanitize_log_data(data: dict) -> dict:
    """Scrub sensitive keys like tokens or passwords from dictionary logs."""
    sanitized = {}
    for key, value in data.items():
        if any(sens in key.lower() for sens in SENSITIVE_KEYS):
            sanitized[key] = "[REDACTED]"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value)
        else:
            sanitized[key] = value
    return sanitized
