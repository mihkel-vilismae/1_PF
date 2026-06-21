import { createHash } from 'node:crypto';

export const REAL_GEOCODE_PROVIDER_ADAPTERS = Object.freeze({
  nominatim_osm: {
    provider_id: 'nominatim_osm',
    type: 'public_nominatim_reverse',
    env_prefix: 'GEOCODE_NOMINATIM_OSM',
    default_base_url: 'https://nominatim.openstreetmap.org/reverse',
    required_env: ['GEOCODE_NOMINATIM_OSM_USER_AGENT'],
    optional_env: ['GEOCODE_NOMINATIM_OSM_CONTACT_EMAIL', 'GEOCODE_NOMINATIM_OSM_BASE_URL', 'GEOCODE_NOMINATIM_OSM_TIMEOUT_SECONDS'],
    minimum_request_interval_milliseconds: 1000,
    cache_required: true,
    attribution_required: true,
    policy_summary: 'Public Nominatim requires a valid identifying User-Agent/Referer, an absolute maximum of 1 request per second, and caching where possible.',
  },
  photon_komoot: {
    provider_id: 'photon_komoot',
    type: 'public_photon_reverse',
    env_prefix: 'GEOCODE_PHOTON_KOMOOT',
    required_env: [],
    optional_env: ['GEOCODE_PHOTON_KOMOOT_USER_AGENT', 'GEOCODE_PHOTON_KOMOOT_BASE_URL', 'GEOCODE_PHOTON_KOMOOT_TIMEOUT_SECONDS'],
    minimum_request_interval_milliseconds: 1000,
    cache_required: true,
    attribution_required: true,
    policy_summary: 'Public reverse-geocode providers should be opt-in, cached, and rate-limited.',
  },
  postcodes_io_uk: {
    provider_id: 'postcodes_io_uk',
    type: 'public_postcode_reverse',
    env_prefix: 'GEOCODE_POSTCODES_IO_UK',
    required_env: [],
    optional_env: ['GEOCODE_POSTCODES_IO_UK_USER_AGENT', 'GEOCODE_POSTCODES_IO_UK_BASE_URL', 'GEOCODE_POSTCODES_IO_UK_TIMEOUT_SECONDS'],
    minimum_request_interval_milliseconds: 1000,
    cache_required: true,
    attribution_required: true,
    policy_summary: 'Public reverse-geocode providers should be opt-in, cached, and rate-limited.',
  },
  pelias_self_hosted: {
    provider_id: 'pelias_self_hosted',
    type: 'self_hosted_reverse',
    env_prefix: 'GEOCODE_PELIAS_SELF_HOSTED',
    required_env: ['GEOCODE_PELIAS_SELF_HOSTED_BASE_URL'],
    optional_env: ['GEOCODE_PELIAS_SELF_HOSTED_USER_AGENT', 'GEOCODE_PELIAS_SELF_HOSTED_TIMEOUT_SECONDS'],
    minimum_request_interval_milliseconds: 0,
    cache_required: true,
    attribution_required: false,
    policy_summary: 'Self-hosted provider requires explicit base URL and should still use cache for repeat proof runs.',
  },
  opencage: { provider_id: 'opencage', type: 'api_key_reverse', env_prefix: 'GEOCODE_OPENCAGE', required_env: ['GEOCODE_OPENCAGE_API_KEY'], optional_env: ['GEOCODE_OPENCAGE_TIMEOUT_SECONDS'], minimum_request_interval_milliseconds: 1000, cache_required: true, attribution_required: true, policy_summary: 'API-key provider requires secret-safe configuration outside proof artifacts.' },
  geoapify: { provider_id: 'geoapify', type: 'api_key_reverse', env_prefix: 'GEOCODE_GEOAPIFY', required_env: ['GEOCODE_GEOAPIFY_API_KEY'], optional_env: ['GEOCODE_GEOAPIFY_TIMEOUT_SECONDS'], minimum_request_interval_milliseconds: 1000, cache_required: true, attribution_required: true, policy_summary: 'API-key provider requires secret-safe configuration outside proof artifacts.' },
  mapbox: { provider_id: 'mapbox', type: 'access_token_reverse', env_prefix: 'GEOCODE_MAPBOX', required_env: ['GEOCODE_MAPBOX_ACCESS_TOKEN'], optional_env: ['GEOCODE_MAPBOX_TIMEOUT_SECONDS'], minimum_request_interval_milliseconds: 1000, cache_required: true, attribution_required: true, policy_summary: 'Access-token provider requires secret-safe configuration outside proof artifacts.' },
  google_geocoding: { provider_id: 'google_geocoding', type: 'api_key_reverse', env_prefix: 'GEOCODE_GOOGLE_GEOCODING', required_env: ['GEOCODE_GOOGLE_GEOCODING_API_KEY'], optional_env: ['GEOCODE_GOOGLE_GEOCODING_TIMEOUT_SECONDS'], minimum_request_interval_milliseconds: 1000, cache_required: true, attribution_required: true, policy_summary: 'API-key provider requires secret-safe configuration outside proof artifacts.' },
});

function sha256(value) {
  return `sha256:${createHash('sha256').update(String(value ?? '')).digest('hex')}`;
}

function configured(env, key) {
  return String(env[key] ?? '').trim().length > 0;
}

export function getRealGeocodeProviderAdapter(providerId) {
  return REAL_GEOCODE_PROVIDER_ADAPTERS[providerId] ?? null;
}

export function buildProviderSafetyReadiness({ providerId, env = process.env } = {}) {
  const adapter = getRealGeocodeProviderAdapter(providerId);
  if (!adapter) {
    return {
      provider_id: providerId || null,
      supported: false,
      proof_status: 'BLOCKED',
      checks: [{ name: 'provider_adapter_supported', passed: false, detail: providerId || null }],
    };
  }
  const requiredEnv = adapter.required_env.map((key) => ({ key, configured: configured(env, key), value_redacted: configured(env, key) ? '[CONFIGURED]' : null }));
  const optionalEnv = adapter.optional_env.map((key) => ({ key, configured: configured(env, key), value_redacted: configured(env, key) ? '[CONFIGURED]' : null }));
  const checks = [
    { name: 'provider_adapter_supported', passed: true, detail: providerId },
    { name: 'required_provider_env_configured', passed: requiredEnv.every((entry) => entry.configured), detail: requiredEnv.map((entry) => ({ key: entry.key, configured: entry.configured })) },
    { name: 'provider_cache_required', passed: adapter.cache_required === true, detail: adapter.cache_required },
    { name: 'provider_rate_limit_policy_declared', passed: Number.isFinite(adapter.minimum_request_interval_milliseconds), detail: adapter.minimum_request_interval_milliseconds },
  ];
  return {
    provider_id: providerId,
    supported: true,
    adapter: {
      provider_id: adapter.provider_id,
      type: adapter.type,
      env_prefix: adapter.env_prefix,
      default_base_url: adapter.default_base_url ?? null,
      minimum_request_interval_milliseconds: adapter.minimum_request_interval_milliseconds,
      cache_required: adapter.cache_required,
      attribution_required: adapter.attribution_required,
      policy_summary: adapter.policy_summary,
    },
    required_env: requiredEnv,
    optional_env: optionalEnv,
    checks,
    proof_status: checks.every((check) => check.passed) ? 'PASSED' : 'BLOCKED',
  };
}

export function buildGeocodeCacheKey({ providerId, latitude, longitude, languageCode = 'en' } = {}) {
  const roundedLatitude = Number.parseFloat(Number(latitude).toFixed(5));
  const roundedLongitude = Number.parseFloat(Number(longitude).toFixed(5));
  return sha256(JSON.stringify({ providerId, roundedLatitude, roundedLongitude, languageCode }));
}

export function normalizeGeocodeAddressArtifact({ providerId, fixture = {}, providerResult = {}, payload = {} } = {}) {
  const addressText = String(providerResult.address_text ?? '').trim();
  const providerResponse = providerResult.provider_response ?? {};
  return {
    schema_version: 1,
    artifact_kind: 'normalized_real_geocode_address',
    provider_id: providerId,
    source_level: 'provider_coordinate_fixture',
    coordinate: {
      latitude: Number(fixture.latitude),
      longitude: Number(fixture.longitude),
      language_code: fixture.languageCode ?? 'en',
      precision: 'fixture',
    },
    cache: {
      cache_key: buildGeocodeCacheKey({ providerId, latitude: fixture.latitude, longitude: fixture.longitude, languageCode: fixture.languageCode ?? 'en' }),
      cache_first_verified: payload?.cache_miss?.provider_id === 'address_cache' && payload?.cache_hit?.provider_id === 'address_cache',
      cache_inserted: payload?.cache_inserted === true,
    },
    address: {
      display_name: addressText,
      country: providerResponse.address?.country ?? null,
      country_code: providerResponse.address?.country_code ?? null,
      city: providerResponse.address?.city ?? providerResponse.address?.town ?? providerResponse.address?.village ?? null,
      county: providerResponse.address?.county ?? null,
      state: providerResponse.address?.state ?? null,
      postcode: providerResponse.address?.postcode ?? null,
      road: providerResponse.address?.road ?? null,
    },
    overlay_ready: {
      primary_line: addressText,
      secondary_line: providerResponse.address?.country ?? providerId,
    },
    safety: {
      raw_provider_payload_included: false,
      provider_secrets_included: false,
      private_paths_included: false,
    },
  };
}

export function validateNormalizedGeocodeAddressArtifact(artifact) {
  const errors = [];
  if (artifact?.schema_version !== 1) errors.push('schema_version must be 1');
  if (artifact?.artifact_kind !== 'normalized_real_geocode_address') errors.push('artifact_kind must be normalized_real_geocode_address');
  if (!artifact?.provider_id) errors.push('provider_id is required');
  if (!Number.isFinite(artifact?.coordinate?.latitude) || !Number.isFinite(artifact?.coordinate?.longitude)) errors.push('finite latitude/longitude required');
  if (!String(artifact?.address?.display_name ?? '').trim()) errors.push('address.display_name is required');
  if (!String(artifact?.overlay_ready?.primary_line ?? '').trim()) errors.push('overlay_ready.primary_line is required');
  if (artifact?.safety?.raw_provider_payload_included !== false) errors.push('raw provider payload must not be included');
  if (artifact?.safety?.provider_secrets_included !== false) errors.push('provider secrets must not be included');
  return { status: errors.length ? 'FAILED' : 'PASSED', errors };
}
