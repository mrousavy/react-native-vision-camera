# Repository agent guidance

## VisionCamera Harness tests

For any task that modifies or reviews `apps/simple-camera/__tests__/**`:

- Read `apps/simple-camera/__tests__/README.md` completely before acting.
- Read https://www.react-native-harness.dev/llms-full.txt before adding or changing Harness APIs.
- Treat the README's test-authoring, lifecycle, async synchronization, cleanup, capability-gating, and CI rules as requirements.
- Do not assume that Jest or Vitest APIs exist unless Harness documents or exports them.

## Contributions/PRs

- Avoid large PRs, prefer single atomically testable/mergable/revertable changes
