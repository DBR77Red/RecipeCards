# Share Link Bug Analysis

> **Superseded 2026-04-21.** The fly.dev "Open in RecipeCards" button path is no longer used. Share URLs now go through a Supabase Edge Function that 302-redirects to an Android `intent://` URL, bypassing the Chrome JS-nav block entirely. See `docs/superpowers/specs/2026-04-21-whatsapp-shareable-deep-link-design.md` and `supabase/functions/r/index.ts`. This file is retained for historical context.

## Symptom

When a user shares a recipe card, the recipient:
1. Sees a web page with a different layout than the app card
2. Cannot open the card inside the RecipeCards app via the "Open in RecipeCards" button

---

## Root Causes

### 1. Missing `scheme` in `app.config.js` (Critical)

**File:** `app.config.js`

The `scheme: "recipecards"` property is absent from the Expo config. Expo uses this property to automatically inject the deep-link intent filter into the Android manifest and the URL scheme into the iOS `Info.plist`.

Without it:
- Android never registers `recipecards://` as a handled scheme.
- Any link starting with `recipecards://` tapped from a browser, SMS, or share sheet is silently ignored — the OS has no app to hand it to.
- A rebuild is required after adding the scheme for the fix to take effect.

**Fix:** Add `scheme: "recipecards"` to `app.config.js` under the `expo` key, then rebuild the app.

---

### 2. QR Code Encodes the Custom Scheme Instead of the Web URL (UX Bug)

**Files:** `src/screens/PreviewScreen.tsx`, `src/screens/CardViewScreen.tsx`

Both screens pass `qrUrl` to `ShareQRModal`. Currently:

```ts
// PreviewScreen.tsx
qrUrl={recipe.shareUrl ?? `recipecards://card/${recipe.id}`}

// CardViewScreen.tsx
qrUrl={displayRecipe?.shareUrl ?? `recipecards://card/${displayRecipe?.id ?? ''}`}
```

`recipe.shareUrl` is set by `markPublishedLocally` to `recipecards://card/{id}`, so `qrUrl` is **always** the custom scheme.

When a recipient scans this QR code:
- **App installed:** Works correctly.
- **App not installed:** The QR scanner opens the raw URL in a browser, which shows a browser error ("can't open page") or does nothing.

`shareUrl` (the HTTPS web URL) is already passed separately and used only by the native share sheet button — the QR code never benefits from it.

**Fix:** Pass the HTTPS web URL (`https://recipecards-api.fly.dev/card/{id}`) as `qrUrl` instead of the custom scheme. Scanning the QR will open the web page, which already has the "Open in RecipeCards" button to redirect into the app.

---

### 3. "Open in RecipeCards" Button on the Web Page Fails on Android (Critical)

**File:** `server/index.js`

The web page's button uses:

```js
document.getElementById('openBtn').addEventListener('click', function(e) {
  e.preventDefault();
  window.location.href = deepLink; // deepLink = "recipecards://card/{id}"
  ...
});
```

This works on **iOS Safari** (which handles custom schemes by passing them to the OS), but **Android Chrome blocks `window.location.href` for unrecognised custom URI schemes**. The navigation is silently swallowed — the app never opens.

The correct approach for Android is an **intent URL**:

```
intent://card/{id}#Intent;scheme=recipecards;package=com.camelo.recipecards;end
```

Chrome on Android recognises this format and forwards it to the correct app (matched by `package`). If the app isn't installed, Chrome can optionally redirect to the Play Store.

**Fix:** Detect the user agent in the web page JS and use the `intent://` URL on Android, falling back to `recipecards://` on iOS/other platforms.

---

## Summary Table

| # | File | Issue | Impact |
|---|------|-------|--------|
| 1 | `app.config.js` | Missing `scheme: "recipecards"` | Deep links silently fail on Android (no intent filter registered) — **requires rebuild** |
| 2 | `PreviewScreen.tsx`, `CardViewScreen.tsx` | QR encodes `recipecards://` instead of HTTPS URL | QR scan fails when app is not installed |
| 3 | `server/index.js` | `window.location.href` custom scheme blocked by Android Chrome | "Open in RecipeCards" button does nothing on Android |

---

## Proposed Fix Order

1. **`app.config.js`** — Add `scheme: "recipecards"`. Rebuild the app.
2. **`server/index.js`** — Use `intent://` URL on Android in the "Open in RecipeCards" button.
3. **`PreviewScreen.tsx` / `CardViewScreen.tsx`** — Pass the HTTPS web URL as `qrUrl` to `ShareQRModal`.
