# WhatsApp-Shareable Deep Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fly.dev HTML share page (blocked by Chrome 87+) with a Supabase Edge Function that 302-redirects to an Android `intent://` URL, enabling one-tap WhatsApp → RecipeCards opening for any APK-installed recipient.

**Architecture:** One Supabase Edge Function (`supabase/functions/r/index.ts`) that parses a card id from the URL path and returns HTTP 302 with `Location: intent://card/{id}#Intent;scheme=recipecards;package=com.camelo.recipecards;end`. No HTML, no JS, no DB lookup. Client code centralises the share URL construction in a single helper so `PreviewScreen` and `CardViewScreen` no longer build the URL inline.

**Tech Stack:**
- Supabase Edge Functions (Deno runtime, invoked via `supabase functions deploy`)
- TypeScript (Expo SDK 55, React Native 0.83, Jest + jest-expo for unit tests)
- Existing: `recipecards://` scheme + `linking` config in `App.tsx`, already ships in all APKs

**Reference spec:** `docs/superpowers/specs/2026-04-21-whatsapp-shareable-deep-link-design.md`

---

## File Structure

| File | Purpose | Action |
|---|---|---|
| `supabase/functions/r/index.ts` | Edge Function: parses id, returns 302 intent:// | Create |
| `supabase/config.toml` | Declares the `r` function with `verify_jwt = false` | Create or extend |
| `src/utils/shareLink.ts` | Pure helper: `buildShareLink(id)` → HTTPS URL | Create |
| `src/__tests__/shareLink.test.ts` | Unit tests for `buildShareLink` | Create |
| `src/screens/PreviewScreen.tsx` | Use `buildShareLink` instead of inline `process.env...` | Modify (line 104) |
| `src/screens/CardViewScreen.tsx` | Use `buildShareLink` instead of inline `process.env...` | Modify (line 334) |
| `.env` | Ensure `EXPO_PUBLIC_SUPABASE_URL` is present (it already is) | No change |

`src/utils/voiceToRecipe.ts` also reads `EXPO_PUBLIC_SERVER_URL` for transcription — **do not touch it**. That endpoint is a separate concern and must keep calling fly.dev.

---

## Task 1: Create the share-link helper with tests

**Files:**
- Create: `src/utils/shareLink.ts`
- Create: `src/__tests__/shareLink.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/shareLink.test.ts`:

```ts
/**
 * Tests for src/utils/shareLink.ts
 *
 * `buildShareLink` must produce an HTTPS URL that points at the Supabase
 * Edge Function responsible for redirecting to the `intent://` URL.
 */
import { buildShareLink, SHARE_LINK_BASE } from '../utils/shareLink';

describe('buildShareLink', () => {
  it('returns the Supabase Edge Function URL with the given card id appended', () => {
    expect(buildShareLink('abc123')).toBe(
      `${SHARE_LINK_BASE}/functions/v1/r/abc123`
    );
  });

  it('URL-encodes unusual characters in the card id', () => {
    expect(buildShareLink('id with space')).toBe(
      `${SHARE_LINK_BASE}/functions/v1/r/id%20with%20space`
    );
  });

  it('always starts with https://', () => {
    expect(buildShareLink('x').startsWith('https://')).toBe(true);
  });

  it('throws on an empty id', () => {
    expect(() => buildShareLink('')).toThrow(/empty/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- shareLink.test.ts`
Expected: FAIL with `Cannot find module '../utils/shareLink'` or equivalent.

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/shareLink.ts`:

```ts
export const SHARE_LINK_BASE =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://hlvaztyvrpyfpgojitvu.supabase.co';

export function buildShareLink(cardId: string): string {
  if (!cardId) throw new Error('buildShareLink: cardId must not be empty');
  return `${SHARE_LINK_BASE}/functions/v1/r/${encodeURIComponent(cardId)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- shareLink.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/shareLink.ts src/__tests__/shareLink.test.ts
git commit -m "Add buildShareLink helper for Supabase Edge Function URLs"
```

---

## Task 2: Switch PreviewScreen to the helper

**Files:**
- Modify: `src/screens/PreviewScreen.tsx` (line 104 and line 190)

- [ ] **Step 1: Read the target lines**

Open `src/screens/PreviewScreen.tsx`. The relevant block today is:

```ts
const webUrl = `${process.env.EXPO_PUBLIC_SERVER_URL}/card/${recipe.id}`;
```

…and later, inside the `<ShareQRModal>` JSX:

```tsx
qrUrl={recipe.shareUrl ?? `recipecards://card/${recipe.id}`}
shareUrl={webUrl}
```

- [ ] **Step 2: Add the import**

At the top of `src/screens/PreviewScreen.tsx`, alongside the other util imports (the group that already imports from `../utils/storage`), add:

```ts
import { buildShareLink } from '../utils/shareLink';
```

- [ ] **Step 3: Replace the `webUrl` definition**

Replace:

```ts
const webUrl = `${process.env.EXPO_PUBLIC_SERVER_URL}/card/${recipe.id}`;
```

With:

```ts
const webUrl = buildShareLink(recipe.id);
```

Leave the `<ShareQRModal>` JSX alone — it already reads `shareUrl={webUrl}` and `qrUrl={recipe.shareUrl ?? ...}`, which is correct.

- [ ] **Step 4: Typecheck the file**

Run: `npx tsc --noEmit`
Expected: no errors related to `PreviewScreen.tsx`. (Other pre-existing errors in the repo — if any — are out of scope.)

- [ ] **Step 5: Run the test suite**

Run: `npm test`
Expected: all tests pass. `PreviewScreen` has no direct tests; this is a smoke check that nothing else broke.

- [ ] **Step 6: Commit**

```bash
git add src/screens/PreviewScreen.tsx
git commit -m "PreviewScreen: use buildShareLink helper for share URL"
```

---

## Task 3: Switch CardViewScreen to the helper

**Files:**
- Modify: `src/screens/CardViewScreen.tsx` (line 334)

- [ ] **Step 1: Add the import**

At the top of `src/screens/CardViewScreen.tsx`, alongside the other `../utils/` imports, add:

```ts
import { buildShareLink } from '../utils/shareLink';
```

- [ ] **Step 2: Replace the inline share URL**

In the `<ShareQRModal>` JSX, replace:

```tsx
shareUrl={`${process.env.EXPO_PUBLIC_SERVER_URL}/card/${displayRecipe?.id ?? ''}`}
```

With:

```tsx
shareUrl={displayRecipe?.id ? buildShareLink(displayRecipe.id) : ''}
```

The conditional is needed because `buildShareLink` throws on an empty id and `displayRecipe` can be null during the first render.

Leave `qrUrl={displayRecipe?.shareUrl ?? `recipecards://card/${displayRecipe?.id ?? ''}`}` unchanged — the QR encodes the custom scheme because a same-device scanner hands it straight to the OS (no WhatsApp layer), so the intent:// redirect is not needed.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors related to `CardViewScreen.tsx`.

- [ ] **Step 4: Run the test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/screens/CardViewScreen.tsx
git commit -m "CardViewScreen: use buildShareLink helper for share URL"
```

---

## Task 4: Create the Supabase Edge Function

**Files:**
- Create: `supabase/functions/r/index.ts`

- [ ] **Step 1: Verify Supabase CLI is available**

Run: `npx supabase --version`
Expected: a version number (2.x). If this fails with "command not found", install with `npm i -D supabase` first.

- [ ] **Step 2: Initialise local supabase config if not already**

Check if `supabase/config.toml` already exists. If not, run:

```bash
npx supabase init
```

This creates `supabase/` with a `config.toml`. Answer "no" to any prompts about generating VSCode settings, Deno ext, etc. — they are not needed.

- [ ] **Step 3: Create the function directory and file**

Run:

```bash
mkdir -p supabase/functions/r
```

Then create `supabase/functions/r/index.ts` with exactly this content:

```ts
// Supabase Edge Function: /functions/v1/r/{id}
//
// Responds with HTTP 302 → intent://card/{id}#Intent;scheme=recipecards;package=com.camelo.recipecards;end
// Android Chrome parses intent://, locates the RecipeCards APK by its
// package name, and hands it the URI recipecards://card/{id}. The app
// then opens CardView and fetches the recipe from Supabase exactly as
// a QR scan does.
//
// No HTML, no JS, no DB lookup. Must be deployed with --no-verify-jwt
// (or verify_jwt = false in config.toml) so unauthenticated browsers
// can call it.

const ID_PATTERN = /^[\w-]{1,64}$/;
const ANDROID_PACKAGE = 'com.camelo.recipecards';
const SCHEME = 'recipecards';

Deno.serve((req: Request) => {
  const url = new URL(req.url);
  // Path looks like /functions/v1/r/{id}. Take the last segment.
  const segments = url.pathname.split('/').filter(Boolean);
  const id = segments[segments.length - 1] ?? '';

  if (!ID_PATTERN.test(id)) {
    return new Response('Not found', { status: 404 });
  }

  const intentUrl =
    `intent://card/${id}` +
    `#Intent;scheme=${SCHEME};package=${ANDROID_PACKAGE};end`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: intentUrl,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});
```

- [ ] **Step 4: Ensure JWT verification is disabled for this function**

Open `supabase/config.toml`. Find the `[functions]` section (or add it). Add an entry for `r`:

```toml
[functions.r]
verify_jwt = false
```

If the file already has other `[functions.xxx]` entries, keep them — just add the `r` block. If `config.toml` is brand new and minimal, the whole file may only be a few lines; append at the end.

- [ ] **Step 5: Commit the function source**

```bash
git add supabase/functions/r/index.ts supabase/config.toml
git commit -m "Add share-link redirect Edge Function (r)"
```

---

## Task 5: Deploy and smoke-test the Edge Function

**Files:** None to modify; this task is deployment + verification.

- [ ] **Step 1: Log in to the Supabase CLI**

Run: `npx supabase login`

Follow the browser flow. If the user is already logged in (check `~/.supabase/`), skip.

- [ ] **Step 2: Link the local repo to the remote Supabase project**

Run:

```bash
npx supabase link --project-ref hlvaztyvrpyfpgojitvu
```

If prompted for a database password, press Enter (we do not use any migration commands here).

- [ ] **Step 3: Deploy the function**

Run:

```bash
npx supabase functions deploy r --no-verify-jwt
```

Expected stdout: "Deployed Function r". If the CLI ignores `--no-verify-jwt` because `config.toml` already sets `verify_jwt = false`, that is fine — the config wins.

- [ ] **Step 4: Smoke-test with curl (headers only)**

Run:

```bash
curl -sI https://hlvaztyvrpyfpgojitvu.supabase.co/functions/v1/r/test123 | head -10
```

Expected output (order may vary):

```
HTTP/2 302
location: intent://card/test123#Intent;scheme=recipecards;package=com.camelo.recipecards;end
cache-control: public, max-age=31536000, immutable
```

If you see `HTTP/2 401` instead, the JWT verification step failed — re-deploy with `--no-verify-jwt` and re-check `config.toml`.

- [ ] **Step 5: Smoke-test with a malformed id**

Run:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://hlvaztyvrpyfpgojitvu.supabase.co/functions/v1/r/bad%2Fid
```

Expected output: `404`.

- [ ] **Step 6: Smoke-test that no Authorization header is required**

Run:

```bash
curl -sI https://hlvaztyvrpyfpgojitvu.supabase.co/functions/v1/r/x --header 'Authorization:'
```

Expected: `HTTP/2 302` (not 401). Confirms JWT verification is fully off.

No commit for this task — it is deploy-only. If any of the smoke checks fail, stop and fix before proceeding to Task 6.

---

## Task 6: End-to-end device test

**Files:** None to modify.

This task validates the full Share flow on real Android hardware. Requires two Android devices (or one device + an emulator) with the APK installed.

- [ ] **Step 1: Build a fresh APK with the new share-link helper**

From the project root, run the build the user normally uses for device testing. The repo convention is a local Gradle release build (see `docs/Commands to Run testing and Builds.txt`):

```bash
cd android && ./gradlew assembleRelease
```

Expected: APK at `android/app/build/outputs/apk/release/app-release.apk`.

- [ ] **Step 2: Install on two devices**

Transfer the APK to both devices and install. Both devices must have the APK installed before testing.

- [ ] **Step 3: Publish a recipe on device A, tap Share → Share link**

On device A:
1. Create or open a published recipe.
2. Tap the Share button to open `ShareQRModal`.
3. Tap the **Share link** button (the orange pill at the bottom of the modal).
4. Pick WhatsApp (or Gmail or SMS) as the target and send to the account used on device B.

- [ ] **Step 4: Tap the link on device B**

On device B, open the message. The URL should appear as a tappable blue link of the form `https://hlvaztyvrpyfpgojitvu.supabase.co/functions/v1/r/{id}`.

Tap it.

Expected behaviour:
- Chrome opens briefly (may show a white flash or a "redirecting…" indicator).
- RecipeCards takes focus.
- The CardView screen displays the recipe with the sender's name as "Recipe by …".
- If the recipient has not previously saved this card, the orange **"Save to collection"** button is visible below the card.

If Chrome instead shows the URL and stays there, re-check Task 5 step 4 (JWT verification) and Task 4 step 3 (the intent URL format).

- [ ] **Step 5: Tap Save to collection**

Expected: button turns green and reads "Added". Navigate back to Home on device B; the received card appears in the draft list with the "received" indicator.

- [ ] **Step 6: Reverse-direction test**

Repeat steps 3–5 with device B as sender and device A as receiver to confirm bidirectional behaviour.

- [ ] **Step 7: App-not-installed test**

On a third device (or an emulator) *without* the APK installed, tap the same WhatsApp link. Expected: Chrome shows its default "No app can handle this link" error or a blank page. This is acceptable — APK distribution is a prerequisite per the spec.

- [ ] **Step 8: Offline test**

On device B, enable airplane mode. Tap the link. Expected: Chrome shows a network error. Turn airplane mode off, tap again — expect normal flow.

No commit for this task.

---

## Task 7: Decommission note for the fly.dev server

**Files:**
- Modify: `docs/share-link-bug-analysis.md`

- [ ] **Step 1: Add a status line at the top**

Prepend to `docs/share-link-bug-analysis.md`:

```markdown
> **Status (2026-04-21):** Superseded by the Supabase Edge Function approach — see `docs/superpowers/specs/2026-04-21-whatsapp-shareable-deep-link-design.md`. The fly.dev server's HTML+JS redirect path documented below is no longer in the share flow; client code now produces Supabase `intent://` redirect URLs. The fly.dev server can be kept running or decommissioned at any time — neither the sender nor the recipient app paths depend on it anymore for card sharing.

```

- [ ] **Step 2: Commit**

```bash
git add docs/share-link-bug-analysis.md
git commit -m "Mark share-link bug analysis as superseded"
```

No code change; this is a bookkeeping commit so future readers are not confused by the old analysis.

---

## Self-Review Checklist

Run these checks before handing off:

1. **Spec coverage** — every numbered section of the spec is covered:
   - §3 Solution overview → Task 4
   - §4 Why this works on Android Chrome → built into Task 4 step 3 code comment
   - §5.1 Edge Function with no-verify-jwt → Tasks 4 + 5
   - §5.2 Client-side helper → Tasks 1–3
   - §5.3 Unchanged deep-link handling → nothing to do (already shipped)
   - §6 Data flow → Task 6 (E2E test validates the whole flow)
   - §7 Error paths → Task 5 step 5 (404), Task 6 step 7 (no app), step 8 (offline)
   - §8 Migration / compatibility → Task 6 tests cross-version on two devices
   - §9 Testing checklist → Task 5 (items 9–11) + Task 6 (items 1–8)

2. **Placeholder scan** — no `TBD`, no "add error handling", no "similar to Task N". Every code step shows full code.

3. **Type consistency** — `buildShareLink(id)` signature is identical across Tasks 1, 2, 3. `SHARE_LINK_BASE` exported from the same helper.

4. **Backward compatibility** — Tasks 1–4 do not rename or delete any public API. Old fly.dev links in the wild remain broken (already the case); new links work for any APK version because the scheme + package were always in the manifest.
