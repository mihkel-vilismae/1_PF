/*
 * Resolves backend-status classifications for known dashboard sections.
 * These helpers keep stateful status projection separate from element matching.
 */
import { buildBackendStatusMeta, isMissingBackendStatus } from '../guideUtils.ts';

export function createBackendStatusResolvers({ getState, getTransitHasLiveTraffic }) {
  function describeHistoryEntryFromDetails(label, entry) {
    const response = entry?.details?.response;
    if (isMissingBackendStatus(response?.status)) {
      return buildBackendStatusMeta('missing', label, 'The captured backend response indicates that the expected endpoint/implementation is missing.');
    }
    if (response) {
      return buildBackendStatusMeta('real', label, 'This event includes a real backend request/response record.');
    }

    return buildBackendStatusMeta('unknown', label, 'This event does not include enough backend response metadata to classify safely.');
  }

  function getSectionBackendStatusByCode(code, label) {
    if (code === '1A-AUTH') {
      return getAuthBackendStatusMeta(label);
    }
    if (['1A', '2A', '3A'].includes(code)) {
      return getInitBackendStatusMeta(code, label);
    }
    if (typeof code === 'string' && code.startsWith('E')) {
      return getDatabaseViewerBackendStatusMeta(code, label);
    }
    if (code === 'B5') {
      return buildBackendStatusMeta('real', label, 'This section is wired to backend-owned screen simulation state only; it does not control real screen hardware.');
    }
    if (code === 'B3.1') {
      return buildBackendStatusMeta('mock', label, 'This section is intentionally frontend-only simulation rather than backend-backed.');
    }
    if (['C1', 'C2', 'C3'].includes(code)) {
      return buildBackendStatusMeta('real', label, 'This section is populated from the read-only backend orchestration last-run endpoint.');
    }
    if (code === 'C4') {
      return buildBackendStatusMeta('mock', label, 'This section is an honest fallback because screen hardware state is not represented by the orchestration last-run endpoint.');
    }
    if (code === 'C' || code === 'C5') {
      return buildBackendStatusMeta('missing', label, 'View C restore remains missing even though the read-only last-run summary is backend-wired.');
    }
    if (['B1', 'B2', 'B3', 'B3.2', 'B3.5', 'B4', 'D1', 'D2', 'D3', 'D4'].includes(code)) {
      return buildBackendStatusMeta('missing', label, 'This section stands in for backend/runtime support that is not implemented here yet.');
    }
    if (code === 'IO') {
      return buildBackendStatusMeta(
        getTransitHasLiveTraffic() ? 'real' : 'unknown',
        label,
        getTransitHasLiveTraffic()
          ? 'This terminal is currently showing real gateway traffic from dashboard API calls.'
          : 'This terminal is implemented, but no live backend traffic has been observed yet.',
      );
    }

    return buildBackendStatusMeta('unknown', label, 'No explicit backend-status classification metadata is defined for this section yet.');
  }

  function getInitBackendStatusMeta(code, label, entry = null) {
    const result = getState().initResults[code];
    const responseStatus = entry?.details?.response?.status ?? result?.status ?? null;

    if (isMissingBackendStatus(responseStatus)) {
      return buildBackendStatusMeta('missing', label, `The latest response for ${code} indicates the expected backend endpoint/implementation is missing.`);
    }
    if (result?.outcome === 'error') {
      return buildBackendStatusMeta('real', label, `This UI is wired to a live backend endpoint, but the latest request for ${code} failed for a non-missing reason.`);
    }
    if (result?.outcome === 'running') {
      return buildBackendStatusMeta('real', label, `This UI is currently waiting on a real backend request for ${code}.`);
    }
    if (result?.outcome === 'success') {
      return buildBackendStatusMeta('real', label, `This UI is backed by a live backend endpoint and has a captured response for ${code}.`);
    }

    return buildBackendStatusMeta('real', label, `This UI is wired to a live backend endpoint for ${code}, even if it has not been called yet.`);
  }

  function getAuthBackendStatusMeta(label, entry = null) {
    const result = getState().authPreflight?.latestResult ?? null;
    const responseStatus = entry?.details?.response?.status ?? result?.status ?? null;

    if (isMissingBackendStatus(responseStatus)) {
      return buildBackendStatusMeta('missing', label, 'The latest auth response indicates the expected auth backend endpoint/implementation is missing.');
    }
    if (result?.outcome === 'error') {
      return buildBackendStatusMeta('real', label, 'This UI is wired to live auth backend endpoints, but the latest provider/auth request failed for a non-missing reason.');
    }
    if (result?.outcome === 'running') {
      return buildBackendStatusMeta('real', label, 'This UI is currently waiting on a live auth backend request.');
    }
    if (result?.outcome === 'success') {
      return buildBackendStatusMeta('real', label, 'This UI is backed by live auth endpoints and has a captured safe auth response.');
    }

    return buildBackendStatusMeta('real', label, 'This UI is wired to live /api/auth/* endpoints; icloudpd outcomes remain provider-dependent and 2FA may still be unsupported.');
  }

  function getDatabaseViewerBackendStatusMeta(code, label, entry = null) {
    const result = getState().databaseViewer?.results?.[code] ?? null;
    const responseStatus = entry?.details?.response?.status ?? result?.status ?? null;

    if (isMissingBackendStatus(responseStatus)) {
      return buildBackendStatusMeta('missing', label, `The latest response for ${code} indicates the expected database viewer backend endpoint is missing.`);
    }
    if (result?.outcome === 'error') {
      return buildBackendStatusMeta('real', label, `This UI is wired to a live database viewer endpoint, but the latest request for ${code} failed for a non-missing reason.`);
    }
    if (result?.outcome === 'running') {
      return buildBackendStatusMeta('real', label, `This UI is currently waiting on a real database viewer backend request for ${code}.`);
    }
    if (result?.outcome === 'success') {
      return buildBackendStatusMeta('real', label, `This UI is backed by a live database viewer backend endpoint and has a captured response for ${code}.`);
    }

    return buildBackendStatusMeta('real', label, `This UI is wired to a live database viewer backend endpoint for ${code}, even if it has not been called yet.`);
  }


  return {
    describeHistoryEntryFromDetails,
    getSectionBackendStatusByCode,
    getInitBackendStatusMeta,
    getAuthBackendStatusMeta,
    getDatabaseViewerBackendStatusMeta,
  };
}
