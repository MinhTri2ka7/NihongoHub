# AI change workflow

> NihongoHub adaptation: this guide describes the proposed mobile architecture. No mobile app, package manifest or SDK is installed yet. File paths and component names below are targets, not existing capabilities.

## Before editing

1. Read repository instructions, `mobile/AGENTS.md`, and this folder's router.
2. Read the task-specific guide and inspect the owning route, feature, and shared components.
3. Check the working tree and preserve unrelated user changes.
4. Search `components/ui`, `components/common`, and the owning feature before creating UI.
5. Identify whether the change introduces user-facing text or a dependency mutation.
6. Identify the active design, structure, ADR, and playbook documents affected by the change.
7. State assumptions that materially affect behavior, platform support, or migration scope.

Do not read real `.env` files without explicit authorization. Never print secrets, credentials, tokens, signed URLs, or private user data.

## For a screen or component

1. Assign ownership to a route, feature, `ui`, `common`, or `layout` layer.
2. Reuse an existing component or variant when it satisfies the contract.
3. Check React Native Reusables before designing a new primitive.
4. Keep the route thin and the screen readable.
5. Extract substantial subcomponents into focused files.
6. Define asynchronous, empty, error, permission, and disabled states.
7. Use localization keys for new copy after the localization foundation exists.
8. Verify accessibility, touch targets, safe area, keyboard, and back behavior as applicable.

## Dependency checkpoint

Stop before changing `package.json`, a lockfile, native configuration, or a package-backed
foundation. Present the proposal required by `DEPENDENCY_MANAGEMENT.md` and wait for explicit
approval.

This checkpoint applies to React Native Reusables setup, NativeWind/Tailwind, localization, test
runners, analytics, maps, authentication, and all other package changes.

## During implementation

- Keep changes inside the owning feature and established shared seams.
- Do not refactor unrelated legacy styling as part of a focused change.
- Do not add another component with the same responsibility as an existing component.
- Do not move domain behavior into `common` merely to shorten imports.
- Do not add hardcoded user-facing copy after localization is established.
- Do not silently change authentication, privacy, permissions, or persistence behavior.
- Update the affected maintained docs and playbooks when architecture, shared UI contracts,
  coding patterns, integrations, or required checks change.
- Remove temporary instrumentation and throwaway artifacts before completion.

## Before completion

1. Review the diff for scope drift, duplicate components, hardcoded copy, and secret exposure.
2. Confirm all new files are in the correct ownership layer.
3. Confirm maintained docs describe the final as-built approach and archive superseded guidance.
4. Confirm new AI-generated Markdown filenames follow the repository uppercase naming rule.
5. Run fresh checks appropriate to the change.
6. Read the complete output and count failures.
7. Separate new failures from existing baseline failures with evidence.
8. Report files changed, behavior or rules changed, verification performed, and remaining risks.

Do not claim success based on code inspection, an earlier run, or a partial check when a required
verification step is still failing.
