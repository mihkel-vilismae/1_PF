/*
 * Static V2 startup-mode sidebar schema.
 * Numbers are display/order metadata and are intentionally separate from labels.
 */
export type V2OperatorSidebarRoute =
  | 'setup'
  | 'authentication'
  | 'startup'
  | 'workers'
  | 'troubleshooting'
  | 'recovery'
  | 'pir'
  | 'playback'
  | 'real-playback';

export type V2OperatorSidebarItem = {
  order: string;
  label: string;
  route: V2OperatorSidebarRoute;
  subtitle: string;
};

export const V2_OPERATOR_SIDEBAR_ITEMS: readonly V2OperatorSidebarItem[] = [
  { order: '01', label: 'setup.sh', route: 'setup', subtitle: 'preflight only' },
  { order: '02', label: 'authentication.sh', route: 'authentication', subtitle: 'local iCloudPD login' },
  { order: '03', label: 'startup.sh', route: 'startup', subtitle: 'env / DB / crontab' },
  { order: '04', label: 'workers', route: 'workers', subtitle: 'status + controls' },
  { order: '05', label: 'troubleshooting', route: 'troubleshooting', subtitle: 'logs + stale locks' },
  { order: '06', label: 'recovery', route: 'recovery', subtitle: 'recovery' },
  { order: '07', label: 'PIR', route: 'pir', subtitle: 'activity test shell' },
  { order: '08', label: 'PLAYBACK', route: 'playback', subtitle: 'queue/rendering shell' },
  { order: '09', label: 'REAL PLAYBACK', route: 'real-playback', subtitle: 'final endpoint plan' },
] as const;

export function isV2OperatorSidebarRoute(value: string | null | undefined): value is V2OperatorSidebarRoute {
  return V2_OPERATOR_SIDEBAR_ITEMS.some((item) => item.route === value);
}
