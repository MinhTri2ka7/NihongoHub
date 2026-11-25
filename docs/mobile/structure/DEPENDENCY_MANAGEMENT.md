# Dependency management

> NihongoHub adaptation: this guide describes the proposed mobile architecture. No mobile app, package manifest or SDK is installed yet. File paths and component names below are targets, not existing capabilities.

## Approval gate

Explicit user approval is required before any of these actions:

- adding a dependency or development dependency;
- upgrading or downgrading a package;
- replacing one library with another;
- removing a package;
- changing package manager, lockfile strategy, native plugin, or SDK version.

Do not treat a task request as implicit approval for an unmentioned package change.

## Required proposal

Before requesting approval, report:

1. Package name and intended version or compatible range.
2. The requirement it solves.
3. Why installed dependencies or platform APIs are insufficient.
4. Expo SDK, React Native, iOS, Android, and web compatibility.
5. Whether it adds native code, a config plugin, permissions, or a development-build requirement.
6. Expected configuration and lockfile changes.
7. Breaking-change, bundle-size, maintenance, licensing, and security risks when relevant.

## Expo dependencies

- Read the installed Expo major version before proposing an Expo or React Native API change.
- Use the matching versioned official Expo documentation.
- Install Expo-compatible packages with `npx expo install <package>` after approval.
- Do not edit generated `ios/` or `android/` projects by hand when Continuous Native Generation is
  in use.
- A dependency with native code requires an appropriate development build; Expo Go support must not
  be assumed.

## UI and localization foundations

React Native Reusables, NativeWind/Tailwind, and localization are proposed architectural
directions, not pre-approved package mutations. Their concrete package set, versions, and migration
scope still require explicit approval before installation.
