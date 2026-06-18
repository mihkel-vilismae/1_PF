/*
 * View A preload/refresh plan. Keeps Test/Real mode behavior explicit so
 * entering View A cannot silently trigger provider login in Test Mode.
 */

export type ViewARefreshMode = 'test' | 'real' | null;

export type ViewARefreshPlan = {
  mode: ViewARefreshMode;
  actions: string[];
  safeRefreshOnly: true;
  productionMutation: false;
  nonClaim: string;
};

const BASE_ACTIONS = ['verify-env', 'check-db', 'check-cron'] as const;
const REAL_ONLY_ACTIONS = ['new-auth-check-login'] as const;

export function buildViewARefreshPlan(mode: ViewARefreshMode): ViewARefreshPlan {
  return {
    mode,
    actions: mode === 'real' ? [...BASE_ACTIONS, ...REAL_ONLY_ACTIONS] : [...BASE_ACTIONS],
    safeRefreshOnly: true,
    productionMutation: false,
    nonClaim: mode === 'real'
      ? 'Real Mode may refresh provider session status, but this plan does not perform login or prove provider success.'
      : 'Test Mode refresh excludes NEW AUTH/provider login actions and does not mutate production state.',
  };
}

export function assertViewAPlanKeepsModeBoundary(plan: ViewARefreshPlan): boolean {
  return plan.mode === 'real'
    ? plan.actions.includes('new-auth-check-login') && plan.productionMutation === false
    : !plan.actions.includes('new-auth-check-login') && plan.productionMutation === false;
}
