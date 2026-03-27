# Bug Report: `receive_count` is Broken End-to-End

**Report ID:** BUG-2026-0327-001
**Date:** 2026-03-27
**Updated:** 2026-03-27 (code audit — added Bugs 4-6, corrected Bug 1 mechanism, full fix plan)
**Severity:** High — Feature non-functional; incorrect data displayed to user
**Component:** Publish flow, PreviewScreen, Supabase sync, `increment_receive_count` RPC, Express server
**Status:** Open
**Reporter:** QA Audit (automated analysis), updated by manual code audit
**Feature status per CLAUDE.md:** IN PROGRESS — Not Yet Working

---

## Table of Contents

1. [Summary](#summary)
2. [Environment](#environment)
3. [Affected Files](#affected-files)
4. [Reproduction Steps](#reproduction-steps)
5. [State Machine: Expected vs Actual](#state-machine-expected-vs-actual)
6. [Root Cause Analysis](#root-cause-analysis)
   - [Bug 1 — Race Condition: `useFocusEffect` Races `syncToCloud`](#bug-1--race-condition-usefocuseffect-races-synctocloud)
   - [Bug 2 — `incrementReceiveCount` RPC Silently Fails](#bug-2--incrementreceivecount-rpc-silently-fails)
   - [Bug 3 — DB Never Holds a Correct Value; Refocus Resets the UI](#bug-3--db-never-holds-a-correct-value-refocus-resets-the-ui)
   - [Bug 4 — Server Increments `receive_count` on Every Page View](#bug-4--server-increments-receive_count-on-every-page-view)
   - [Bug 5 — `syncToCloud` Never Checks Error on `receive_count` Update](#bug-5--synctocloud-never-checks-error-on-receive_count-update)
   - [Bug 6 — Dead `api.ts` Has a Non-Atomic Competing Implementation](#bug-6--dead-apits-has-a-non-atomic-competing-implementation)
7. [Fault Injection Scenarios](#fault-injection-scenarios)
8. [Fix Plan](#fix-plan)
9. [Acceptance Criteria](#acceptance-criteria)

---

## Summary

The `receive_count` field is meant to track how many people hold a copy of a published recipe card: starting at `1` when the creator publishes, incrementing by `1` each time a new recipient saves the card. The feature is broken at every stage of the lifecycle across **six distinct and compounding bugs**:

- **The count never initialises to 1.** A race condition between React state updates and the cloud sync means the `useFocusEffect` DB read fires before `syncToCloud` has had time to set `receive_count = 1`, reading the column's default value of `0` instead. The `?? 1` fallback doesn't catch `0`.
- **The RPC that should increment the count on the recipient side does not work.** It swallows all errors silently, so failures are completely invisible.
- **Every time the creator leaves PreviewScreen and returns, the count resets to 0.** `useFocusEffect` re-fetches from DB on every focus, overwriting any locally-held or Realtime-delivered value.
- **The Express server inflates the count on every web page view.** `GET /card/:id` does a non-atomic read-then-write increment — page refreshes, bots, and concurrent visitors all corrupt the count.
- **The `receive_count` update in `syncToCloud` never checks for errors.** If the `.update()` fails (RLS, network, etc.), the count stays at `0` with no indication.
- **A dead code path in `api.ts` has a non-atomic competing implementation.** Not currently called, but a maintenance hazard.

The combined effect: the count is broken at every stage, and the feature is non-functional end-to-end.

---

## Environment

| Property | Value |
|---|---|
| Platform | React Native 0.83.2 / Expo SDK 55 |
| Language | TypeScript 5.9 |
| Backend | Supabase (PostgreSQL, Realtime, Storage) + Express server (`server/index.js`) |
| Test devices | Two physical Android devices (Phone A = creator, Phone B = recipient) |
| Network condition at time of test | Standard Wi-Fi, no artificial throttling |
| Supabase RPC | `increment_receive_count(recipe_id: string)` |
| DB column | `recipes.receive_count` (integer, default `0`) |

---

## Affected Files

| File | Role | Bugs |
|---|---|---|
| `src/utils/storage.ts` | `syncToCloud` (init count), `incrementReceiveCount` (RPC call), `saveReceivedCard` (triggers increment) | 1, 2, 5 |
| `src/screens/PreviewScreen.tsx` | `useFocusEffect` (DB fetch), Realtime subscription, `doPublish` (publish flow) | 1, 3 |
| `server/index.js` | `GET /card/:id` (web preview — increments count on every visit) | 4 |
| `src/utils/api.ts` | Dead `incrementReceiveCount` (non-atomic read-then-write) | 6 |
| `src/screens/ReceiveScreen.tsx` | Calls `saveReceivedCard` (recipient flow via deep link) | 2 (indirectly) |
| `src/screens/CardViewScreen.tsx` | Also calls `saveReceivedCard` (recipient flow via "Enter code" modal) | 2 (indirectly) |

---

## Reproduction Steps

### Preconditions
- Phone A has the app installed and has completed onboarding
- Phone B has the app installed
- Both phones are connected to the internet

### Steps

1. On Phone A, open the app and tap **New Recipe**
2. Fill in a title, at minimum, and tap **Save & Preview**
3. On PreviewScreen, tap **Publish** and confirm in the modal
4. Observe the `receive_count` display on PreviewScreen immediately after publish

   **Expected:** `1`
   **Actual:** `0` (shown as "None" in the UI)

5. Phone A opens the share sheet or displays the QR code for the card
6. Phone B scans the QR code — this opens a web page (`server/index.js` GET `/card/:id`)

   **Side effect:** The server increments `receive_count` by 1 just for viewing the page (Bug 4)

7. Phone B taps "Open in RecipeCards" → ReceiveScreen loads → taps **Add to Collection** (calls `saveReceivedCard`)
8. Observe `receive_count` on Phone A's PreviewScreen (either via Realtime update or manually)

   **Expected:** `2`
   **Actual:** May briefly flicker to `2` (if a Realtime UPDATE event fires), or may remain `0`

9. On Phone A, navigate to HomeScreen (back navigation or tab)
10. On Phone A, tap the published card to return to PreviewScreen

    **Expected:** `2` (persisted value)
    **Actual:** `0` (reset by `useFocusEffect` DB read)

---

## State Machine: Expected vs Actual

The following table tracks `receive_count` at every meaningful transition. The "DB value" column represents what is actually stored in Supabase. The "UI value" column represents what PreviewScreen displays.

```
Event                                    DB value (expected)   DB value (actual)   UI value (actual)
─────────────────────────────────────────────────────────────────────────────────────────────────────
Card row upserted by syncToCloud         0 (column default)    0                   —
syncToCloud sets receive_count = 1       1                     ? *¹                —
useFocusEffect fires (deps change)       1 (expected)          0 (actual)          0 *²
Realtime subscription active             1                     0                   0
Phone B views web page (GET /card/:id)   1 (no change)         1 *⁶                0
Phone B saves card → RPC called          2                     1 or still 0 *³     0 (or briefly 2 *⁴)
Phone A navigates to Home                2                     ?                   — (screen unmounted)
Phone A returns to Preview (focus)       2                     0 or 1              0 *⁵
```

**Footnotes:**

- *¹ — The `update({ receive_count: 1 })` in `syncToCloud` may succeed (setting DB to `1`), but the `{ error }` return is never checked (Bug 5). If RLS blocks it, the DB stays at `0` silently.
- *² — `useFocusEffect` re-runs when `recipe.status` changes from `'draft'` to `'published'` (deps are `[recipe.id, recipe.status]`). At this instant, `syncToCloud` hasn't finished the round-trip yet. The fetch returns `0`. The `??` (nullish coalescing) operator treats `0` as a defined value, so `0 ?? 1 === 0`. The UI shows "None".
- *³ — The `increment_receive_count` RPC either doesn't exist, has wrong params, or returns an error in the `{ error }` field — which is never checked (Bug 2). The `catch` block only catches network-level exceptions.
- *⁴ — If Supabase emits a Realtime UPDATE event, the subscription handler may fire and show a value briefly before the next `useFocusEffect` DB read overwrites it with `0`.
- *⁵ — `useFocusEffect` always re-fetches from DB on screen focus. Since the DB value is wrong, every refocus resets the UI (Bug 3).
- *⁶ — The Express server increments `receive_count` on every `GET /card/:id` (Bug 4). This inflates the count before the recipient even saves the card. If the user refreshes the page, it increments again.

---

## Root Cause Analysis

### Bug 1 — Race Condition: `useFocusEffect` Races `syncToCloud`

**Classification:** Race condition / temporal ordering defect

**Description:**

> **Correction from original report:** The original report stated the race was between `navigation.replace('Preview')` and `syncToCloud`, implying publish starts from FormScreen. This is wrong. **Publish happens ON PreviewScreen** via `doPublish()` at `PreviewScreen.tsx:134`. The race is between a React state update that triggers `useFocusEffect` to re-run and the async `syncToCloud` call.

The actual publish sequence inside `PreviewScreen.doPublish()`:

```
1. markPublishedLocally(id)     — async, writes local storage
2. setRecipe(local)             — React state update SCHEDULED (status: 'published')
3. syncToCloud(local)           — begins async: upload photo → upsert row → update receive_count
```

Step 2 schedules a state update but React doesn't flush it synchronously. Step 3 starts immediately. But at the first `await` inside `syncToCloud` (photo upload or DB upsert), React gets a chance to flush the state update.

When the state update flushes, `recipe.status` changes from `'draft'` to `'published'`. This changes the `useFocusEffect` deps `[recipe.id, recipe.status]`, causing it to re-run its callback. The callback queries Supabase:

```ts
// PreviewScreen.tsx:65-77
useFocusEffect(
  useCallback(() => {
    if (recipe.status !== 'published' || !recipe.id) return;
    supabase
      .from('recipes')
      .select('receive_count')
      .eq('id', recipe.id)
      .single()
      .then(({ data }) => {
        if (data) setReceiveCount((data.receive_count as number) ?? 1);
      });
  }, [recipe.id, recipe.status])
);
```

At this instant, `syncToCloud` is mid-flight. Two outcomes:

- **If photo exists:** `syncToCloud` is still uploading the photo. The DB row doesn't exist yet. `.single()` returns `{ data: null }`. The `if (data)` guard skips `setReceiveCount` — the UI stays at `null` (hidden) until next focus, then shows `0`.
- **If no photo:** `syncToCloud` has already upserted the row (with `receive_count = 0` — the column default), but hasn't reached the `update({ receive_count: 1 })` yet. The fetch returns `0`. And `0 ?? 1` evaluates to `0`.

**The fallback `?? 1` does not help.** The `??` (nullish coalescing) operator only triggers for `null` or `undefined`. The integer `0` is a defined, non-null value, so `0 ?? 1` evaluates to `0`. The intent was to treat `0` as "uninitialised", but the operator choice is logically wrong. A falsy check (`|| 1`) or an explicit `=== 0` guard is needed.

**Problematic code locations:**

- `syncToCloud` in `src/utils/storage.ts:178-206`: The two-step approach (upsert row without `receive_count`, then read, then conditionally update) creates an observable window where the row exists with `receive_count = 0`.
- `useFocusEffect` in `src/screens/PreviewScreen.tsx:65-77`: Re-runs when deps change with no awareness that `syncToCloud` may not have finished.
- The `?? 1` fallback at `PreviewScreen.tsx:74`: Wrong operator for catching integer `0`.
- `doPublish` in `src/screens/PreviewScreen.tsx:134-156`: Never sets `setReceiveCount(1)` optimistically after publish.

**Timing window:** Approximately 100ms–2000ms depending on network latency. Always reproducible because the state update + re-render happens at the first `await` yield inside `syncToCloud`, which is always before the `receive_count` update.

**Impact:** The creator always sees `0` (or "None") on first view of a freshly published card.

---

### Bug 2 — `incrementReceiveCount` RPC Silently Fails

**Classification:** Fault tolerance gap / silent failure

**Description:**

When a recipient saves a card via `saveReceivedCard` (called from both `ReceiveScreen.tsx:57` and `CardViewScreen.tsx:212`), the code calls:

```ts
// storage.ts:226-230
export async function incrementReceiveCount(id: string): Promise<void> {
  try {
    await supabase.rpc('increment_receive_count', { recipe_id: id });
  } catch { /* non-critical */ }
}
```

There are multiple failure modes, all completely invisible:

**Failure mode A — RPC does not exist or has the wrong signature:**
If `increment_receive_count` is not deployed in Supabase, or its parameter name does not match `recipe_id`, the RPC call returns `{ data: null, error: { ... } }`. This is a **resolved** Promise — the `catch` block is never entered. The `error` field is never inspected.

**Failure mode B — RPC exists but has a logic error:**
If the SQL function body has a bug (wrong column, wrong table), it executes without raising a PostgreSQL exception but doesn't increment. No error is surfaced.

**Failure mode C — Network failure mid-call:**
A network error does throw and would be caught. But the empty `catch` block discards it. No retry, no queue, no notification.

**Failure mode D — Row-level security or permissions:**
If RLS blocks the update, the error is returned in `{ error }` — never checked.

**Problematic code location:**

`incrementReceiveCount` at `src/utils/storage.ts:226-230`: Does not inspect `{ error }`, `catch` block discards all exceptions.

**Callsites:**
- `saveReceivedCard` at `storage.ts:288`: `if (isNew) await incrementReceiveCount(recipe.id);`
- `ReceiveScreen.tsx:57`: `await saveReceivedCard(recipe);`
- `CardViewScreen.tsx:212`: `await saveReceivedCard(standaloneRecipe);`

**Impact:** The recipient side of the count increment never works. Even if Bug 1 were fixed, the count would never advance beyond `1`.

---

### Bug 3 — DB Never Holds a Correct Value; Refocus Resets the UI

**Classification:** Data integrity / monotonicity violation

**Description:**

`useFocusEffect` fires on **every** screen focus, not just the initial mount. Every time PreviewScreen gains focus, it re-fetches `receive_count` from the DB and calls `setReceiveCount()` with whatever the DB returns.

Because the DB value is stuck at `0` (due to Bugs 1, 2, and 5), every refocus resets the UI:

1. Creator navigates away from PreviewScreen (screen state discarded or preserved depending on stack behavior).
2. Creator returns. `useFocusEffect` fires.
3. DB fetch returns `0`. `setReceiveCount(0 ?? 1)` → `setReceiveCount(0)`.
4. Any Realtime-delivered value the user previously saw is overwritten.

Even if the DB momentarily held a correct value (e.g., from a successful `syncToCloud` update), the `useFocusEffect` has no monotonicity guard — it will happily set the count to a value lower than what was previously displayed.

Additionally, Supabase Realtime does **not** replay missed events on channel join. If the Realtime subscription handshake completes after the `syncToCloud` UPDATE commits, the event is permanently missed and the UI never self-corrects.

**Problematic code locations:**

- `useFocusEffect` at `PreviewScreen.tsx:65-77`: Re-fetches on every focus, uses `?? 1` instead of `|| 1`, has no `Math.max` guard.
- `syncToCloud` at `storage.ts:194-206`: Two-step upsert-then-update creates a window where the DB has `0`.

**Impact:** The count is unstable. Even if it briefly showed a correct value (via Realtime), navigating away and back resets it to `0`.

---

### Bug 4 — Server Increments `receive_count` on Every Page View

**Classification:** Design defect / semantic corruption

**Description:**

> **Not identified in the original report.** Found during code audit.

The Express server at `server/index.js:197-211` increments `receive_count` on every `GET /card/:id` request:

```js
// server/index.js:197-211
// Increment receive count (best-effort, non-blocking)
const newCount = ((recipe.receive_count) ?? 0) + 1;
fetch(
  `${supabaseUrl}/rest/v1/recipes?id=eq.${encodeURIComponent(id)}`,
  {
    method: 'PATCH',
    headers: { ... },
    body: JSON.stringify({ receive_count: newCount }),
  }
).catch(() => {});
```

This has multiple problems:

**Problem A — Wrong semantic.** `receive_count` is supposed to mean "how many people hold a copy of this card". The server increments it on every page view — before the recipient has saved anything. Viewing the web preview is not the same as saving the card.

**Problem B — Inflated by refreshes.** If a user refreshes the page, the count goes up again. Every page load is an increment.

**Problem C — Inflated by bots.** Search engine crawlers, link previews (Slack, iMessage, etc.), and other automated requests all trigger the increment.

**Problem D — Non-atomic read-then-write.** The server reads `recipe.receive_count`, adds 1 in JavaScript, and writes back. Two concurrent requests read the same value, both compute `next`, both write the same value — one increment is lost. This is a classic lost-update race condition.

**Problem E — Fire-and-forget with no error handling.** The `fetch().catch(() => {})` discards all errors silently.

**Problem F — Conflicts with the app's RPC increment.** The server writes `receive_count` directly via the REST API, while the app uses an RPC. These two mechanisms can overwrite each other. If the server sets `receive_count = 3` (from page views) and the RPC atomically increments from the DB value, the count is incoherent.

**Problematic code location:**

`server/index.js:197-211`: The `GET /card/:id` handler.

**Impact:** The count is inflated by web traffic, page refreshes, and bots. It no longer represents "people who saved this card". The non-atomic write also loses increments under concurrent requests.

---

### Bug 5 — `syncToCloud` Never Checks Error on `receive_count` Update

**Classification:** Silent failure / missing error handling

**Description:**

> **Not identified as a distinct bug in the original report.** Mentioned in acceptance criteria but not in root cause analysis.

The `receive_count` initialisation in `syncToCloud` (after the upsert) has two silent-failure paths:

```ts
// storage.ts:194-206
// Initialise receive_count to 1 (the creator) on first publish only.
// Fetch first so we never reset a count that's already been incremented.
const { data: countRow } = await supabase       // ← { error } not destructured
  .from('recipes')
  .select('receive_count')
  .eq('id', recipe.id)
  .single();
if (!countRow?.receive_count) {
  await supabase                                  // ← { error } not destructured
    .from('recipes')
    .update({ receive_count: 1 })
    .eq('id', recipe.id);
}
```

**Silent failure path A — The SELECT fails:** If the `.select()` returns an error (RLS, network), `countRow` is `null`. `!countRow?.receive_count` is `!undefined` = `true`, so the code proceeds to update — which may also fail.

**Silent failure path B — The UPDATE fails:** If the `.update()` returns an error (RLS blocks it, column doesn't exist, etc.), the `{ error }` is never destructured or checked. The count stays at `0` permanently with zero indication.

**Additionally, the read-then-write is non-atomic.** Between the SELECT and the UPDATE, another operation (e.g., `incrementReceiveCount` RPC, or the server's REST PATCH) could change the value. The conditional `if (!countRow?.receive_count)` checks a stale value. A single atomic operation — `UPDATE ... WHERE receive_count = 0` — would eliminate this window entirely.

**Problematic code location:**

`syncToCloud` at `src/utils/storage.ts:196-206`: Neither the SELECT nor the UPDATE check `{ error }`.

**Impact:** If RLS or any DB issue prevents the initialisation write, the count is stuck at `0` forever with no error message. This may be the actual root cause of the feature never working.

---

### Bug 6 — Dead `api.ts` Has a Non-Atomic Competing Implementation

**Classification:** Maintenance hazard / dead code

**Description:**

> **Not identified in the original report.** Found during code audit.

`src/utils/api.ts:4-12` exports a function also named `incrementReceiveCount`:

```ts
// api.ts:4-12
export async function incrementReceiveCount(cardId: string): Promise<void> {
  const { data } = await supabase
    .from('recipes')
    .select('receive_count')
    .eq('id', cardId)
    .single();
  const next = ((data?.receive_count as number) ?? 0) + 1;
  await supabase.from('recipes').update({ receive_count: next }).eq('id', cardId);
}
```

This function is **not currently imported anywhere** — only `fetchSharedRecipe` is imported from `api.ts` (by `ReceiveScreen.tsx:15`). However:

**Problem A — Name collision.** Two exported functions with the same name in two different modules (`storage.ts` and `api.ts`). A developer could accidentally import from the wrong module.

**Problem B — Non-atomic read-then-write.** Unlike the RPC approach in `storage.ts` (which at least delegates atomicity to PostgreSQL), this function reads the count, increments in JavaScript, and writes back. Two concurrent calls would lose one increment.

**Problem C — No error checking.** Neither the SELECT nor the UPDATE check `{ error }`.

**Problematic code location:**

`src/utils/api.ts:4-12`: Dead code with a dangerous implementation.

**Impact:** No current impact (dead code). But if someone imports it by mistake — or if the `storage.ts` RPC version is removed during a refactor and this one is used as a replacement — it introduces lost-update races.

---

## Fault Injection Scenarios

### Scenario 1 — Slow network at publish time

**Trigger:** Phone A publishes on a high-latency connection (>3000ms round-trip).

**What happens:** `syncToCloud` upsert takes 3+ seconds. React flushes the state update at the first `await`. `useFocusEffect` fires and queries Supabase. The row may not exist yet (`.single()` returns `{ data: null }`). The `if (data)` guard skips `setReceiveCount`. UI stays at `null` (count hidden). When `syncToCloud` eventually sets `receive_count = 1`, it may be missed by the Realtime subscription if the channel hadn't finished subscribing.

**Risk level:** High — reproducible on any constrained network.

### Scenario 2 — RPC call on an offline recipient device

**Trigger:** Phone B saves the card in an area with no connectivity.

**What happens:** `incrementReceiveCount` is called. `supabase.rpc()` throws a network error. The `catch { }` block discards it. When Phone B comes back online, there is no retry. The increment is permanently lost.

**Risk level:** Medium — realistic for any mobile user in a low-signal area.

### Scenario 3 — Realtime subscription not yet subscribed when UPDATE fires

**Trigger:** PreviewScreen mounts (or `useFocusEffect` deps change), but the Realtime channel handshake takes longer than the `syncToCloud` round-trip.

**What happens:** The UPDATE event for `receive_count = 1` is emitted before the subscription is active. Supabase does not replay missed events. The UI never learns the DB was updated.

**Risk level:** High on slow connections.

### Scenario 4 — Multiple rapid publishes (double-tap)

**Trigger:** The user taps Publish twice in rapid succession.

**What happens:** Two `syncToCloud` calls for the same `recipe.id`. Both upsert the same row (idempotent). Both proceed to the read-then-update sequence. Both read `0`, both write `1`. Harmless here (same value), but reveals missing debounce.

**Risk level:** Low for data corruption.

### Scenario 5 — `increment_receive_count` RPC throws a PostgreSQL exception

**Trigger:** The RPC body raises an exception (constraint violation, `RAISE EXCEPTION`, etc.).

**What happens:** `supabase.rpc()` returns `{ data: null, error: { ... } }` — a resolved Promise. The `catch` block is never entered. The `error` field is never inspected. Silent failure.

**Risk level:** High — most likely the current failure mode.

### Scenario 6 — Web page shared on social media / group chat

**Trigger:** Creator shares the web link (`https://recipecards-api.fly.dev/card/{id}`) in a WhatsApp group or Slack channel.

**What happens:** Every member's device generates a link preview (automated GET request). Each preview request increments `receive_count` via the server (Bug 4). A group of 50 people generates 50 increments before anyone even opens the link manually. Concurrent requests also lose increments due to the non-atomic read-then-write.

**Risk level:** High — realistic sharing scenario, completely corrupts the count.

### Scenario 7 — RLS blocks anonymous writes but allows reads

**Trigger:** Supabase RLS policy allows `SELECT` for anonymous users but blocks `UPDATE`/`INSERT`.

**What happens:** The `syncToCloud` upsert may succeed (if the user has a session) but the `incrementReceiveCount` RPC (called from a different device, possibly anonymous) is blocked. The `{ error }` is never checked (Bugs 2 and 5). The count initialises to `1` but never increments.

**Risk level:** High — depends on Supabase RLS configuration, which should be verified.

---

## Fix Plan

### Prerequisites — Verify the RPC exists in Supabase

Before any client-side fix, verify that the `increment_receive_count` PostgreSQL function is deployed in Supabase with the correct signature:

```sql
-- Expected: a function that atomically increments receive_count by 1
CREATE OR REPLACE FUNCTION increment_receive_count(recipe_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE recipes SET receive_count = receive_count + 1 WHERE id = recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Check via Supabase dashboard → SQL Editor or the `list_extensions`/`execute_sql` tools. If the RPC doesn't exist, create it. The `SECURITY DEFINER` clause bypasses RLS, ensuring recipients (who may be anonymous) can increment the count.

---

### Fix 1 — Atomic `receive_count` init in `syncToCloud`

**File:** `src/utils/storage.ts` (lines 194-206)

**Current code:**
```ts
const { data: countRow } = await supabase
  .from('recipes')
  .select('receive_count')
  .eq('id', recipe.id)
  .single();
if (!countRow?.receive_count) {
  await supabase
    .from('recipes')
    .update({ receive_count: 1 })
    .eq('id', recipe.id);
}
```

**Replace with:**
```ts
const { error: countError } = await supabase
  .from('recipes')
  .update({ receive_count: 1 })
  .eq('id', recipe.id)
  .eq('receive_count', 0);   // Only set to 1 if currently 0 — never overwrites a higher value
if (countError) console.warn('[syncToCloud] receive_count init failed:', countError.message);
```

**Why this works:**
- Single atomic operation — no read-then-write window.
- The `.eq('receive_count', 0)` clause acts as a conditional: if the count has already been incremented (by recipients or a re-sync), the WHERE clause matches zero rows and the update is a no-op. Safe for re-publishes.
- `{ error }` is now checked and logged.

---

### Fix 2 — Optimistic `setReceiveCount(1)` on publish

**File:** `src/screens/PreviewScreen.tsx` (inside `doPublish`, after line 141)

**Current code:**
```ts
const local = await markPublishedLocally(base.id);
setRecipe(local);
```

**Add after `setRecipe(local)`:**
```ts
setReceiveCount(1);  // Optimistic — the creator is always holder #1
```

**Why this works:**
- The creator sees `1` instantly with no round-trip.
- Even if `syncToCloud` fails entirely, the local display is correct.
- The Realtime subscription will correct it upward if recipients save the card.
- The `useFocusEffect` (after Fix 3) won't overwrite it with a lower value.

---

### Fix 3 — Fix `useFocusEffect`: `|| 1` and `Math.max`

**File:** `src/screens/PreviewScreen.tsx` (lines 65-77)

**Current code:**
```ts
useFocusEffect(
  useCallback(() => {
    if (recipe.status !== 'published' || !recipe.id) return;
    supabase
      .from('recipes')
      .select('receive_count')
      .eq('id', recipe.id)
      .single()
      .then(({ data }) => {
        if (data) setReceiveCount((data.receive_count as number) ?? 1);
      });
  }, [recipe.id, recipe.status])
);
```

**Replace with:**
```ts
useFocusEffect(
  useCallback(() => {
    if (recipe.status !== 'published' || !recipe.id) return;
    supabase
      .from('recipes')
      .select('receive_count')
      .eq('id', recipe.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const dbCount = (data.receive_count as number) || 1;  // Treat 0 as uninitialised
          setReceiveCount(prev =>
            prev !== null ? Math.max(prev, dbCount) : dbCount   // Never decrease
          );
        }
      });
  }, [recipe.id, recipe.status])
);
```

**Why this works:**
- `|| 1` correctly treats `0` as uninitialised (unlike `?? 1`).
- `Math.max(prev, dbCount)` ensures the displayed count never moves backward — a Realtime-delivered `5` won't be overwritten by a stale DB read of `3` on refocus.
- Still fetches on every focus (good for picking up changes made while the user was away), but only applies the value if it's higher.

---

### Fix 4 — Surface RPC errors in `incrementReceiveCount`

**File:** `src/utils/storage.ts` (lines 226-230)

**Current code:**
```ts
export async function incrementReceiveCount(id: string): Promise<void> {
  try {
    await supabase.rpc('increment_receive_count', { recipe_id: id });
  } catch { /* non-critical */ }
}
```

**Replace with:**
```ts
export async function incrementReceiveCount(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_receive_count', { recipe_id: id });
    if (error) console.error('[incrementReceiveCount] RPC failed:', error.message, error.details);
  } catch (e) {
    console.error('[incrementReceiveCount] network error:', e);
  }
}
```

**Why this works:**
- `{ error }` from `supabase.rpc()` is now inspected. This covers failure modes A, B, and D (RPC missing, wrong signature, RLS block).
- Network errors (failure mode C) are logged instead of silently discarded.
- This single change will immediately reveal the actual failure mode when tested on a device.

---

### Fix 5 — Remove server-side increment on page view

**File:** `server/index.js` (lines 197-211)

**Delete this block entirely:**
```js
// Increment receive count (best-effort, non-blocking)
const newCount = ((recipe.receive_count) ?? 0) + 1;
fetch(
  `${supabaseUrl}/rest/v1/recipes?id=eq.${encodeURIComponent(id)}`,
  {
    method: 'PATCH',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ receive_count: newCount }),
  }
).catch(() => {});
```

**Why:** The count should only increase when `saveReceivedCard` fires the RPC — not on every web page view. Viewing a web preview is not the same as saving a card. Page refreshes, bots, and link previews all inflate the count. The non-atomic read-then-write also loses increments under concurrency and conflicts with the app's RPC.

If page-view tracking is desired later, it should use a separate `view_count` column with an atomic `SET view_count = view_count + 1` (not a read-then-write).

---

### Fix 6 — Delete dead `incrementReceiveCount` from `api.ts`

**File:** `src/utils/api.ts` (lines 4-12)

**Delete this function:**
```ts
export async function incrementReceiveCount(cardId: string): Promise<void> {
  const { data } = await supabase
    .from('recipes')
    .select('receive_count')
    .eq('id', cardId)
    .single();
  const next = ((data?.receive_count as number) ?? 0) + 1;
  await supabase.from('recipes').update({ receive_count: next }).eq('id', cardId);
}
```

**Also remove** the `supabase` import if `fetchSharedRecipe` doesn't use it (it does — keep the import).

**Why:** Dead code with a name collision against `storage.ts:incrementReceiveCount`. The non-atomic read-then-write implementation is dangerous if accidentally imported. Removing it eliminates the maintenance hazard entirely.

---

## Acceptance Criteria

### Initialisation

- [ ] Immediately after publish, PreviewScreen displays `receive_count = 1`, not `0`
- [ ] The display of `1` is stable — no flicker or change in the 5 seconds after publish
- [ ] The DB row in Supabase has `receive_count = 1` within 10 seconds of publish (verifiable in Supabase dashboard)
- [ ] Publishing the same card twice (forced second `syncToCloud` call) does not reset `receive_count` to `1` if it has already been incremented above `1`

### Recipient increment

- [ ] When Phone B saves via `saveReceivedCard`, the `increment_receive_count` RPC is confirmed working (verified by Supabase function logs or `console.log` before the call)
- [ ] After Phone B saves, the DB `receive_count` increases by `1` (verifiable in Supabase dashboard)
- [ ] After Phone B saves, Phone A's PreviewScreen displays the updated count within a reasonable time via Realtime
- [ ] If Phone B is offline when saving, the failure is logged to the console — not silently discarded

### Persistence across navigation

- [ ] Phone A navigates from PreviewScreen to HomeScreen and back: `receive_count` never decreases from the previously displayed value
- [ ] After two recipients save the card, `receive_count = 3` (1 creator + 2 recipients) is stable across any number of navigate-away-and-return cycles

### Server-side correctness

- [ ] Opening the web preview (`GET /card/:id`) does NOT increment `receive_count`
- [ ] Refreshing the web preview does NOT increment `receive_count`
- [ ] Only `saveReceivedCard` (via the RPC) increments the count

### Error visibility

- [ ] Any error returned by `supabase.rpc('increment_receive_count', ...)` is logged to the console
- [ ] Any error from the `syncToCloud` `receive_count` initialisation write is logged to the console
- [ ] No `receive_count`-related code path silently swallows errors

### Dead code removal

- [ ] `src/utils/api.ts` no longer exports `incrementReceiveCount`
- [ ] Only one `incrementReceiveCount` function exists in the codebase (in `storage.ts`)

### Regression guard

- [ ] A DB value of `0` is correctly treated as uninitialised — the UI displays `1`, not `0`
- [ ] The `|| 1` (or equivalent) correctly handles this case

---

*End of bug report.*
