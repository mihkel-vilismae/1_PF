"""HTTP reverse-geocode providers for the backend media pipeline.

All network providers are disabled by default and use a shared configuration
contract for account usernames, account IDs, API keys, tokens, and endpoints.
"""

from abc import ABC, abstractmethod
import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .geocode_config import GeocodeProviderConfig
from .geocode_placeholder_provider import build_address_cache_key
from .provider_contracts import ReverseGeocodeInput, ReverseGeocodeResult


class HttpReverseGeocodeProvider(ABC):
    """Base class for disabled-by-default HTTP reverse-geocode adapters."""

    provider_id: str
    requires_api_key = False
    requires_access_token = False
    requires_base_url = False

    def __init__(self, config: GeocodeProviderConfig):
        """Stores standardized provider configuration for one adapter."""

        self.config = config

    def reverse_geocode(self, provider_input: ReverseGeocodeInput) -> ReverseGeocodeResult:
        """Runs the provider when enabled and returns sanitized results."""

        if not self.config.enabled:
            return ReverseGeocodeResult.skipped(
                self.provider_id,
                "provider_disabled",
                "Provider is disabled by configuration.",
            )
        if not self.config.network_enabled:
            return ReverseGeocodeResult.skipped(
                self.provider_id,
                "network_providers_disabled",
                "Network geocoding providers are disabled by the global safety gate.",
            )
        if self.requires_api_key and not self.config.api_key:
            return ReverseGeocodeResult.skipped(
                self.provider_id,
                "api_key_missing",
                "Provider requires GEOCODE_<PROVIDER>_API_KEY.",
            )
        if self.requires_access_token and not self.config.access_token:
            return ReverseGeocodeResult.skipped(
                self.provider_id,
                "access_token_missing",
                "Provider requires GEOCODE_<PROVIDER>_ACCESS_TOKEN.",
            )
        if self.requires_base_url and not self.config.base_url:
            return ReverseGeocodeResult.skipped(
                self.provider_id,
                "base_url_missing",
                "Provider requires GEOCODE_<PROVIDER>_BASE_URL.",
            )

        try:
            payload = self._request_json(self._build_url(provider_input), self._build_headers())
            address_text, response_summary = self._extract_address(payload)
        except Exception as error:
            return ReverseGeocodeResult.failed(self.provider_id, "geocode_http_failed", str(error))

        if not address_text:
            return ReverseGeocodeResult.no_result(
                self.provider_id,
                "address_not_found",
                "Provider returned no usable formatted address.",
            )

        cache_key, rounded_latitude, rounded_longitude = build_address_cache_key(
            provider_input.latitude,
            provider_input.longitude,
        )
        return ReverseGeocodeResult.succeeded(
            self.provider_id,
            address_text,
            cache_key,
            rounded_latitude,
            rounded_longitude,
            provider_input.language_code,
            {
                "provider": self.provider_id,
                "summary": response_summary,
            },
        )

    def _build_headers(self) -> dict[str, str]:
        """Builds safe request headers without exposing credentials."""

        user_agent = self.config.user_agent or "PF_login PhotoFrame Geocoder/0.7.32"
        headers = {"Accept": "application/json", "User-Agent": user_agent}
        if self.config.contact_email:
            headers["From"] = self.config.contact_email
        return headers

    def _request_json(self, url: str, headers: dict[str, str]) -> dict[str, Any]:
        """Fetches and parses a JSON response from one provider endpoint."""

        request = Request(url, headers=headers)
        try:
            with urlopen(request, timeout=self.config.timeout_seconds) as response:
                body = response.read().decode("utf-8")
        except HTTPError as error:
            raise RuntimeError(f"HTTP {error.code} from {self.provider_id}") from error
        except URLError as error:
            raise RuntimeError(f"Network error from {self.provider_id}: {error.reason}") from error
        return json.loads(body)

    def _url_with_query(self, base_url: str, params: dict[str, Any]) -> str:
        """Appends URL query parameters for provider requests."""

        return f"{base_url}?{urlencode(params)}"

    @abstractmethod
    def _build_url(self, provider_input: ReverseGeocodeInput) -> str:
        """Builds the provider-specific reverse-geocode URL."""

    @abstractmethod
    def _extract_address(self, payload: dict[str, Any]) -> tuple[str | None, dict[str, Any]]:
        """Extracts a formatted address and sanitized summary from a payload."""


def join_address_parts(parts: list[Any]) -> str | None:
    """Combines non-empty address fragments into one display string."""

    text_parts = [str(part).strip() for part in parts if str(part or "").strip()]
    return ", ".join(text_parts) if text_parts else None


class NominatimOsmGeocodeProvider(HttpReverseGeocodeProvider):
    """Reverse-geocodes coordinates through a Nominatim-compatible endpoint."""

    provider_id = "nominatim_osm"

    def _build_url(self, provider_input: ReverseGeocodeInput) -> str:
        """Builds the Nominatim reverse endpoint URL."""

        base_url = self.config.base_url or "https://nominatim.openstreetmap.org/reverse"
        return self._url_with_query(
            base_url,
            {
                "format": "jsonv2",
                "lat": provider_input.latitude,
                "lon": provider_input.longitude,
                "addressdetails": 1,
                "accept-language": provider_input.language_code,
            },
        )

    def _extract_address(self, payload: dict[str, Any]) -> tuple[str | None, dict[str, Any]]:
        """Extracts Nominatim display_name from the provider response."""

        return payload.get("display_name"), {"osm_type": payload.get("osm_type"), "osm_id": payload.get("osm_id")}


class PhotonKomootGeocodeProvider(HttpReverseGeocodeProvider):
    """Reverse-geocodes coordinates through a Photon-compatible endpoint."""

    provider_id = "photon_komoot"

    def _build_url(self, provider_input: ReverseGeocodeInput) -> str:
        """Builds the Photon reverse endpoint URL."""

        base_url = self.config.base_url or "https://photon.komoot.io/reverse"
        return self._url_with_query(
            base_url,
            {
                "lat": provider_input.latitude,
                "lon": provider_input.longitude,
                "lang": provider_input.language_code,
            },
        )

    def _extract_address(self, payload: dict[str, Any]) -> tuple[str | None, dict[str, Any]]:
        """Extracts a readable address from the first Photon feature."""

        features = payload.get("features") or []
        if not features:
            return None, {"feature_count": 0}
        properties = features[0].get("properties") or {}
        address = join_address_parts([
            properties.get("name"),
            properties.get("housenumber"),
            properties.get("street"),
            properties.get("postcode"),
            properties.get("city"),
            properties.get("state"),
            properties.get("country"),
        ])
        return address, {"feature_count": len(features), "osm_id": properties.get("osm_id")}


class PostcodesIoUkGeocodeProvider(HttpReverseGeocodeProvider):
    """Reverse-geocodes UK coordinates to nearest postcode/admin data."""

    provider_id = "postcodes_io_uk"

    def _build_url(self, provider_input: ReverseGeocodeInput) -> str:
        """Builds the Postcodes.io reverse postcode endpoint URL."""

        base_url = self.config.base_url or "https://api.postcodes.io/postcodes"
        return self._url_with_query(
            base_url,
            {
                "lon": provider_input.longitude,
                "lat": provider_input.latitude,
            },
        )

    def _extract_address(self, payload: dict[str, Any]) -> tuple[str | None, dict[str, Any]]:
        """Extracts postcode-oriented address text from Postcodes.io."""

        results = payload.get("result") or []
        if not results:
            return None, {"result_count": 0}
        result = results[0]
        address = join_address_parts([
            result.get("postcode"),
            result.get("admin_ward"),
            result.get("admin_district"),
            result.get("region"),
            result.get("country"),
        ])
        return address, {"result_count": len(results), "distance_meters": result.get("distance")}


class PeliasSelfHostedGeocodeProvider(HttpReverseGeocodeProvider):
    """Reverse-geocodes coordinates through a configured Pelias instance."""

    provider_id = "pelias_self_hosted"
    requires_base_url = True

    def _build_url(self, provider_input: ReverseGeocodeInput) -> str:
        """Builds the Pelias /v1/reverse endpoint URL."""

        base_url = str(self.config.base_url).rstrip("/")
        if not base_url.endswith("/v1/reverse"):
            base_url = f"{base_url}/v1/reverse"
        return self._url_with_query(
            base_url,
            {
                "point.lat": provider_input.latitude,
                "point.lon": provider_input.longitude,
                "lang": provider_input.language_code,
            },
        )

    def _extract_address(self, payload: dict[str, Any]) -> tuple[str | None, dict[str, Any]]:
        """Extracts a Pelias label from the first returned feature."""

        features = payload.get("features") or []
        if not features:
            return None, {"feature_count": 0}
        properties = features[0].get("properties") or {}
        return properties.get("label") or properties.get("name"), {"feature_count": len(features), "gid": properties.get("gid")}


class OpenCageGeocodeProvider(HttpReverseGeocodeProvider):
    """Reverse-geocodes coordinates through the OpenCage API."""

    provider_id = "opencage"
    requires_api_key = True

    def _build_url(self, provider_input: ReverseGeocodeInput) -> str:
        """Builds the OpenCage geocode endpoint URL."""

        base_url = self.config.base_url or "https://api.opencagedata.com/geocode/v1/json"
        return self._url_with_query(
            base_url,
            {
                "q": f"{provider_input.latitude},{provider_input.longitude}",
                "key": self.config.api_key,
                "language": provider_input.language_code,
                "no_annotations": 1,
            },
        )

    def _extract_address(self, payload: dict[str, Any]) -> tuple[str | None, dict[str, Any]]:
        """Extracts the first OpenCage formatted result."""

        results = payload.get("results") or []
        if not results:
            return None, {"result_count": 0}
        return results[0].get("formatted"), {"result_count": len(results), "confidence": results[0].get("confidence")}


class GeoapifyGeocodeProvider(HttpReverseGeocodeProvider):
    """Reverse-geocodes coordinates through the Geoapify API."""

    provider_id = "geoapify"
    requires_api_key = True

    def _build_url(self, provider_input: ReverseGeocodeInput) -> str:
        """Builds the Geoapify reverse geocode endpoint URL."""

        base_url = self.config.base_url or "https://api.geoapify.com/v1/geocode/reverse"
        return self._url_with_query(
            base_url,
            {
                "lat": provider_input.latitude,
                "lon": provider_input.longitude,
                "apiKey": self.config.api_key,
                "lang": provider_input.language_code,
            },
        )

    def _extract_address(self, payload: dict[str, Any]) -> tuple[str | None, dict[str, Any]]:
        """Extracts the first Geoapify formatted address."""

        features = payload.get("features") or []
        if not features:
            return None, {"feature_count": 0}
        properties = features[0].get("properties") or {}
        return properties.get("formatted"), {"feature_count": len(features), "distance": properties.get("distance")}


class MapboxGeocodingProvider(HttpReverseGeocodeProvider):
    """Reverse-geocodes coordinates through the Mapbox Geocoding API."""

    provider_id = "mapbox"
    requires_access_token = True

    def _build_url(self, provider_input: ReverseGeocodeInput) -> str:
        """Builds the Mapbox v6 reverse geocode endpoint URL."""

        base_url = self.config.base_url or "https://api.mapbox.com/search/geocode/v6/reverse"
        return self._url_with_query(
            base_url,
            {
                "longitude": provider_input.longitude,
                "latitude": provider_input.latitude,
                "access_token": self.config.access_token,
                "language": provider_input.language_code,
            },
        )

    def _extract_address(self, payload: dict[str, Any]) -> tuple[str | None, dict[str, Any]]:
        """Extracts the first Mapbox full address or place label."""

        features = payload.get("features") or []
        if not features:
            return None, {"feature_count": 0}
        properties = features[0].get("properties") or {}
        address = properties.get("full_address") or join_address_parts([
            properties.get("name"),
            properties.get("place_formatted"),
        ])
        return address, {"feature_count": len(features), "mapbox_id": properties.get("mapbox_id")}


class GoogleGeocodingProvider(HttpReverseGeocodeProvider):
    """Reverse-geocodes coordinates through the Google Geocoding API."""

    provider_id = "google_geocoding"
    requires_api_key = True

    def _build_url(self, provider_input: ReverseGeocodeInput) -> str:
        """Builds the Google Geocoding reverse endpoint URL."""

        base_url = self.config.base_url or "https://maps.googleapis.com/maps/api/geocode/json"
        return self._url_with_query(
            base_url,
            {
                "latlng": f"{provider_input.latitude},{provider_input.longitude}",
                "key": self.config.api_key,
                "language": provider_input.language_code,
            },
        )

    def _extract_address(self, payload: dict[str, Any]) -> tuple[str | None, dict[str, Any]]:
        """Extracts the first Google formatted address when status is OK."""

        if payload.get("status") != "OK":
            return None, {"status": payload.get("status")}
        results = payload.get("results") or []
        if not results:
            return None, {"status": payload.get("status"), "result_count": 0}
        return results[0].get("formatted_address"), {"status": payload.get("status"), "result_count": len(results)}
