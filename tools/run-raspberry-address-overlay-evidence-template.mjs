#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { buildAddressOverlayEvidenceTemplate } from './raspberry-address-overlay-device-display-lib.mjs';

const outputPath = join(process.cwd(), 'runtime_data', 'operator_evidence', 'address_overlay_evidence_template.json');
await mkdir(join(outputPath, '..'), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(buildAddressOverlayEvidenceTemplate(), null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ status: 'TEMPLATE_WRITTEN', outputPath, env: `PF_RASPBERRY_ADDRESS_OVERLAY_EVIDENCE_FILE=${outputPath}` }, null, 2));
