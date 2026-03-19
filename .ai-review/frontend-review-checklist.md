# Frontend Review Checklist

## Functional correctness

- Does this change introduce behavior regression?
- Are edge cases and empty/error states handled?
- Is backward compatibility preserved for existing consumers?

## Type and state safety

- Are TypeScript types precise enough for inputs/outputs?
- Is shared state (Pinia/store/composables) updated safely?
- Are nullable and async states handled defensively?

## Security and risk

- Any unsafe dynamic execution (`eval`, `new Function`)?
- Any sensitive data hardcoded in source or logs?
- Any unsafe DOM writes or untrusted HTML rendering?

## Performance and UX

- Any unnecessary re-renders or expensive computations?
- Any large bundle impact that should be split/lazy-loaded?
- Any blocking network calls on critical paths?

## Test and verification

- Are critical paths covered by unit/integration tests?
- Should this change include a regression test?
- Is the verification evidence clear in MR description?
