"""Configuration helpers for backend reverse-geocode providers.

The helpers centralize provider account, username, token, endpoint, and enable
flags so every geocoder adapter reads configuration through the same contract.
"""

from dataclasses import dataclass, field
import os
from typing import Mapping


TRUE_VALUES = {"1", "true", "yes", "on", "enabled"}
FALSE_VALUES = {"0", "false", "no", "off", "disabled"}


@dataclass(frozen=True)
class GeocodeProviderConfig:
    """Stores standardized settings shared by every reverse-geocode provider."""

    provider_id: str
    enabled: bool
    network_enabled: bool
    account_username: str | None = None
    account_id: str | None = None
    contact_email: str | None = None
    api_key: str | None = None
    access_token: str | None = None
    user_agent: str | None = None
    base_url: str | None = None
    timeout_seconds: float = 10.0
    extra: dict[str, str] = field(default_factory=dict)


def provider_env_prefix(provider_id: str) -> str:
    """Builds the standardized environment prefix for one provider id."""

    safe_id = "".join(character if character.isalnum() else "_" for character in provider_id.upper())
    return f"GEOCODE_{safe_id}"


def read_bool_env(env: Mapping[str, str], key: str, default: bool) -> bool:
    """Reads a boolean environment value while preserving a safe default."""

    raw_value = env.get(key)
    if raw_value is None or str(raw_value).strip() == "":
        return default
    normalized = str(raw_value).strip().lower()
    if normalized in TRUE_VALUES:
        return True
    if normalized in FALSE_VALUES:
        return False
    return default


def read_float_env(env: Mapping[str, str], key: str, default: float) -> float:
    """Reads a float environment value and falls back when it is invalid."""

    raw_value = env.get(key)
    if raw_value is None or str(raw_value).strip() == "":
        return default
    try:
        return float(str(raw_value).strip())
    except ValueError:
        return default


def read_string_env(env: Mapping[str, str], key: str, default: str | None = None) -> str | None:
    """Reads a stripped string environment value with empty strings as None."""

    raw_value = env.get(key)
    if raw_value is None:
        return default
    value = str(raw_value).strip()
    return value if value else default


def network_providers_enabled(env: Mapping[str, str] | None = None) -> bool:
    """Returns the global safety gate for all HTTP reverse-geocode providers."""

    effective_env = env or os.environ
    default_value = read_bool_env(effective_env, "GEOCODE_NETWORK_PROVIDERS_ENABLED", False)
    return read_bool_env(effective_env, "GEOCODE_ALLOW_NETWORK_PROVIDERS", default_value)


def read_provider_config(
    provider_id: str,
    *,
    default_enabled: bool = False,
    default_base_url: str | None = None,
    default_timeout_seconds: float = 10.0,
    env: Mapping[str, str] | None = None,
) -> GeocodeProviderConfig:
    """Reads standardized account and credential fields for one provider."""

    effective_env = env or os.environ
    prefix = provider_env_prefix(provider_id)
    return GeocodeProviderConfig(
        provider_id=provider_id,
        enabled=read_bool_env(effective_env, f"{prefix}_ENABLED", default_enabled),
        network_enabled=network_providers_enabled(effective_env),
        account_username=read_string_env(effective_env, f"{prefix}_ACCOUNT_USERNAME"),
        account_id=read_string_env(effective_env, f"{prefix}_ACCOUNT_ID"),
        contact_email=read_string_env(effective_env, f"{prefix}_CONTACT_EMAIL"),
        api_key=read_string_env(effective_env, f"{prefix}_API_KEY"),
        access_token=read_string_env(effective_env, f"{prefix}_ACCESS_TOKEN"),
        user_agent=read_string_env(effective_env, f"{prefix}_USER_AGENT"),
        base_url=read_string_env(effective_env, f"{prefix}_BASE_URL", default_base_url),
        timeout_seconds=read_float_env(effective_env, f"{prefix}_TIMEOUT_SECONDS", default_timeout_seconds),
        extra={
            "env_prefix": prefix,
        },
    )


def read_provider_order(default_order: list[str], env: Mapping[str, str] | None = None) -> list[str]:
    """Reads the configured provider order while keeping known defaults safe."""

    effective_env = env or os.environ
    raw_order = effective_env.get("GEOCODE_PROVIDER_ORDER")
    if raw_order is None or str(raw_order).strip() == "":
        return list(default_order)
    configured_order = [part.strip() for part in str(raw_order).split(",") if part.strip()]
    return configured_order or list(default_order)
