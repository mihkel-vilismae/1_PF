/** Geocode dry-run contract from sample GPS metadata. */
import { findGeocodeProvider, providerIdsFromMatrix } from './geocode-provider-selection-lib.mjs';

const DEFAULT_SAMPLE = Object.freeze({ sample_id: 'tallinn_redacted_sample', gps_present: true, latitude_class: 'redacted_northern_europe', longitude_class: 'redacted_northern_europe' });

export function buildGeocodeDryRunPlan({ providerId = 'nominatim_osm', sample = DEFAULT_SAMPLE, allowLiveCall = false } = {}) {
  const provider = findGeocodeProvider(providerId);
  const checks = [
    { name: 'sample_has_gps_metadata', passed: Boolean(sample.gps_present) },
    { name: 'provider_supported', passed: Boolean(provider), provider_id: providerId },
    { name: 'live_call_disabled_by_default', passed: allowLiveCall === false },
    { name: 'exact_coordinates_redacted', passed: !('latitude' in sample) && !('longitude' in sample) },
  ];
  return {
    proof_status: checks.every((check) => check.passed) ? 'PASSED' : 'BLOCKED',
    provider_id: providerId,
    supported_provider_ids: providerIdsFromMatrix(),
    sample,
    allow_live_call: Boolean(allowLiveCall),
    planned_query: provider ? { provider_id: provider.provider_id, type: provider.type, required_env: provider.required_env, exact_query_redacted: true } : null,
    checks,
    safety: { exact_gps_returned: false, exact_address_returned: false, provider_called: false, dry_run_only: true },
  };
}
