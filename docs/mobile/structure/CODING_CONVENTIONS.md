# Coding conventions

> NihongoHub adaptation: this guide describes the proposed mobile architecture. No mobile app, package manifest or SDK is installed yet. File paths and component names below are targets, not existing capabilities.

## TypeScript

- Keep TypeScript strict; do not weaken compiler settings for a local change.
- Do not use `any`; narrow `unknown` before reading it.
- Prefer explicit domain names over vague names such as `data`, `item`, `obj`, or `util`.
- Use typed props and stable domain types rather than duplicating anonymous object shapes.
- Add comments for invariants and non-obvious tradeoffs, not line-by-line narration.

## Components and hooks

- Use function components and hooks.
- Keep one primary exported screen or substantial component per file.
- Do not fetch, navigate, or mutate storage from a presentational UI primitive.
- Name hooks with `use` and keep their ownership within the relevant feature.
- Prefer explicit props and composition over large boolean-driven components.
- Use guard clauses to make loading, error, permission, and invalid states easy to read.

## Naming

| Concern | Convention | Example |
| --- | --- | --- |
| Route component | route purpose plus `Route` | `LessonRoute` |
| Feature screen | purpose plus `Screen` | `LessonScreen` |
| Shared primitive | UI noun | `Button` |
| Shared custom component | behavior or presentation noun | `QueryFeedback` |
| Query hook | `use` plus resource or action | `useDecks` |
| Mutation hook | `use` plus verb and resource | `useSaveVocabulary` |
| Boolean | question using `is`, `has`, `can`, or `should` | `isPending` |

Use lowercase kebab-case filenames unless an established framework convention requires otherwise.

## Imports and boundaries

- Use the `@/` alias for imports under `src/`.
- Do not import private implementation files across feature boundaries.
- Avoid barrel files that hide cycles or export an entire feature indiscriminately.
- Keep platform-specific files adjacent using React Native suffixes such as `.ios.tsx`,
  `.android.tsx`, and `.web.tsx` when behavior genuinely differs.

## Error handling

- Show user-safe localized messages at the UI boundary.
- Preserve stable backend error codes for programmatic handling.
- Do not catch an error unless the code can recover, add safe context, or translate it at an owned
  boundary.
- Never expose stack traces, raw provider errors, tokens, SQL, or private data to the UI or logs.
