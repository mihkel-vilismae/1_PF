/*
 * Defines shared NEW AUTH service types used by the facade and extracted helpers.
 * These contracts preserve the public dashboard/auth shapes while allowing internals
 * to be split by responsibility.
 */
import type { ChildProcessWithoutNullStreams, SpawnOptionsWithoutStdio } from 'node:child_process';

export type NewAuthSessionState = 'logged_out' | 'logging_in' | 'pending_2fa' | 'requires_2fa' | 'authenticated' | 'failed' | 'unverified' | 'unknown';
export type NewAuthPathType = 'file' | 'directory' | 'missing' | 'unknown';

export interface NewAuthEnvValues {
  [key: string]: string | undefined;
}

export interface NewAuthContext {
  envValues?: NewAuthEnvValues;
  platform?: NodeJS.Platform;
  username?: string | null;
  executablePath?: string | null;
  commandSpawner?: NewAuthCommandSpawner;
}

export interface NewAuthStatusOptions {
  providerProof?: boolean;
}

export interface NewAuthPathMetadata {
  label: string;
  path: string;
  exists: boolean;
  type: NewAuthPathType;
  sizeBytes?: number;
  lastModified?: string;
  contentsShown: false;
  children?: NewAuthPathMetadata[];
}

export interface NewAuthTwoFactorInput {
  code?: unknown;
}

export interface NewAuthIcloudpdConfig {
  username: string | null;
  password: string | null;
  cookieDir: string | null;
  downloadDir: string | null;
  domain: string | null;
  timeoutMs: number;
}

export interface CommandResult {
  ok: boolean;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  errorCode?: string;
  errorMessage?: string;
}

export type NewAuthCommandSpawner = (command: string, args: string[], options: SpawnOptionsWithoutStdio) => ChildProcessWithoutNullStreams;

export interface NewAuthSessionEvidence {
  hasSessionFiles: boolean;
  sessionFileCount: number;
  latestModifiedMs: number | null;
  latestModifiedAt: string | null;
}

export interface NewAuthProviderSessionProof {
  attempted: boolean;
  verified: boolean;
  reasonCode: string;
  message: string;
  command?: string;
  exitCode?: number | null;
  signal?: NodeJS.Signals | null;
  providerOutputPreview?: string;
  providerOutputShown: NewAuthProviderOutputShown;
  secretValuesShown: false;
  requires2fa?: boolean;
  canEnterSixDigitCode?: boolean;
  canEnterDeviceIndex?: boolean;
  availableDeviceIndexes?: string[];
  userPrompts?: string[];
}

export type NewAuthTwoFactorPromptKind = 'device_index' | 'verification_code' | 'device_index_or_code' | 'apple_hsa2_challenge' | 'unknown';

export interface NewAuthTwoFactorPromptInfo {
  kind: NewAuthTwoFactorPromptKind;
  requestedInput: string;
  nextAction: string;
  message: string;
}

export interface NewAuthInteractiveAttempt {
  child: ChildProcessWithoutNullStreams;
  config: NewAuthIcloudpdConfig;
  beforeSessionEvidence: NewAuthSessionEvidence;
  createdAt: number;
  expiresAt: number;
  stdout: string;
  stderr: string;
  consumedOutputLength: number;
  closed: boolean;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  pendingWaiter: boolean;
}

export type NewAuthProviderOutputShown = 'sanitized_preview' | 'classification_only' | 'none';

export interface NewAuthStructuredEvent {
  area: 'new-auth';
  operation: string;
  phase: string;
  stateBefore?: NewAuthSessionState | string;
  stateAfter?: NewAuthSessionState | string;
  promptKind?: NewAuthTwoFactorPromptKind | 'none';
  responseType?: 'device_index' | 'verification_code' | 'unknown' | 'none';
  endpoint?: string;
  durationMs?: number;
  exitCode?: number | null;
  signal?: NodeJS.Signals | null;
  secretValuesShown: false;
  providerOutputShown: NewAuthProviderOutputShown;
  message: string;
}
