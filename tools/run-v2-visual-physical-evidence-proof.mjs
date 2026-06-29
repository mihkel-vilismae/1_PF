#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { check, emitProof, parseArgs, proofResult, readJson } from './v2-final-proof-utils.mjs';

const args = parseArgs();
const repoRoot = process.cwd();
const evidenceDir = path.resolve(repoRoot, process.env.PF_V2_VISUAL_EVIDENCE_DIR || path.join('runtime_data', 'operator_visual_evidence'));
const acceptedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webm', '.mp4', '.mov', '.mkv', '.txt', '.md', '.json']);
const mediaExtensions = new Set(['.jpg', '.jpeg', '.png', '.webm', '.mp4', '.mov', '.mkv']);
const confirmationFilename = 'operator_visual_confirmation.json';
const instructionFilename = 'VISUAL_PHYSICAL_PROOF_INSTRUCTIONS.md';
const placeholderFilename = 'PUT_PHOTOS_OR_VIDEOS_HERE.txt';
const templateFilename = 'operator_confirmation_template.json';

mkdirSync(evidenceDir, { recursive: true });
writeTemplateFiles(evidenceDir);

const files = listEvidenceFiles(evidenceDir);
const mediaFiles = files.filter((file) => mediaExtensions.has(file.extension));
const acceptedFiles = files.filter((file) => acceptedExtensions.has(file.extension));
const unsupportedFiles = files.filter((file) => !acceptedExtensions.has(file.extension));
const confirmationPath = path.join(evidenceDir, confirmationFilename);
const confirmation = readConfirmation(confirmationPath);
const largeFiles = acceptedFiles.filter((file) => file.sizeBytes > 250 * 1024 * 1024);

const checks = [];
check(checks, 'visual-evidence-dir-exists', 'Operator visual evidence folder exists.', existsSync(evidenceDir), { evidenceDir });
check(checks, 'instructions-present', 'Visual physical proof instructions are present.', existsSync(path.join(evidenceDir, instructionFilename)), { instructionFilename });
check(checks, 'confirmation-template-present', 'Operator confirmation template is present.', existsSync(path.join(evidenceDir, templateFilename)), { templateFilename });
if (!args.contract) {
  check(checks, 'accepted-evidence-file-present', 'At least one accepted evidence file is present.', acceptedFiles.length > 0, { acceptedFiles });
  check(checks, 'photo-or-video-present', 'At least one photo/video evidence file is present.', mediaFiles.length > 0, { mediaFiles });
  check(checks, 'operator-confirmation-present', 'Operator visual confirmation JSON exists.', existsSync(confirmationPath), { confirmationPath });
  check(checks, 'operator-confirmation-valid-json', 'Operator visual confirmation JSON is valid.', confirmation.valid, { error: confirmation.error ?? null });
  check(checks, 'operator-confirms-media-visible', 'Operator confirmed the screen shows media.', confirmation.data?.screenShowsMedia === true, { value: confirmation.data?.screenShowsMedia ?? null });
  check(checks, 'operator-confirms-overlay-visible', 'Operator confirmed the overlay is visible.', confirmation.data?.overlayVisible === true, { value: confirmation.data?.overlayVisible ?? null });
  check(checks, 'unsupported-files-absent', 'No unsupported evidence file extensions were found.', unsupportedFiles.length === 0, { unsupportedFiles });
  check(checks, 'evidence-size-warning-clear', 'No individual visual evidence file is larger than 250 MB.', largeFiles.length === 0, { largeFiles });
}

const result = proofResult({
  proof: 'v2_visual_physical_evidence',
  checks,
  evidenceMode: !args.contract,
  note: 'Operator visual proof that physical screen media/overlay evidence was provided. Backend autonomous proof can pass separately; this proof specifically validates photo/video plus operator confirmation evidence.',
});
result.evidence = {
  evidenceDir,
  acceptedExtensions: [...acceptedExtensions].sort(),
  mediaExtensions: [...mediaExtensions].sort(),
  acceptedFiles,
  mediaFiles,
  unsupportedFiles,
  confirmation: confirmation.valid ? confirmation.data : null,
  instructionFile: path.join(evidenceDir, instructionFilename),
};

emitProof(result, { write: args.write || args.evidence });

function writeTemplateFiles(dir) {
  writeFileSync(path.join(dir, instructionFilename), visualInstructions(), 'utf8');
  if (!existsSync(path.join(dir, placeholderFilename))) {
    writeFileSync(path.join(dir, placeholderFilename), 'Put photo/video evidence of the real screen here before running proof:v2-visual-physical-evidence.\n', 'utf8');
  }
  if (!existsSync(path.join(dir, templateFilename))) {
    writeFileSync(path.join(dir, templateFilename), `${JSON.stringify({
      operator: 'Mihkel',
      confirmedAt: new Date().toISOString(),
      screenShowsMedia: false,
      overlayVisible: false,
      mediaAdvances: false,
      screenOnOffObserved: false,
      notes: 'Copy this file to operator_visual_confirmation.json and change booleans after adding photo/video evidence.',
    }, null, 2)}\n`, 'utf8');
  }
}

function visualInstructions() {
  return `# V2 Visual Physical Proof Instructions\n\nBackend logs cannot visually prove the Raspberry/display screen. Add operator evidence here before claiming physical visual proof.\n\nRequired:\n\n1. Add at least one photo or video of the real screen showing media.\n2. The overlay must be visible on top of the media.\n3. Copy \`operator_confirmation_template.json\` to \`operator_visual_confirmation.json\`.\n4. Set \`screenShowsMedia\` and \`overlayVisible\` to \`true\` only after checking the screen.\n\nOptional but recommended:\n\n- Add a short video showing media advances.\n- Add evidence for screen on/off behavior.\n- Add notes in a .txt or .md file.\n\nAccepted media extensions: .jpg, .jpeg, .png, .webm, .mp4, .mov, .mkv.\n`;
}

function listEvidenceFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => ![instructionFilename, placeholderFilename, templateFilename].includes(entry.name))
    .map((entry) => {
      const filePath = path.join(dir, entry.name);
      const stats = statSync(filePath);
      return {
        name: entry.name,
        path: filePath,
        extension: path.extname(entry.name).toLowerCase(),
        sizeBytes: stats.size,
        modifiedAt: stats.mtime.toISOString(),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function readConfirmation(filePath) {
  if (!existsSync(filePath)) return { valid: false, error: 'confirmation file missing' };
  try {
    return { valid: true, data: readJson(filePath) };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) };
  }
}
