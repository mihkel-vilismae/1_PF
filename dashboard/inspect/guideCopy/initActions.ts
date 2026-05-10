/*
 * Contains one logical group of inspect-mode guide copy.
 * Values are split from the former monolithic guideCopy.json file.
 */
export const INIT_ACTION_TO_CODE = {
  "verify-env": "1A",
  "check-db": "2A",
  "inspect-db": "2A",
  "delete-db": "2A",
  "recreate-db": "2A",
  "select-scheduler-target-windows": "3A",
  "select-scheduler-target-raspberry": "3A",
  "install-cron": "3A",
  "check-cron": "3A",
  "print-cron": "3A"
} as const;
