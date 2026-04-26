# Documentation Inventory Skill

Created: 2026-04-26 17:14:20 EEST

## Purpose
Create a surface-level inventory of repository documentation without changing the repository.

## Inputs
- A repository folder or ZIP archive.

## Scope
Include `.md`, `.txt`, `.rst`, and `.adoc`. Exclude `.git/` and dependency folders.

## Procedure
1. Extract the repository ZIP to a temporary folder.
2. Walk the repository tree.
3. Find documentation-like files.
4. Classify each file by location group.
5. Capture file path, size, first headings, and a very short inferred purpose.
6. Produce a Markdown inventory report.

## Non-goals
Do not judge correctness, merge docs, delete docs, or update repository files. This is inventory-only.
