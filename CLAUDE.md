# RecipeCards — Claude Instructions

## Modal Design Standard

**All modals must use a custom component. Never use `Alert.alert` for user-facing confirmations or action sheets.**

### Spec
| Token | Value |
|---|---|
| Background | `#F7F5F2` (warm off-white) |
| Overlay | `rgba(0,0,0,0.65)` |
| Border radius | `24` |
| Padding | `32` |
| Gap | `16` |
| Animation | `Animated.timing` fade + `translateY` slide-in (duration 220ms, `useNativeDriver: true`) |

### Typography
| Role | Font | Size | Color |
|---|---|---|---|
| Title | `Poppins_700Bold` | 24 | `#1C0A00` |
| Body | `DMSans_400Regular` | 15, lineHeight 24 | `#8B6444` |
| Primary btn | `DMSans_600SemiBold` | 15 | `#FFFFFF` |
| Cancel | `DMSans_500Medium` | 14 | `#C4A882` |

### Buttons
- **Primary**: `backgroundColor: '#E8521A'`, `borderRadius: 100` (pill), `height: 54`, `marginTop: 8`, orange glow shadow
- **Destructive**: same shape, `backgroundColor: '#C0392B'`
- **Secondary/outline**: same shape, `borderWidth: 1.5`, `borderColor: '#E7E5E4'`, transparent bg
- **Cancel**: plain text, `paddingVertical: 16`, centered — no border, no background

### Reference implementations
- `src/components/PublishConfirmModal.tsx`
- `src/components/PhotoPickerModal.tsx`
- `src/components/DeleteConfirmModal.tsx`

---

## Typography System

Only these fonts are used. Never use system fonts.

| Token | Family | Usage |
|---|---|---|
| Display | `Poppins_700Bold` | Screen titles, section headers, modal headings, list item titles |
| Accent | `PlayfairDisplay_700Bold` | Card recipe names on **both card faces** (always italic, regardless of background), hero accent words — scoped to card content only, never used in screen chrome or modals |
| Body regular | `DMSans_400Regular` | Body text, labels, hints |
| Body medium | `DMSans_500Medium` | Navigation, secondary actions |
| Body semibold | `DMSans_600SemiBold` | Buttons, stat values, section headings |

---

## Color Palettes

The app has two palettes. Do not mix them across contexts.

### Screen / UI palette (screens, modals, HomeScreen)
| Name | Value | Usage |
|---|---|---|
| bg | `#FAF5EE` | Screen backgrounds, modal sheets (warm cream) |
| surface | `#F2E9D8` | Input areas, sheet fills |
| panel | `#1C0F06` | Nav bar, dark headers, voice bar (deep espresso) |
| title | `#1C0A00` | Primary text on light |
| body | `#4A2D1A` | Secondary text on light |
| muted | `#8B6444` | Captions, body in modals |
| label | `#C4A882` | Placeholder, cancel text |
| textInv | `#F5EDD9` | Parchment text on dark |
| textInvMuted | `#C4A882` | Muted text on dark |
| divider | `#E0D0B8` | Borders, separators |
| terracotta | `#E8521A` | Primary CTA, active tab, draft badge |
| accentWarm | `#D4780A` | Amber, secondary accent |
| sage | `#2D7A4F` | Published badge |
| btnBg | `#E8521A` | Primary button background (orange) |
| btnText | `#FFFFFF` | Primary button text |
| destructive | `#C0392B` | Delete, danger |

### Card palette (RecipeCard component only)
| Name | Value | Usage |
|---|---|---|
| bg | `#F5EDD9` | Card parchment cream (photo zone, back face) |
| border | `#E8D8B8` | Card border, dividers |
| amber | `#D4780A` | Accent, stat labels on dark panel |
| panel | `#1C0F06` | Card bottom info panel (dark espresso) |
| panelText | `#F5EDD9` | Title text on dark panel |
| panelMuted | `#C4A882` | Muted text on dark panel |
| darkText | `#1C0A00` | Back face headings |
| bodyText | `#4A2D1A` | Back face body text |

---

## Animation Rules

**Never use `useNativeDriver: false`.** All animations must run on the native/UI thread.

- Rotation, opacity, scale, translate → `Animated.spring` or `Animated.timing` with `useNativeDriver: true`
- Height / layout changes → `LayoutAnimation.configureNext` (fires once, native engine) or a plain `setState` snap
- Never animate `height`, `width`, or any layout property with `Animated.Value` + `useNativeDriver: false` — this runs on the JS thread every frame, causes jank, and can crash on low-end devices
- When mixing a `LayoutAnimation` height change with an `Animated` transform on the same render, prefer snapping height instantly (`setState` only, no `LayoutAnimation`) to avoid Android rendering conflicts

---

## RecipeCard Rules

- Card width: always `CARD_W = 320`
- Front height: always `CARD_H = 518` (golden ratio: 320 × 1.618 = 517.8) — same for draft and published, no layout shift
- Back height: content-driven — measured via `onLayout`, stored in a `ref` (not state) so `handleFlip` always reads the latest value without stale-closure issues. Minimum clamped to `frontH`.
- **Flip trigger**: the entire front face is a single `Pressable` — tapping anywhere on the front (photo zone or bottom panel) flips the card. The inner `TouchableOpacity` buttons (Share, Publish) absorb their own touch events so they still fire correctly. The entire back face is also a `Pressable` for flip-back.
- Both face shells use `pointerEvents="none"` when hidden (opacity 0) to prevent invisible views from intercepting touches.
- Never re-introduce a JS-driver spring on card height — this was the root cause of lag and Android back-face rendering failures.

---

## Navigation

- `headerShown: false` globally — every screen owns its own header UI
- Stack: Home → Form (optional `recipe` param) → Preview (`recipe` param) → CardView (`cardId` param)
- From Preview: if published → `navigation.reset` to Home; if draft → `navigation.goBack()`
- Deep links: `recipecards://card/{id}` → CardView screen
- HomeScreen reloads data via `useFocusEffect` on every focus

---

## Publish Flow

Publish is always two steps. Never block the user on the cloud step.

1. **Local first**: `markPublishedLocally(id)` — sets status, stamps `shareUrl`, QR appears immediately
2. **Cloud async**: `syncToCloud(local)` — uploads photo to Supabase Storage, upserts recipe row. If this fails, show an alert but the card remains published locally and the QR works on the same device.

Always show a `PublishConfirmModal` before triggering publish. Never publish on a single tap without confirmation.

---

## Storage Rules

- `saveDraft(recipe)` returns the saved object with an assigned `id`. Always do `setRecipe(saved)` after calling it — never assume the id is already set.
- `getDrafts()` returns all non-deleted recipes sorted newest first.
- Storage key: `@recipecards/drafts` (AsyncStorage, JSON array of `RecipeData`).

---

## Supabase Rules

- Project URL: `https://hlvaztyvrpyfpgojitvu.supabase.co`
- Client: `src/lib/supabase.ts`
- Table columns are **snake_case** (`creator_name`, `photo_url`, `prep_time`, `cook_time`, `share_url`); TypeScript type uses camelCase
- Photo upload: `recipe-photos` bucket (public), path `{id}.jpg`. Upload the photo **before** upserting the recipe row so `photo_url` is available.
- `CardViewScreen` fetches from Supabase first, falls back to local storage

---

## Performance Rules

- No `useNativeDriver: false` anywhere (see Animation Rules)
- Never put a `ScrollView` inside a component that is itself wrapped in a `Pressable` — scroll gestures will be intercepted by the Pressable
- Both card faces are always mounted (position absolute). Use `pointerEvents="none"` on the hidden face — invisible views still receive touches by default
- Measure back-face height with `onLayout` into a `ref`, not state, to avoid React batching causing stale values at flip time

---

## Voice Pipeline

- **Transcription**: Deepgram Nova-2 with `detect_language: true` — auto-detects language from audio
- **Languages**: pt-BR and pt-PT are first-class supported; English is the default fallback
- **Parsing**: transcripts are sent to Claude Haiku, which returns structured recipe JSON
- **API key hygiene**: `.env` is created manually by the developer — never write API keys directly into files or suggest committing them

---

## Soft Delete

Only published cards use soft delete. Drafts are hard-deleted.

| Status | Delete behavior |
|---|---|
| Draft | Hard delete with confirmation modal. Permanent, no recovery. |
| Published | Soft delete: stamp `deletedAt`, hide immediately, purge on next app startup. Warn user that recipients keep their copy but cannot re-share. |

---

## Parked Features — Do Not Re-introduce

These were intentionally removed. Do not bring them back without an explicit instruction from the user.

- **Confetti**: `react-native-confetti-cannon` removed due to stuck particles. A Lottie-based approach was considered but not started. Do not add any confetti effect.
- **Card fold/unfold mechanic**: the accordion flap + crease line that extended the back face was removed and replaced with a plain content-driven height via `onLayout`. Do not re-introduce the fold metaphor, the dashed crease line, or the translate-scale flip workaround associated with it.
- **Home screen deck view**: Attempted to show horizontal deck of cards at top of home screen (like back face preview). Implementation was reverted as it didn't work well. Do not attempt again without explicit user request with clear UX specs.

---

## Future Features

Planned features to implement in the future:

- **Share count** ⚠️ IN PROGRESS — NOT YET WORKING: The `receive_count` column exists in Supabase and increments via the `increment_receive_count` RPC (called inside `saveReceivedCard` in `storage.ts` when `isNew === true`). `PreviewScreen` subscribes via Supabase Realtime and animates the count on update. However the count is still not incrementing correctly during testing. Next step: verify the RPC is being reached (add a temporary log or check Supabase logs), confirm `isNew` is `true` on first receive, and ensure the Realtime subscription fires on the correct row.
- **Filter**: Filter cards on home screen (by status, date, etc.)
- **Auth**: User authentication for syncing across devices
- **Customization**: Allow users to customize card appearance (colors, fonts, themes)
- **Animations**: Full animation overhaul — the app needs to look and feel polished end-to-end. Scope includes:
  - Voice recording bar: replace the Lottie placeholder (`VOICE_LOTTIE_URL` in `RecipeForm.tsx`) with a proper audio-wave animation from lottiefiles.com (search "audio wave" or "sound wave", get the direct `.json` URL)
  - Card flip, screen transitions, micro-interactions on buttons and list items
  - All animations must use `useNativeDriver: true` (see Animation Rules above)
- **Smart share link**: Replace the `recipecards://card/{id}` deep link with a Universal Link (iOS) / App Link (Android) — e.g. `https://recipecards.app/card/{id}`. If the recipient has the app installed the OS intercepts the HTTPS URL and opens the app directly (same behaviour as the QR code). If they don't have the app, the link opens a web page that detects the platform and redirects to the App Store or Google Play. Requires: a hosted domain, an `apple-app-site-association` file served at `/.well-known/`, and an `assetlinks.json` file for Android. The Expo linking config (`recipecards://`) already handles in-app routing — only the outer URL scheme needs to change.
