# Bug: Form Scroll Flickers to Top When Adding a New Row

## Description

When the user is scrolled down into the ingredients or directions section of the RecipeForm and presses Enter on the keyboard to add a new row, the ScrollView briefly snaps to the very top of the form — showing the title field, voice bar, and photo picker — for a few frames, before jumping back down to the new row that just received focus.

The effect is a visible "kick" or flash that causes nausea and disorientation.

**Trigger conditions:**
- User is editing an ingredient or direction row that is not visible near the top of the form
- User presses Enter (or newline for multiline direction rows) on the last row
- A new empty row is appended and focused

**Does NOT happen when:**
- Moving focus between existing rows (not last → last+1)
- Tapping a row directly

---

## Root of the Problem

The RecipeForm's ingredient and direction state lives in `FormScreen` (parent). When `addIngredient()` or `addDirection()` is called:

1. The state update propagates up via `onChange` to `FormScreen.setRecipe()`
2. `FormScreen` re-renders and passes the new `recipe` prop back down to `RecipeForm`
3. `RecipeForm` re-renders — the ScrollView's content grows by one row
4. During this re-render + layout pass, the ScrollView briefly resets its scroll offset to 0
5. After the frame is painted, `useEffect` fires and focuses the new input, which scrolls back down

The flash occurs at step 4 — the ScrollView loses its scroll position during the layout recalculation triggered by the content size change.

---

## Attempted Fixes

### Attempt 1 — `scrollToEnd` in `useEffect` + platform-gate KAV

**Change:** Added `scrollViewRef` and called `scrollViewRef.current?.scrollToEnd({ animated: false })` inside the existing `useEffect` hooks (which watch `recipe.ingredients.length` and `recipe.directions.length`). Also changed `KeyboardAvoidingView behavior="padding"` to `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` to stop Android's KAV from fighting the system keyboard.

**Result:** The platform-gate broke keyboard visibility on Android — the keyboard covered the input fields and the user could not see what they were typing. Reverted the KAV change.

The `scrollToEnd` in `useEffect` did not fix the flicker because `useEffect` runs **after** the frame has already been painted. By the time `scrollToEnd` fires, the flash-to-top has already been visible on screen.

---

### Attempt 2 — `scrollToEnd` in `onContentSizeChange` with `addingRow` flag

**Change:** Added an `addingRow` ref flag. Set it to `true` immediately before any row addition (Enter key path and tap-button path). Added `onContentSizeChange` handler on the ScrollView that calls `scrollToEnd({ animated: false })` when the flag is set, then clears it. Removed the `scrollToEnd` calls from the `useEffect` hooks.

**Rationale:** `onContentSizeChange` fires during the native layout pass, before the frame is committed to screen — earlier in the pipeline than `useEffect`. The goal was to anchor the scroll position before the flash could appear.

**Result:** Bug still present. The flash-to-top still occurs.

---

## Resolution — Sentinel-row pattern

**Status: FIXED**

### Key insight

The flicker was NOT caused by scroll position management, KAV padding, or callback timing. It was caused by **creating a new native view and focusing it in the same event handler**. Android's scroll-to-focused-view logic fires before the new view's layout has settled, computing wrong coordinates and jumping to offset 0.

Evidence: adding a row via the "Add ingredient" button (no focus change) never flickered. Moving focus between existing rows (no row creation) never flickered. Only the combination — Enter on last row creating AND focusing a new row — triggered the bug.

### Fix

Each list now always renders `length + 1` rows. The extra empty row at the end is the **sentinel**. This decouples row creation from focus transfer:

| Action | Before (flicker) | After (no flicker) |
|---|---|---|
| Enter on last row | Create new row + focus it | Focus the sentinel (already exists) |
| Type in sentinel | n/a | Sentinel promoted to real row, new sentinel appears — focus stays put |
| "Add" button | Create new empty row | Focus the sentinel |

Since the sentinel is already in the native view tree when Enter is pressed, focus transfers to a fully laid-out view. Content growth only happens later (on first keystroke in the sentinel), when focus is already stable and no scroll-to-focused-view fires.

### What was removed

- `addIngredient()` / `addDirection()` functions
- `addingRow` ref flag
- `pendingIngFocus` / `pendingDirFocus` refs
- Both `useEffect` hooks for deferred focus
- `onContentSizeChange` scroll handler

### What was added

- Sentinel row rendering: `[...recipe.ingredients, ''].map(...)` with `isSentinel` guard
- Sentinel promotion on first keystroke: `update('ingredients', [...recipe.ingredients, v])`
- Simplified `handleIngredientSubmit` / `handleDirectionSubmit`: one-liner focus to `i + 1`
- "Add" buttons now focus the sentinel instead of creating a row
