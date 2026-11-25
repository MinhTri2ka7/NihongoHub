# Folder structure

> NihongoHub adaptation: this guide describes the proposed mobile architecture. No mobile app, package manifest or SDK is installed yet. File paths and component names below are targets, not existing capabilities.

## Target layout

Create only the files and directories needed by a real feature. Do not add empty folders to make the
tree look complete.

```text
mobile/src/
  app/                         Expo Router route files and navigator layouts
  components/
    ui/                        React Native Reusables primitives configured for this app
    common/                    Project-built, domain-neutral shared components
    layout/                    Shared screen and page layout components
  config/
    api-endpoints.ts           API paths and endpoint builders
    env.ts                     Validated public runtime configuration
  lib/
    api/
      client.ts                Shared HTTP client instance
      interceptors.ts          Transport-level request and response handling
      errors.ts                Shared API error normalization
      types.ts                 Transport-level request and response types
  features/
    auth/
      api/
        auth.api.ts            Authentication requests
      hooks/                   Authentication queries and mutations
      types/                   Authentication domain and DTO types
    lessons/
      api/
        lessons.api.ts          Lesson requests
        lessons.keys.ts         Lesson query keys
      hooks/                   Lesson queries and mutations
      types/                   Lesson domain and DTO types
    reviews/
      api/                     Review-owned requests and query keys
      hooks/                   Review queries and mutations
      types/                   Review domain and DTO types
  providers/                   Application-wide React providers
  theme/                       Semantic design tokens and theme configuration
```

The feature subdirectories above illustrate the target ownership boundaries. They are not a request
to create every directory immediately. Keep a small feature flat until real files make an `api`,
`hooks`, or `types` directory useful.

`client.ts` represents the proposed shared HTTP client abstraction, not approval for a specific
package. Using Axios or adding any other transport dependency still requires the dependency approval
process in [DEPENDENCY_MANAGEMENT.md](DEPENDENCY_MANAGEMENT.md).

Localization directories will be added when the localization foundation is approved. Do not invent
a competing location or install a localization package independently.

## Ownership

### `src/app/`

Route files may:

- read and validate route parameters;
- configure Expo Router layouts and navigation options;
- compose a feature screen;
- handle a route-specific loading or not-found boundary when necessary.

Route files must not own large view trees, business rules, API clients, or reusable components.

### `src/components/ui/`

This directory contains primitives sourced from or intentionally aligned with React Native
Reusables, configured with the project's theme and variants. Examples include `Button`, `Input`,
`Dialog`, `Card`, and `Checkbox`.

UI primitives must not know about product domains, fetch data, read domain stores, or perform
business navigation.

### `src/components/common/`

This directory contains custom components built by the project and reused across features. Examples
may include query feedback, paged lists, media status, or generic audio controls.

A component belongs here only when:

- it has at least two real consumers, or it is application-wide UI infrastructure;
- it is domain-neutral;
- it accepts data and behavior through props;
- it does not call a domain API or navigate according to a domain rule.

Do not place a component in `common` because it might be reused in the future. Start it in the
owning feature and promote it when reuse is demonstrated.

### `src/components/layout/`

This directory contains shared composition shells such as `ScreenShell`, keyboard-aware screens,
safe-area layouts, and authenticated layout frames. Layout components must not own domain data.

### `src/features/<domain>/`

Feature directories own domain-aware screens, components, queries, mutations, stores, types, and
pure domain helpers. Examples include `LessonCard`, `DeckEditor`, and `StartLessonButton`.

Keep small features flat. Create subdirectories only when they make ownership easier to understand.

When a feature grows enough to need API-specific organization:

- `api/` owns domain request functions, query keys, DTO mapping, and domain-specific API behavior;
- `hooks/` owns feature-facing query and mutation hooks;
- `types/` owns domain types and DTOs that are shared by multiple files in that feature.

Do not move a type into `types/` only to shorten a file. Keep a type beside its single owner until it
has multiple real consumers.

### `src/config/`

This directory contains validated public runtime configuration and declarative API endpoint
definitions.

- `env.ts` validates and exports public runtime values used by application code;
- `api-endpoints.ts` exports stable API paths or endpoint builders, not request execution or domain
  behavior.

Never expose secrets through mobile runtime configuration. Do not read `.env` directly throughout
the application; application code must consume the validated configuration module.

### `src/lib/api/`

This directory owns domain-neutral HTTP transport infrastructure shared by multiple features.

- `client.ts` configures the shared client, base URL, timeouts, and transport defaults;
- `interceptors.ts` owns cross-cutting transport behavior such as attaching an available session and
  handling transport responses safely;
- `errors.ts` converts provider-specific failures into stable application API errors;
- `types.ts` contains transport-level types that are genuinely shared across domains.

The shared API layer must not know about feature screens, feature stores, query keys, or product
rules. Authentication handling here is limited to transport concerns; login, logout, session UX,
and authorization decisions remain owned by the authentication feature.

## Dependency direction

Allowed:

```text
app imports features, components, providers, theme, and config
features import components, theme, config, and their own feature modules
features may import the domain-neutral API infrastructure from lib/api
lib/api imports config and platform or approved transport libraries
common and layout components import ui primitives and theme
ui primitives import theme and platform libraries
```

Forbidden:

- `components/ui` or `components/common` importing a feature;
- a feature importing a route file from `src/app`;
- shared components directly calling domain APIs;
- `lib/api` importing a feature module;
- one feature importing another feature's private API, hooks, or types;
- production code importing test fixtures;
- one feature reaching into another feature's private store or implementation file.

The intended API dependency direction is:

```text
feature API and hooks import lib/api
lib/api imports config
```

Endpoint constants may be centralized in `config/api-endpoints.ts`, but request execution, query
keys, DTO mapping, and cache behavior stay with the feature that owns the domain.

## Rolling migration strategy

Migrate to the target API structure feature by feature rather than moving the entire application in
one large change. The current and target structures may coexist temporarily while each vertical
slice is completed.

1. Inventory the current shared API modules and every consumer before moving files.
2. Establish `src/config` and `src/lib/api` only when the first migrated feature needs them. Move
   domain-neutral transport behavior first and leave domain behavior in its owning feature.
3. Migrate one complete feature slice at a time. A slice includes its request functions, query keys,
   hooks, shared domain types, consumers, tests, and imports.
4. Prefer updating all consumers in the same slice. Use a temporary compatibility re-export only
   when a consumer cannot move safely in that change, and record the exact removal condition.
5. Do not add new behavior to a legacy API location after its target owner exists. New work follows
   the target structure while unrelated legacy code remains untouched.
6. Run typecheck, lint, and the affected tests after every migrated feature. Fix migration failures
   before starting the next feature.
7. Remove a legacy module or directory only after repository search confirms that it has no runtime,
   test, or tooling consumers.

A practical migration order is:

```text
shared transport seam
lessons feature
authentication feature
reviews feature
remaining domain features
legacy API cleanup
```

The order may change when product dependencies require it, but each step must remain a complete,
reviewable vertical slice. A migration approval for one feature does not approve the next feature or
a broad refactor.

## File placement questions

Before creating a file, answer:

1. Which feature or shared layer owns this behavior?
2. Is an equivalent component already present?
3. Is the component domain-neutral or domain-aware?
4. Does it have real reuse, or only hypothetical reuse?
5. Can the route remain a thin composition file?
