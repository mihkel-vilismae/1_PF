# Versioning and Changelog Rules

## Purpose

This document defines how the project and its documentation evolve.

## Versioning Model

Use semantic versioning with the form `MAJOR.MINOR.PATCH`.

### Guidance

- increment **MAJOR** for breaking architectural or contract changes
- increment **MINOR** for backward-compatible feature or documentation expansion
- increment **PATCH** for small clarifications or fixes without contract expansion

## Documentation-First Rule

If planned backend behavior changes the system contract, documentation must be updated first or in the same change set. Backend code may not silently outrun the documented architecture.

## Changelog Requirements

`CHANGELOG.md` must include:
- version
- timestamp
- category of change
- concise summary of impact

Recommended categories:
- Added
- Changed
- Fixed
- Deprecated
- Removed
- Documentation

## Git History Rule

- one logical change per commit
- no squashing of unrelated changes
- commit messages should describe intent
- repository history must preserve the documentation baseline and later refinements

## Release Note Rule

A documentation audit that materially strengthens concurrency, recovery, or state ownership counts as a versioned change and must be recorded.

## Evidence Basis

Derived from the user's requirement for versioning, changelog discipline, and using documentation as a control artifact before backend implementation.
