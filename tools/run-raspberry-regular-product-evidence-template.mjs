#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { buildRegularWorkerProductEvidenceTemplate } from './raspberry-regular-stage-worker-product-pipeline-lib.mjs';

const outputPath = join(process.cwd(), 'runtime_data', 'operator_evidence', 'regular_stage_worker_product_evidence_template.json');
await mkdir(join(outputPath, '..'), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(buildRegularWorkerProductEvidenceTemplate(), null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ status: 'TEMPLATE_WRITTEN', outputPath, env: `PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE=${outputPath}` }, null, 2));
