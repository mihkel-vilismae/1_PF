/*
 * Shared constants for NEW AUTH runtime-truth actions.
 * Keeping them separate preserves button keys while making action modules smaller.
 */

export const NEW_AUTH_CARD_KEY = '1A-STASH-OFF';
export const NEW_AUTH_HISTORY_SOURCE = 'NEW AUTH';
export const SECRET_FIELD_PATTERN = /(password|passwd|secret|token|cookie|session|credential|authorization|otp|2fa|two_factor_value|mfa|^code$|apple_id)/i;
export const NEW_AUTH_BUTTON_DEFAULTS = Object.freeze({
  'new-auth-verify-icloudpd': 'Not checked yet.',
  'new-auth-login-using-env': 'Not checked yet.',
  'new-auth-check-login': 'Not checked yet.',
  'new-auth-logout-session': 'Not checked yet.',
  'new-auth-session-files': 'Not checked yet.',
});
export const NEW_AUTH_SESSION_BUTTON_KEYS = Object.freeze(['new-auth-login-using-env', 'new-auth-check-login']);
