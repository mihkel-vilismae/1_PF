import { evaluateRealIcloudDownloadReport } from './real-icloud-download-report-lib.mjs';
export function classifyRealDownloadError(sectionStatuses) {
  if (sectionStatuses.auth !== 'PASSED') return 'AUTH_SESSION_MISSING_OR_INVALID';
  if (sectionStatuses.filter !== 'PASSED') return 'FILTER_CONFIG_MISSING_OR_INVALID';
  if (sectionStatuses.download_dir !== 'PASSED') return 'DOWNLOAD_DIR_MISSING_OR_INVALID';
  if (sectionStatuses.batch1 !== 'PASSED' || sectionStatuses.batch2 !== 'PASSED') return 'MANIFEST_MISSING_OR_INVALID';
  if (sectionStatuses.no_loop !== 'PASSED') return 'DUPLICATE_OR_NO_LOOP_FAILURE';
  if (sectionStatuses.redaction !== 'PASSED') return 'SECRET_SAFETY_FAILURE';
  return 'NONE';
}
export function evaluateRealDownloadErrorClassification(env = process.env, opts = {}) {
  const report = evaluateRealIcloudDownloadReport(env, opts);
  return { proofStatus: 'PASSED', report_status: report.proofStatus, classification: classifyRealDownloadError(report.sections), known_classes: ['AUTH_SESSION_MISSING_OR_INVALID','FILTER_CONFIG_MISSING_OR_INVALID','DOWNLOAD_DIR_MISSING_OR_INVALID','MANIFEST_MISSING_OR_INVALID','DUPLICATE_OR_NO_LOOP_FAILURE','SECRET_SAFETY_FAILURE','NONE'], block_reasons: [] };
}
