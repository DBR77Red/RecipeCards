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
| Title | `PlayfairDisplay_700Bold` | 26 | `#1C1917` |
| Body | `DMSans_400Regular` | 15, lineHeight 24 | `#78716C` |
| Primary btn | `DMSans_600SemiBold` | 15 | `#F7F5F2` |
| Cancel | `DMSans_500Medium` | 14 | `#A8A29E` |

### Buttons
- **Primary**: `backgroundColor: '#1C1917'`, `borderRadius: 100` (pill), `height: 54`, `marginTop: 8`
- **Destructive**: same shape, `backgroundColor: '#DC2626'`
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
| Display | `PlayfairDisplay_700Bold` | Screen titles, card titles, modal headings |
| Body regular | `DMSans_400Regular` | Body text, labels, hints |
| Body medium | `DMSans_500Medium` | Navigation, secondary actions |
| Body semibold | `DMSans_600SemiBold` | Buttons, stat values, section headings |

---

## Color Palettes

The app has two palettes. Do not mix them across contexts.

### Screen / UI palette (screens, modals, HomeScreen)
| Name | Value | Usage |
|---|---|---|
| bg | `#F7F5F2` | Screen backgrounds, modal sheets |
| title | `#1C1917` | Primary text, button bg |
| body | `#44403C` | Secondary text |
| muted | `#78716C` | Captions, body in modals |
| label | `#A8A29E` | Placeholder, cancel text |
| divider | `#E7E5E4` | Borders, separators |
| terracotta | `#EA580C` | Active tab, draft badge |
| sage | `#059669` | Published badge |
| btnBg | `#1C1917` | Primary button background |
| btnText | `#F7F5F2` | Primary button text |

### Card palette (RecipeCard component only)
| Name | Value | Usage |
|---|---|---|
| bg | `#fdf8f0` | Card background (cream paper) |
| border | `#e8d5b0` | Card border, dividers |
| amber | `#d4820a` | Accent, stat labels, share button |
| darkText | `#2c1810` | Card titles |
| bodyText | `#5a3e2b` | Card body text |

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
- Front height: always `CARD_H_PUB = 720` regardless of draft/published status
- Back height: content-driven — measured via `onLayout`, stored in a `ref` (not state) so `handleFlip` always reads the latest value without stale-closure issues. Minimum clamped to `frontH`.
- **Flip trigger placement**: the flip `Pressable` must only cover the photo zone on the front face, and the entire back face. Never wrap the whole card in a single `Pressable` — it blocks inner button touches (share, publish).
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

- **Share count**: Track and display how many times a card has been shared/received
- **Filter**: Filter cards on home screen (by status, date, etc.)
- **Auth**: User authentication for syncing across devices
- **Customization**: Allow users to customize card appearance (colors, fonts, themes)
- **Animations**: Enhanced card animations (flip, transitions, micro-interactions)
