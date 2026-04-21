# Design: WhatsApp-Shareable Deep Link via Supabase Edge Function

**Date:** 2026-04-21
**Status:** Draft — pending user review
**Scope:** Android APK distribution only. No web page, no published app, no new domain, no new hosting.

---

## 1. Problem

Users share recipe cards through messengers like WhatsApp. The current flow relies on a fly.dev-hosted HTML page whose "Open in RecipeCards" button fails on Android Chrome because the JS-initiated `window.location.href = "recipecards://…"` is blocked by Chrome 87+ security policy.

Users want a link that:
1. Appears as a tappable link in WhatsApp (so HTTPS, not `recipecards://`).
2. On tap, opens directly in the RecipeCards Android app.
3. Requires no web page, no published app listing, no new domain, and no new hosting beyond infrastructure already in use (Supabase).
4. Works for any recipient who has any existing version of the APK installed — no forced re-install.

## 2. Why a custom scheme alone fails

WhatsApp only linkifies `http://` and `https://` URLs. `recipecards://card/{id}` is rendered as plain non-tappable text. There is no in-app setting to change this — it is WhatsApp policy.

A HTTPS URL is therefore required. That URL must, on tap, hand control to the app without rendering any HTML.

## 3. Solution overview

Add one Supabase Edge Function that responds to `GET /functions/v1/r/{id}` with an HTTP 302 redirect whose `Location` header is an Android Chrome `intent://` URL:

```
HTTP/1.1 302 Found
Location: intent://card/{id}#Intent;scheme=recipecards;package=com.camelo.recipecards;end
```

No HTML, no JavaScript, no response body. Android Chrome processes `intent://` natively: it constructs an Android Intent targeting the `com.camelo.recipecards` package with URI `recipecards://card/{id}`, fires `Linking.openURL` equivalent at the OS, and the app launches on the CardView screen exactly as it does for a QR scan.

Share message format changes from the current fly.dev URL to:
```
https://hlvaztyvrpyfpgojitvu.supabase.co/functions/v1/r/{cardId}
```

## 4. Why this works on Android Chrome

- The user tap in WhatsApp counts as "user activation" — Chrome preserves that signal across the initial navigation.
- `intent://` is Chrome's first-class, documented mechanism for launching Android apps from the web. It is not subject to the same block that kills JS-initiated custom-scheme navigations.
- The Edge Function never renders HTML, so no `window.location.href` ever runs.
- The `package=com.camelo.recipecards` parameter disambiguates: Chrome only launches the app with matching package name, which all existing APK versions use.

## 5. Components

### 5.1 New: Supabase Edge Function `share-redirect`

Location: `supabase/functions/r/index.ts` (Supabase CLI convention — the function is invoked at `/functions/v1/r/...`).

Responsibility: parse the card id from the path, return a 302 with the `intent://` Location header. No DB lookup, no authentication, no side effects.

**Must be deployed with JWT verification disabled** so browsers can hit the endpoint without an `Authorization` header. With the Supabase CLI this is `supabase functions deploy r --no-verify-jwt`. Alternatively, set `verify_jwt = false` in the function's entry in `supabase/config.toml`. Without this step every recipient tap returns 401.

Pseudocode:
```ts
Deno.serve((req) => {
  const id = new URL(req.url).pathname.split("/").pop();
  if (!id || !/^[\w-]{1,64}$/.test(id)) {
    return new Response("Not found", { status: 404 });
  }
  const intent =
    `intent://card/${id}` +
    `#Intent;scheme=recipecards;package=com.camelo.recipecards;end`;
  return new Response(null, {
    status: 302,
    headers: { Location: intent },
  });
});
```

### 5.2 Modified: client-side share URL construction

Two places currently build the share URL:
- `src/screens/PreviewScreen.tsx` line 104: `const webUrl = ...`
- `src/screens/CardViewScreen.tsx` line 334: `shareUrl={...}`

Both read `process.env.EXPO_PUBLIC_SERVER_URL` and concatenate `/card/{id}`. Both get redirected through a single helper so the URL format lives in one place.

New helper, e.g. `src/utils/shareLink.ts`:
```ts
const SUPABASE_URL = 'https://hlvaztyvrpyfpgojitvu.supabase.co';
export const buildShareLink = (cardId: string) =>
  `${SUPABASE_URL}/functions/v1/r/${cardId}`;
```

`PreviewScreen` and `CardViewScreen` import and call `buildShareLink(recipe.id)` instead of inlining the URL.

### 5.3 Unchanged: deep-link handling inside the app

Everything downstream of the intent launch is already correct and shipped in production APKs:
- `app.config.js` line 7: `scheme: "recipecards"` is already set → AndroidManifest has the intent filter.
- `App.tsx` lines 42–49: `linking.prefixes: ['recipecards://']` with `CardView: 'card/:cardId'` is already wired.
- `CardViewScreen` already fetches from Supabase by `cardId` and handles own-card vs received states.

## 6. Data flow

```
Sender (APK v2+)                              Recipient (APK v1+)
──────────────────                            ───────────────────
tap Share button
  └─ RecipeCard → ShareQRModal
      └─ Share.share({ url: buildShareLink(id) })
          └─ WhatsApp system share sheet
              └─ WhatsApp message:
                 "https://…supabase.co/functions/v1/r/abc"
                                                  │
                                                  │ (user taps link)
                                                  ▼
                                           Android Chrome
                                             │
                                             │ GET /functions/v1/r/abc
                                             ▼
                                           Supabase Edge Function
                                             │
                                             │ 302 Location: intent://card/abc#Intent;…
                                             ▼
                                           Android Chrome
                                             │
                                             │ parse intent://, match package
                                             ▼
                                           RecipeCards app
                                             │
                                             │ Linking → "recipecards://card/abc"
                                             ▼
                                           CardView screen
                                             │
                                             │ Supabase fetch by id
                                             ▼
                                           Recipe card renders
```

## 7. Error paths

| Failure | Behavior | Acceptable? |
|---|---|---|
| Recipient taps link without the app installed | Chrome shows its default "No app found" page | Yes — out of scope (APK distribution assumption) |
| Recipient has old APK (v1, pre-this-change) | Intent still launches old APK because scheme + package match; CardView handles the cardId fetch exactly as today | Yes — verified: no recipient-side change needed |
| Edge Function returns 5xx | Chrome shows its error page | Yes — the share link is cached nowhere, user can retry |
| Card id path is malformed | Edge Function returns 404 | Yes |
| User is offline when tapping | Chrome shows "no network" | Yes — acceptable because the subsequent Supabase fetch would fail anyway |

No edge case loses recipe data — failures happen before any state mutation.

## 8. Migration / compatibility

**Recipient side:** zero migration. All existing APKs already register the `recipecards://` scheme and handle `card/:cardId`. A recipient on any shipped version can open new-format links immediately.

**Sender side:** only new APKs generate new-format links. Old APKs continue generating old fly.dev links, which remain broken exactly as they are today — no regression.

**Already-sent-in-the-wild links:** fly.dev links already in WhatsApp history stay non-functional. This is not a regression — they were already broken.

**fly.dev server:** can be kept running or shut down at any time. The new flow does not depend on it. Recommend keeping it alive for an unspecified transition window in case a user taps an old link and wants a friendly "please ask the sender to re-share" landing — but this is optional, not in scope for this spec.

## 9. Testing checklist

1. Build release APK with the new sender-side URL and install on device A.
2. Keep an older APK installed on device B (or reinstall the current production APK).
3. On device A, publish a recipe, tap Share → Share via WhatsApp → send to device B's WhatsApp.
4. On device B, tap the link in the WhatsApp chat. Expect: Chrome flashes briefly, RecipeCards opens on the CardView screen with the correct recipe.
5. Repeat step 3 with device B as sender and device A as receiver.
6. Repeat test with the app not installed on the recipient device — expect Chrome error, no crash.
7. Repeat test for a card that is the sender's own card (already saved locally) — expect CardView to show own-card state, not the "Save to collection" button.
8. Repeat test with airplane mode on recipient device at tap time — expect Chrome network error.
9. Call the Edge Function URL directly in a desktop browser — expect 302 header with the expected intent:// Location. Validate with `curl -I`.
10. Call the Edge Function with a malformed id (e.g. `foo/bar`) — expect 404.
11. Call the Edge Function with `curl -I` without any `Authorization` header — must return 302, not 401. Confirms JWT verification is disabled.

## 10. Out of scope

- iOS support (explicitly excluded by the user).
- Rendering a preview/thumbnail of the recipe in the WhatsApp link unfurl (would require hosting HTML with Open Graph tags — rejected).
- Fallback to Play Store if the app is not installed (no published app).
- Switching the deep-link scheme from `recipecards://` to any HTTPS App Link variant (rejected; would require hosting `/.well-known/assetlinks.json`).

## 11. Open questions

None. All architectural decisions are settled; remaining choices are purely implementation details (Edge Function file layout, shared helper file naming) and will be made in the implementation plan.
