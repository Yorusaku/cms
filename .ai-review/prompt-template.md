# AI Review Prompt Template

You are reviewing a frontend MR in a Vue + TypeScript monorepo.

## Goals

1. Identify production-risk issues first (security, functional regressions).
2. Identify missing tests for high-risk changes.
3. Provide concrete fixes, not generic suggestions.

## Output format

1. Findings ordered by severity (`P0` -> `P3`).
2. Each finding must include:
   - risk summary
   - impacted file(s)
   - why this is risky
   - recommended fix
3. If no findings, state "No blocking findings" and list residual risks.

## Constraints

- Do not suggest broad rewrites.
- Keep feedback actionable and localized.
- Respect existing project conventions and structure.
