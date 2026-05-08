/*
 * Classifies and clears persisted runtime pipeline locks.
 * The helpers operate only on runtime-truth JSON fields owned by the dashboard.
 * They do not inspect live worker processes or database runtime state.
 */
export type RuntimeTruthLike = Record<string, unknown>;

export type RuntimePipelineIssue = {
  kind: 'stale_pipeline_lock';
  lockOwner: string;
  lockAcquiredAt: string | null;
  lockAgeSeconds: number | null;
  staleReason: 'missing_acquired_at' | 'invalid_acquired_at' | 'age_exceeded';
  staleThresholdSeconds: number;
  message: string;
};

export type RuntimePipelineIssueOptions = {
  now?: Date;
  staleThresholdSeconds?: number;
};

export type RuntimePipelineClearResult = {
  truth: RuntimeTruthLike;
  issues: RuntimePipelineIssue[];
  cleared: boolean;
};

export const DEFAULT_PIPELINE_LOCK_STALE_SECONDS = 15 * 60;

// Resolves the pipeline stale-lock threshold from env-like values.
export function resolvePipelineLockStaleThresholdSeconds(
  envValues: Record<string, unknown> = {},
  fallbackSeconds = DEFAULT_PIPELINE_LOCK_STALE_SECONDS,
): number {
  const candidate = Number(envValues.LOCK_TIMEOUT_SECONDS);
  return Number.isFinite(candidate) && candidate > 0 ? Math.floor(candidate) : fallbackSeconds;
}

// Detects stale persisted pipeline locks without mutating runtime truth.
export function detectStalePipelineLockIssues(
  truth: RuntimeTruthLike,
  options: RuntimePipelineIssueOptions = {},
): RuntimePipelineIssue[] {
  const lockOwner = readNonEmptyString(truth.pipelineActiveKey);
  if (!lockOwner) {
    return [];
  }

  const staleThresholdSeconds = options.staleThresholdSeconds ?? DEFAULT_PIPELINE_LOCK_STALE_SECONDS;
  const lockAcquiredAt = readNonEmptyString(truth.pipelineLockAcquiredAt);
  if (!lockAcquiredAt) {
    return [buildStalePipelineLockIssue({
      lockOwner,
      lockAcquiredAt: null,
      lockAgeSeconds: null,
      staleReason: 'missing_acquired_at',
      staleThresholdSeconds,
    })];
  }

  const acquiredMs = Date.parse(lockAcquiredAt);
  if (!Number.isFinite(acquiredMs)) {
    return [buildStalePipelineLockIssue({
      lockOwner,
      lockAcquiredAt,
      lockAgeSeconds: null,
      staleReason: 'invalid_acquired_at',
      staleThresholdSeconds,
    })];
  }

  const nowMs = (options.now ?? new Date()).getTime();
  const lockAgeSeconds = Math.max(0, Math.floor((nowMs - acquiredMs) / 1000));
  if (lockAgeSeconds <= staleThresholdSeconds) {
    return [];
  }

  return [buildStalePipelineLockIssue({
    lockOwner,
    lockAcquiredAt,
    lockAgeSeconds,
    staleReason: 'age_exceeded',
    staleThresholdSeconds,
  })];
}

// Clears only stale persisted pipeline lock fields and leaves fresh locks intact.
export function clearStalePipelineLocks(
  truth: RuntimeTruthLike,
  options: RuntimePipelineIssueOptions = {},
): RuntimePipelineClearResult {
  const issues = detectStalePipelineLockIssues(truth, options);
  if (!issues.length) {
    return {
      truth,
      issues,
      cleared: false,
    };
  }

  const lockOwner = issues[0]?.lockOwner ?? 'unknown action';
  return {
    truth: {
      ...truth,
      pipelineActiveKey: null,
      pipelineLockAcquiredAt: null,
      stageLock: `Cleared stale pipeline lock held by ${lockOwner}`,
    },
    issues,
    cleared: true,
  };
}

// Builds the single issue shape used by frontend logs and backend responses.
function buildStalePipelineLockIssue({
  lockOwner,
  lockAcquiredAt,
  lockAgeSeconds,
  staleReason,
  staleThresholdSeconds,
}: Omit<RuntimePipelineIssue, 'kind' | 'message'>): RuntimePipelineIssue {
  const reasonCopy = staleReason === 'missing_acquired_at'
    ? 'it has no acquisition timestamp'
    : staleReason === 'invalid_acquired_at'
      ? 'its acquisition timestamp is invalid'
      : `it is ${lockAgeSeconds} second(s) old`;
  return {
    kind: 'stale_pipeline_lock',
    lockOwner,
    lockAcquiredAt,
    lockAgeSeconds,
    staleReason,
    staleThresholdSeconds,
    message: `Pipeline lock held by ${lockOwner} is stale because ${reasonCopy}.`,
  };
}

// Reads a non-empty string field from loosely shaped runtime-truth JSON.
function readNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
