# Skill: Analyzing Repo File/Folder Structure

## Purpose

Analyze a repository ZIP or checkout at the file/folder level without changing the repository.

## Inputs

- Repository ZIP or repository folder
- Optional workflow name
- Optional project-specific expected structure rules

## Exclusions

Exclude:
- `.git/`
- `node_modules/`
- virtual environments
- cache folders
- build output folders

## Outputs

Generate a Markdown report containing:
1. repo-level file, LOC, and size counts
2. top-level folder table
3. extension/type LOC table
4. directory/subtree LOC table
5. largest files by LOC
6. unusual file/folder structure findings
7. usual placement comparison
8. regression-risk hotspots
9. recommended next analysis steps
10. optional full file inventory

## Rules

- Do not modify repository files.
- Do not claim behavior from code unless the report inspected behavior directly.
- Treat findings as surface-level structural signals, not final architectural verdicts.
- Highlight risks and unusual placements, but do not prescribe destructive moves.
- If the repo has custom project defaults, compare observed structure against those defaults separately from generic framework conventions.
