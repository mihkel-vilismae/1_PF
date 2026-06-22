---
name: project-skill-reconciliation
description: Analyze PF_login project chats, audits, and recurring workflows with ACR to create, update, reject, or defer repo-local skills without duplication. Use when the user says ACR analyze chats, create/update suitable skills, improve workflow skills, reconcile skill memory, or extract reusable project lessons.
---

# Project Skill Reconciliation

## Read First

Read:

- `AGENTS.md`;
- `docs/10_runbooks/improve_create_skills_flow_prompt.md`;
- the complete `SKILL.md` for `skill-creator`;
- relevant existing repo-local skills under `.codex/skills/`.

When claims depend on current product behavior, inspect current code/tests/proof artifacts rather than treating chat text as verified truth.

## ACR Workflow

### Analyze

1. Extract recurring tasks, failure modes, decision rules, safety boundaries, and proof interpretation problems from the supplied chat and relevant recent project records.
2. Search existing repo-local and available global skills for overlap.
3. Classify each candidate as project-specific, global, artifact-specific, or one-time.
4. Identify concrete trigger phrases and example tasks.

### Criticise

For each candidate, test:

- Is it recurring and reusable?
- Does an existing skill or runbook already cover it?
- Can an existing skill be extended with a narrow handoff instead?
- Does it preserve the active baseline, architecture, real/mock boundary, proof honesty, and secret safety?
- Does it hard-code a current example that should instead be discovered from code?
- Would it create a parallel workflow or encourage unapproved side effects?

Classify as `ACCEPT`, `UPGRADE`, `DEFER`, or `REJECT`.

### Refine

1. Keep accepted skills narrowly scoped and non-overlapping.
2. Put all trigger conditions in frontmatter descriptions.
3. Use imperative instructions and progressive disclosure.
4. Prefer references to current authority files over copied volatile mappings.
5. Add explicit safety constraints and non-claims.
6. Initialize new skills with `skill-creator` tooling.
7. Update existing skills with the smallest reviewable diff.
8. Generate or refresh `agents/openai.yaml`.
9. Validate every changed skill with `quick_validate.py`.

## Change Rules

- Do not modify product code during a skill-only task.
- Do not update version or changelog unless the user explicitly scopes a release/commit.
- Preserve unrelated dirty-tree changes.
- Do not store secrets or raw private runtime evidence.
- Do not claim a skill was updated until the files exist and validate.

## Output

Report:

- recurring patterns found;
- accepted, upgraded, deferred, and rejected candidates;
- overlap decisions;
- exact skill files changed;
- validation commands/results;
- `Skills / rules to apply` with each selected skill and why;
- a reusable-rule recommendation only when a further lesson remains outside the implemented skills.
