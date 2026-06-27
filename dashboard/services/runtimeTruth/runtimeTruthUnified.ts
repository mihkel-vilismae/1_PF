/*
 * Unified worker truth aggregator.
 *
 * This module exposes a function that will read and combine the individual
 * worker truth files written by the regular, playback and screen on/off workers.
 * Each worker writes a simplified log entry when it starts and finishes a stage.
 * The aggregator combines these events into a single time‑ordered list.  It
 * preserves the worker identity, stage, status and timestamp.  Once real
 * path/file definitions are stable the implementation should read from
 * runtime_data paths defined in the `.env` file.  For now the returned
 * array is empty, as V2 test and real mode have not been wired to workers.
 */

export interface UnifiedWorkerEvent {
  /** The worker ID, e.g. 'regular-worker', 'playback-worker', 'on-off-worker' */
  worker: string;
  /** The logical stage or action name, e.g. 'download', 'index', 'screen-off' */
  stage: string;
  /** The status of the event: 'started', 'finished' or 'error' */
  status: 'started' | 'finished' | 'error';
  /** ISO timestamp of when the event occurred */
  timestamp: string;
  /** Optional process or log identifier */
  id?: string;
  /** Additional metadata from the worker entry */
  meta?: Record<string, any>;
}

/**
 * Returns an array of unified worker events for the selected mode.  When test
 * mode and real mode log files are separated, the implementation must pick
 * the correct file set based on the `mode` parameter.  For now this function
 * returns an empty list because the file locations and parsing rules are not
 * defined.  This placeholder allows future slices to import and use this
 * function without failing.
 *
 * @param mode Either 'test' or 'real' to choose the source of truth
 */
export async function getUnifiedWorkerEvents(mode: 'test' | 'real'): Promise<UnifiedWorkerEvent[]> {
  // TODO: In a later slice, read and parse three worker truth files based on mode.
  // Use process.env.TEST_WORKER_TRUTH_DIR and process.env.REAL_WORKER_TRUTH_DIR
  // or similar.  Combine entries into a sorted list by timestamp.
  return [];
}