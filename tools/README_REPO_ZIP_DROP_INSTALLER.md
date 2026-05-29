# Repo ZIP Drop Installer Tool

## What changed in v4

This version fixes a Windows path parsing issue where a repo path ending with `\` could produce:

```text
Exception calling "GetFullPath" with "1" argument(s): "Illegal characters in path."
```

The `.cmd` launcher now removes the trailing slash from its own folder path before passing it to PowerShell.

## Files

- `../UPDATE_LOCAL_REPO_FROM_ZIP.cmd`
- `tools/update-local-repo-from-zip.ps1`
- `tools/README_REPO_ZIP_DROP_INSTALLER.md`

## How to use

1. Copy `UPDATE_LOCAL_REPO_FROM_ZIP.cmd` and the whole `tools/` folder into your local repo folder.
2. Drag the updated repo ZIP from Downloads onto `UPDATE_LOCAL_REPO_FROM_ZIP.cmd`.
3. The terminal opens and shows progress.
4. Type `YES` to confirm.
5. The terminal stays open after success or failure.

## What it does

- Checks that the dropped file is a ZIP.
- Creates a timestamped backup of the current repo folder.
- Extracts the ZIP into a temp folder.
- Detects the repo root inside the ZIP.
- Copies the ZIP contents over the local repo folder.

## Safer default behavior

This version overwrites and adds files, but it does not delete local files that are missing from the ZIP.

That is intentional. It avoids accidental deletion while testing the workflow.

## Ignored folders/files during copy

It skips common heavy/generated folders:

- `node_modules`
- `dist`
- `build`
- `.vite`
- `.next`
- `__pycache__`
- `*.log`

## After running

Suggested commands:

```bat
git status
npm install --verbose
npm test
```
