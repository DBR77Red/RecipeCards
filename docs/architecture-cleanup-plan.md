# Architecture Cleanup Plan

Date: 2026-05-01
Branch: `architecture-cleanup-navigation-docs`

## Purpose

This cleanup is meant to bring the codebase back into alignment before more visual or product work lands. The immediate goal is not a broad redesign. It is to remove architectural drift, make TypeScript useful again, and clarify which parts of the project are current.

## Current State

The app is a local-first Expo React Native application with Supabase publishing, QR/deep-link receiving, a small Node voice parsing server, and a Supabase Edge Function for share redirects.

Jest currently passes, but `tsc --noEmit` does not. The failing typecheck is a signal that route definitions, registered screens, and screen props have drifted apart.

## Confirmed Cleanup Targets

### 1. Navigation Contract Drift

`RootStackParamList` does not match the screens registered in `App.tsx`.

Symptoms:
- `Home`, `Favorites`, and `Settings` are registered as stack screens but are not declared in `RootStackParamList`.
- `_tabs` is declared and used by several reset/replace calls, but no `_tabs` screen is registered.
- `ProfileScreen` is typed as a root screen, but `Profile` is not registered.
- `TabStackParamList` exists even though the app currently uses a custom bottom bar rather than a nested tab navigator.

Cleanup direction:
- Make the current custom-bottom-bar architecture explicit.
- Add real root route types for `Home`, `Favorites`, and `Settings`.
- Remove `_tabs` navigation calls or register a real `_tabs` screen. For now, replacing `_tabs` returns with `Home` is the smaller fix.
- Treat `ProfileScreen` as orphaned unless product direction says otherwise.

### 2. TypeScript Gate Is Broken

`tsc --noEmit` fails on navigation, one missing translation key, the Expo audio patch, and Deno globals from the Supabase function.

Cleanup direction:
- Fix app TypeScript errors first.
- Exclude or separately type-check Supabase Edge Functions with Deno-aware config.
- Add a script such as `typecheck` once it passes.

### 3. Dead or Stale Utilities

Candidates:
- `src/utils/transcribe.ts` calls `/api/transcribe`, but the server currently exposes `/api/voice-to-recipe`.
- `src/utils/parseRecipe.ts` appears superseded by the server-backed voice parsing flow.

Cleanup direction:
- Confirm import usage before deleting.
- Prefer removal over keeping stale utilities that imply unsupported API routes.

### 4. Documentation Drift

The README still describes flippable cards and an older visual language. The visual playbook also appears behind the current product direction.

Cleanup direction:
- Update README after the current card concept is settled.
- Treat `design/playbook.html` as draft/reference until refreshed.
- Avoid implementing against the playbook until the playbook is current.

### 5. Dependency Drift

`npm outdated` shows Expo SDK 55 patch updates are available. `npm ls` also reports extraneous packages:
- `@supabase/ssr`
- `cookie`

Cleanup direction:
- First stabilize TypeScript and navigation.
- Then run Expo-compatible patch updates.
- Remove extraneous packages if no code path depends on them.

### 6. Large Files and Mixed Responsibilities

High-churn files:
- `src/screens/HomeScreen.tsx`
- `src/components/RecipeForm.tsx`
- `src/screens/CardViewScreen.tsx`

Cleanup direction:
- Do not split these until typecheck/navigation are stable.
- Later extract QR scanning, recipe list rows, selection/reorder state, sync toast, and voice controls.

## First Pass Scope

This branch starts with:
- Align root navigation types with registered screens.
- Replace invalid `_tabs` resets/replaces with `Home`.
- Add the missing deck hint translation key or remove the reference.
- Avoid unrelated UI redesign.
- Leave existing untracked planning docs untouched.

## First Pass Progress

Completed on this branch:
- Root navigation types now match the registered stack screens.
- Invalid `_tabs` navigation resets/replaces were changed to `Home`.
- `deckTapHint` was added to the translation contract and all locales.
- The Expo audio compatibility patch now uses an explicit mutable cast.
- App TypeScript excludes Supabase Edge Functions, which need Deno-aware checking separately.
- Confirmed-dead stale utilities were removed:
  - `src/utils/transcribe.ts`
  - `src/utils/parseRecipe.ts`
- Orphaned `src/screens/ProfileScreen.tsx` was removed. Current profile/name behavior lives through onboarding/settings flows.
- `npm run typecheck` was added.

## Follow-Up Scope

After the first pass:
- Update README to match the current app.
- Review and apply compatible dependency patch updates.
- Decide whether `tabProfile` translation keys should remain as future-facing copy or be removed.
- Add a Deno-aware check for `supabase/functions`.
