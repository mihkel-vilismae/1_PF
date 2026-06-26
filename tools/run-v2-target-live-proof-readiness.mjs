import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const version = readFileSync('VERSION', 'utf8').trim();
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const scripts = packageJson.scripts || {};

const requiredScriptGroups = [
  {
    id: 'autonomous_playback',
    label: 'Autonomous playback on target Raspberry hardware',
    requiredScripts: [
      'proof:raspberry-cron-preflight',
      'proof:raspberry-regular-stage-worker-product-pipeline',
      'proof:raspberry-native-image-playback',
      'proof:raspberry-native-video-playback',
      'proof:raspberry-address-overlay-device-evidence',
    ],
    requiredEvidence: [
      'scheduler/crontab installed and active on target machine',
      'media progresses Download -> Index -> GPS parser -> Geocode -> Queue',
      'fullscreen image or video playback observed on target display',
      'address overlay observed when address metadata exists',
    ],
  },
  {
    id: 'autonomous_recovery',
    label: 'Abrupt stop/restart recovery on target Raspberry hardware',
    requiredScripts: [
      'proof:raspberry-power-loss-recovery',
      'proof:raspberry-reboot-recovery',
      'proof:raspberry-reboot-evidence',
      'proof:raspberry-recovery',
    ],
    requiredEvidence: [
      'pre-shutdown recovery snapshot captured without secrets',
      'backend restart or reboot is detected',
      'same media/queue context is restored after restart',
      'corrupt or partial downloads are excluded from queue/database ingestion',
    ],
  },
  {
    id: 'pir_hardware',
    label: 'PIR hardware proof on target Raspberry hardware',
    requiredScripts: [
      'proof:raspberry-screen-worker-non-blocking',
    ],
    requiredEvidence: [
      'PIR sensor transition is observed by the activity worker',
      'mouse and keyboard fallback sources still work',
      'inactivity timeout turns screen off or records the safe simulated equivalent',
      'new PIR activity turns screen on or records the safe simulated equivalent',
    ],
  },
];

const groups = requiredScriptGroups.map((group) => {
  const scriptsStatus = group.requiredScripts.map((name) => ({
    name,
    command: scripts[name] || null,
    present: Boolean(scripts[name]),
  }));
  return {
    ...group,
    scriptsStatus,
    scriptsPresent: scriptsStatus.every((item) => item.present),
    livePassed: false,
    status: 'target_run_required',
  };
});

const manifest = {
  checkpointVersion: version,
  generatedAt: new Date().toISOString(),
  status: 'target_proof_pending',
  liveVictoryClaimAllowed: false,
  note: 'This readiness manifest lists the scripts and evidence needed to clear the B12 gate. It does not claim live proof passed.',
  groups,
  blockers: groups.flatMap((group) => [
    `${group.id}: target-machine evidence not attached`,
    ...(group.scriptsPresent ? [] : [`${group.id}: one or more expected proof scripts are missing`]),
  ]),
};

const args = new Set(process.argv.slice(2));
if (args.has('--write')) {
  const outDir = join('proof_artifacts', 'v2_target_live_proof_readiness');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `v2_target_live_proof_readiness_v${version.replaceAll('.', '_')}.json`);
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(outPath);
} else {
  console.log(JSON.stringify(manifest, null, 2));
}
