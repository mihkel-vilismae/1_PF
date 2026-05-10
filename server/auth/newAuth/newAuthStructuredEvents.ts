/*
 * Builds sanitized NEW AUTH structured event metadata for dashboard history.
 * Events intentionally report only classifications and redacted previews, never
 * provider secrets or raw 2FA responses.
 */
import type { NewAuthProviderOutputShown, NewAuthStructuredEvent, NewAuthTwoFactorPromptKind } from './newAuthTypes.js';

/*
 * Appends structured NEW AUTH events to response details without mutation.
 */
export function appendStructuredEvents(payload: Record<string, unknown>, events: NewAuthStructuredEvent[]): Record<string, unknown> {
  const details = payload.details && typeof payload.details === 'object' ? payload.details as Record<string, unknown> : {};
  const existingEvents = Array.isArray(details.events) ? details.events as unknown[] : [];
  return {
    ...payload,
    details: {
      ...details,
      secretValuesShown: false,
      providerOutputShown: providerOutputShownForPayload(payload),
      events: [...existingEvents, ...events],
    },
  };
}

/*
 * Creates a NEW AUTH structured event with secret-safety fields enforced.
 */
export function buildStructuredEvent(input: Omit<NewAuthStructuredEvent, 'area' | 'secretValuesShown'>): NewAuthStructuredEvent {
  return {
    area: 'new-auth',
    secretValuesShown: false,
    ...input,
  };
}

/*
 * Reads the prompt kind classification from a response payload.
 */
export function readPromptKindFromPayload(payload: Record<string, unknown>): NewAuthTwoFactorPromptKind | 'none' {
  const details = payload.details && typeof payload.details === 'object' ? payload.details as Record<string, unknown> : null;
  return typeof details?.twoFactorPromptKind === 'string' ? details.twoFactorPromptKind as NewAuthTwoFactorPromptKind : 'none';
}

/*
 * Classifies a user 2FA response without exposing the raw response.
 */
export function classifyResponseType(value: string): 'device_index' | 'verification_code' | 'unknown' {
  if (/^[a-z]$/i.test(value.trim())) {
    return 'device_index';
  }
  if (/^\d{4,8}$/.test(value.trim())) {
    return 'verification_code';
  }
  return 'unknown';
}

/*
 * Maps a response classification to the expected provider prompt kind.
 */
export function promptKindForResponseType(responseType: 'device_index' | 'verification_code' | 'unknown'): NewAuthTwoFactorPromptKind {
  if (responseType === 'device_index') return 'device_index';
  if (responseType === 'verification_code') return 'verification_code';
  return 'unknown';
}

/*
 * Reads sanitized provider-output visibility from a response payload.
 */
export function providerOutputShownForPayload(payload: Record<string, unknown>): NewAuthProviderOutputShown {
  const details = payload.details && typeof payload.details === 'object' ? payload.details as Record<string, unknown> : {};
  const preview = details.providerOutputPreview;
  if (typeof preview === 'string' && preview.length > 0) return 'sanitized_preview';
  if (payload.state === 'pending_2fa' || details.twoFactorPromptKind) return 'classification_only';
  return 'none';
}
