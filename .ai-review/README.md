# AI Review Baseline

This repository uses AI as a first-pass reviewer, not as a merge approver.

## Scope

- Frontend architecture and module boundaries
- Type safety and runtime safety
- Security-sensitive code patterns
- Error handling and edge cases
- Test coverage gaps

## Non-goals

- AI cannot approve merge requests by itself
- AI feedback does not replace human code review
- AI feedback does not replace CI quality gates

## Workflow

1. Developer opens MR/PR.
2. CI quality and security checks run first.
3. AI review runs on changed files with repository rules.
4. Human reviewer validates AI findings and business correctness.
5. Merge only after manual approval and green gates.

## Review severity policy

- `P0`: Security, data corruption, production outage risks
- `P1`: Functional defects and clear behavior regressions
- `P2`: Maintainability and readability concerns
- `P3`: Suggestions and optional refactors
