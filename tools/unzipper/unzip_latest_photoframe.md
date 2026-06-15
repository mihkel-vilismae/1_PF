# `unzip_latest_photoframe.sh`

Raspberry OS helper for a simple PhotoFrame ZIP drop-folder workflow.

## Purpose

The script is meant to live in `/home/mihkel/Download_chrome` beside exactly one downloaded PhotoFrame/PF repository ZIP. It extracts that ZIP into the local proofing folder, archives the ZIP, and then opens the extracted repository folder.

## Defaults

| Setting | Value |
|---|---|
| ZIP search folder | `/home/mihkel/Download_chrome` |
| Search recursion | None; only direct files in the folder are checked |
| Extract target base | `/home/mihkel/Download_chrome/Photoframe_proofing` |
| ZIP archive folder | `/home/mihkel/Download_chrome/zip_repo_archive` |
| Custom variables location | `/home/mihkel/Download_chrome/Photoframe_proofing/.env` |
| Copied custom variables target | Extracted repository root `.env` |

## Expected ZIP filename

Example:

```text
PF_login--v0.8.85--fedora-parity-version-root-fix-full_git.zip
```

The filename is parsed as:

| Part | Example |
|---|---|
| Project | `PF_login` |
| Version | `v0.8.85` |
| Target folder | `PF_login_v0.8.85` |

If the target folder already exists, the script selects the next integer suffix:

```text
PF_login_v0.8.85
PF_login_v0.8.85_1
PF_login_v0.8.85_2
```

The same suffix is also applied to the archived ZIP name.

## Safety behavior

- Only one `.zip` file may be present directly inside `/home/mihkel/Download_chrome`.
- If more than one `.zip` is found, the script exits with the requested hard-stop message.
- The script rejects unsafe ZIP paths such as absolute paths or `..` traversal.
- If the ZIP has one top-level folder, that folder is stripped so the repository files land directly in the target folder.
- After successful ZIP extraction into the staging repository, the script copies `/home/mihkel/Download_chrome/Photoframe_proofing/.env` into the extracted repository root as `.env`.
- If the custom variables `.env` file is missing or is not a regular file, extraction stops before the final target folder is published and before the ZIP is archived.
- ZIP archiving happens only after successful extraction and custom variables copy.

## Usage

From `/home/mihkel/Download_chrome`:

```bash
chmod +x ./unzip_latest_photoframe.sh
./unzip_latest_photoframe.sh
```

Dry run:

```bash
./unzip_latest_photoframe.sh --dry-run
```

Skip opening terminal and file explorer:

```bash
./unzip_latest_photoframe.sh --no-open
```

## Expected successful output

```text
1 zip found
project: PF_login
version: v0.8.85
suffix: none
target: /home/mihkel/Download_chrome/Photoframe_proofing/PF_login_v0.8.85
archive target: /home/mihkel/Download_chrome/zip_repo_archive/PF_login--v0.8.85--fedora-parity-version-root-fix-full_git.zip
...
custom variables location: /home/mihkel/Download_chrome/Photoframe_proofing/.env
copied custom variables: /home/mihkel/Download_chrome/Photoframe_proofing/.env -> /home/mihkel/Download_chrome/Photoframe_proofing/PF_login_v0.8.85/.env
done: extracted photoframe repo
archived zip: ...
```

## Proof boundary

This script proves only local ZIP selection, extraction, custom variables `.env` copy, archive movement, and folder opening attempts. It does not prove PhotoFrame runtime behavior, cron worker behavior, iCloud download, GPS/geocode, playback, or Raspberry device display output.
