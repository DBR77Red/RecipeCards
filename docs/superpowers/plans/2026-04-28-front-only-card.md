# Front-Only Card Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the card flip mechanic and display all recipe content (ingredients + directions) on a single scrollable front face.

**Architecture:** The `RecipeCard` component is simplified from a flip-based two-face widget to a plain `View` with stacked sections: photo zone → dark stats/CTA panel → cream recipe content. All flip animation state, the `CardBack` component, and the `RecipeCardRef` interface are deleted. The card height becomes content-driven (no longer fixed at 518px). All callers already wrap the card in a `ScrollView`, so the taller card works without any screen-level layout change beyond the `CardViewScreen` hint text removal.

**Tech Stack:** React Native `View` / `StyleSheet`, `useMemo` hook, existing card palette tokens (`C.*`), existing translation keys `t.cardIngredients` / `t.cardInstructions`.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/RecipeCard.tsx` | Modify | Remove flip; add `RecipeContent` section; simplify wrapper |
| `src/screens/CardViewScreen.tsx` | Modify | Remove deck flip hint text; fix scroll alignment |
| `src/i18n/translations.ts` | Modify | Remove unused `cardTapToFlip` and `deckTapHint` keys from interface + all 4 locales |
| `CLAUDE.md` | Modify | Update RecipeCard Rules; add flip to Parked Features |

---

## Task 1 — Remove Flip Infrastructure from `RecipeCard.tsx`

**Files:**
- Modify: `src/components/RecipeCard.tsx`

- [ ] **Step 1.1: Simplify React and RN imports**

Replace the top two import lines with:

```tsx
import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
```

Removed: `Animated`, `Easing`, `Pressable`, `useImperativeHandle`, `useRef`, `useState`.

- [ ] **Step 1.2: Remove P, CARD_H, CARD_H_PUB constants**

Delete these three lines (keep `CARD_W`, `PHOTO_H`, `RADIUS`):

```
const CARD_H      = 518;
const CARD_H_PUB  = CARD_H;
const P           = 1400;
```

- [ ] **Step 1.3: Delete the entire `CardBack` component**

Delete the block from `// ─── Back face ───` through the closing `}` of `CardBack` (approximately lines 178–217 in the original file). This is the entire `function CardBack(...)` definition.

- [ ] **Step 1.4: Delete `RecipeCardRef` interface**

Delete:
```tsx
export interface RecipeCardRef {
  flip: () => void;
}
```

- [ ] **Step 1.5: Replace `RecipeCard` forwardRef wrapper with a plain function**

Replace the entire `RecipeCard` export (from `export const RecipeCard = React.forwardRef<...>` through the closing `});`) with:

```tsx
export function RecipeCard({ recipe, onShare, onPublish, publishing }: {
  recipe: RecipeData;
  onShare?: () => void;
  onPublish?: () => void;
  publishing?: boolean;
}) {
  return (
    <View style={styles.wrapper}>
      <CardFront recipe={recipe} onShare={onShare} onPublish={onPublish} publishing={publishing} />
    </View>
  );
}
```

- [ ] **Step 1.6: Commit**

```bash
git add src/components/RecipeCard.tsx
git commit -m "refactor(card): remove flip mechanic and CardBack component"
```

---

## Task 2 — Update `CardFront` and Add `RecipeContent` Section

**Files:**
- Modify: `src/components/RecipeCard.tsx`

- [ ] **Step 2.1: Remove `onFlip` from `CardFront` props**

Change the `CardFront` props interface from:

```tsx
function CardFront({
  recipe, onFlip, onShare, onPublish, publishing,
}: {
  recipe: RecipeData;
  onFlip: () => void;
  onShare?: () => void;
  onPublish?: () => void;
  publishing?: boolean;
})
```

To:

```tsx
function CardFront({
  recipe, onShare, onPublish, publishing,
}: {
  recipe: RecipeData;
  onShare?: () => void;
  onPublish?: () => void;
  publishing?: boolean;
})
```

- [ ] **Step 2.2: Change the outer `Pressable` to a `View` and remove `onFlip` call**

The return in `CardFront` currently starts with `<Pressable onPress={onFlip} style={styles.face}>`. Change to:

```tsx
return (
  <View>
    {/* Photo zone */}
    <View style={styles.photoZone}>
```

And close with `</View>` instead of `</Pressable>`. Remove `style={styles.face}` — no style needed on this wrapper View.

Also remove the comment `{/* Photo zone — plain View; parent Pressable handles flip */}` and replace it with `{/* Photo zone */}`.

Remove the comment `{/* Bottom zone — plain View; share/publish button absorbs its own touch */}` and replace it with `{/* Bottom zone */}`.

- [ ] **Step 2.3: Add the `RecipeContent` sub-component**

Add this new function directly above `CardFront` (after the `Stat` component):

```tsx
function RecipeContent({ recipe }: { recipe: RecipeData }) {
  const { t } = useLanguage();
  const ingredients = recipe.ingredients.filter(i => i.trim());
  const directions  = recipe.directions.filter(s => s.trim());
  if (ingredients.length === 0 && directions.length === 0) return null;
  return (
    <View style={styles.recipeContent}>
      {ingredients.length > 0 && (
        <>
          <Text style={styles.sectionHeading}>{t.cardIngredients}</Text>
          {ingredients.map((ing, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{ing}</Text>
            </View>
          ))}
        </>
      )}
      {directions.length > 0 && (
        <>
          <Text style={[styles.sectionHeading, ingredients.length > 0 && { marginTop: 14 }]}>
            {t.cardInstructions}
          </Text>
          {directions.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Text style={styles.stepNum}>{i + 1}.</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}
```

- [ ] **Step 2.4: Add `<RecipeContent>` at the bottom of `CardFront`'s return**

Inside `CardFront`'s return, after the closing `</View>` of `bottomZone` and before the outer closing `</View>`, add:

```tsx
      <RecipeContent recipe={recipe} />
```

- [ ] **Step 2.5: Commit**

```bash
git add src/components/RecipeCard.tsx
git commit -m "feat(card): display ingredients and directions on card front"
```

---

## Task 3 — Update Styles in `RecipeCard.tsx`

**Files:**
- Modify: `src/components/RecipeCard.tsx`

- [ ] **Step 3.1: Update `wrapper` style**

The current `wrapper` style has `height: cardHeight` (which was dynamic state). Replace the entire `wrapper` style with:

```tsx
wrapper: {
  width: CARD_W,
  borderRadius: RADIUS,
  borderWidth: 1.5,
  borderColor: C.border,
  backgroundColor: C.bg,
  overflow: 'hidden',
  ...Platform.select({
    web: { boxShadow: '0px 32px 64px rgba(28,10,0,0.35)' },
    default: {
      shadowColor: '#1C0A00',
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 0.30,
      shadowRadius: 48,
      elevation: 24,
    },
  }),
},
```

The border, backgroundColor, and overflow previously lived on `faceShell`; they now move to `wrapper`.

- [ ] **Step 3.2: Remove `faceShell`, `faceShellBack`, and `face` style entries**

Delete these three entries from the `StyleSheet.create({...})` block:

```
faceShell: { ... },   // ~12 lines
faceShellBack: { ... }, // ~11 lines
face: { flex: 1 },
```

- [ ] **Step 3.3: Update `bottomZone` style**

The current `bottomZone` has `flex: 1` and `justifyContent: 'center'` which relied on a fixed-height parent. Remove those two properties and remove `gap: 0`. The new style:

```tsx
bottomZone: {
  backgroundColor: C.panel,
  borderTopWidth: 2,
  borderTopColor: C.panelAmber,
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingTop: 14,
  paddingBottom: 18,
},
```

- [ ] **Step 3.4: Add `recipeContent` style**

Add this new entry to the StyleSheet (after `ctaBtnOutlineText`):

```tsx
recipeContent: {
  paddingHorizontal: 20,
  paddingTop: 16,
  paddingBottom: 24,
},
```

- [ ] **Step 3.5: Remove back-face style entries**

Delete these entries from the StyleSheet:

```
backHeader: { ... },      // ~8 lines
backTitle: { ... },       // ~9 lines
backHint: { ... },        // ~6 lines
backContentInner: { ... }, // ~5 lines
```

Keep: `sectionHeading`, `bulletRow`, `bulletDot`, `bulletText`, `stepRow`, `stepNum`, `stepText` — these are reused by `RecipeContent`.

- [ ] **Step 3.6: Verify the app builds without errors**

Run: `npx expo start` and check the Metro bundler output for TypeScript errors. Expected: no errors, app starts.

- [ ] **Step 3.7: Commit**

```bash
git add src/components/RecipeCard.tsx
git commit -m "style(card): update styles for single-face layout"
```

---

## Task 4 — Update `CardViewScreen.tsx`

**Files:**
- Modify: `src/screens/CardViewScreen.tsx`

- [ ] **Step 4.1: Remove the deck-mode flip hint text**

In the deck-mode branch (inside `<GestureDetector>`), find and delete this line:

```tsx
<Text style={styles.hintText}>{t.deckTapHint}</Text>
```

- [ ] **Step 4.2: Fix scroll alignment**

The `scrollContent` style currently has `justifyContent: 'center'`. With a taller card, centering vertically looks wrong. Change it to:

```tsx
scrollContent: {
  flexGrow: 1,
  alignItems: 'center',
  paddingVertical: 24,
  paddingBottom: 48,
},
```

(Remove `justifyContent: 'center'` — flexGrow+alignItems keeps the card horizontally centered while top-aligning vertically.)

- [ ] **Step 4.3: Remove the `hintText` style entry**

Delete from the StyleSheet:

```
hintText: {
  fontFamily: 'DMSans_400Regular',
  fontSize: 12,
  color: 'rgba(255,255,255,0.18)',
  letterSpacing: 0.3,
  marginTop: 16,
},
```

- [ ] **Step 4.4: Commit**

```bash
git add src/screens/CardViewScreen.tsx
git commit -m "fix(card-view): remove flip hint, fix scroll alignment"
```

---

## Task 5 — Clean Up Translation Keys

**Files:**
- Modify: `src/i18n/translations.ts`

- [ ] **Step 5.1: Remove keys from the `Translations` interface**

In `src/i18n/translations.ts`, find the `Translations` interface and delete these two lines:

```ts
cardTapToFlip: string;
deckTapHint: string;
```

- [ ] **Step 5.2: Remove keys from all locale objects**

For every locale object in the file (EN, PT, DE, and any additional locales like ES), find and delete the corresponding key-value pairs:

```ts
cardTapToFlip: '...',
deckTapHint: '...',
```

Each locale will have exactly one instance of each key. The grep output confirms they appear at approximately lines 363, 544, 725, 906 in the original file — search for `cardTapToFlip` to locate each one.

- [ ] **Step 5.3: Run the translations test**

```bash
npx jest src/__tests__/translations.test.ts --no-coverage
```

Expected output:
```
PASS src/__tests__/translations.test.ts
All test suites passed.
```

If the test fails with "has extra keys not in Translations interface", a locale still has one of the removed keys — find and delete it.

- [ ] **Step 5.4: Run all tests**

```bash
npx jest src/__tests__ --no-coverage
```

Expected: all test suites pass.

- [ ] **Step 5.5: Commit**

```bash
git add src/i18n/translations.ts
git commit -m "chore: remove unused cardTapToFlip and deckTapHint translation keys"
```

---

## Task 6 — Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 6.1: Update the RecipeCard Rules section**

Find the `## RecipeCard Rules` section and replace its content with:

```markdown
## RecipeCard Rules

- Card width: always `CARD_W = 320`
- Card height: content-driven — photo zone (384px) + stats/CTA panel (fixed padding) + recipe content (grows with ingredients/directions list). No fixed height constant.
- **Layout**: single face — photo zone with gradient scrim (title/creator overlay) → dark espresso stats+CTA panel → cream recipe content (ingredients + directions). No flip.
- The recipe content section (`RecipeContent` sub-component) renders `null` when both `ingredients` and `directions` are empty (draft with no content yet).
- Stats/CTA panel (`bottomZone`) uses explicit padding rather than `flex: 1` — height is self-contained.
- **No `Pressable` on the card** — the card itself is not interactive. Action buttons (Share, Publish) inside the bottom panel absorb their own touches.
```

- [ ] **Step 6.2: Add flip mechanic to the Parked Features section**

At the end of the `## Parked Features — Do Not Re-introduce` section, add:

```markdown
- **Card flip mechanic**: The two-face flip animation was removed and replaced with a single scrollable front face that shows all content. All flip state, animation, and the `CardBack` component have been deleted. Do not re-introduce the flip mechanic.
```

- [ ] **Step 6.3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for front-only card layout"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Flip mechanic removed — `CardBack`, all animation state, `RecipeCardRef`, `handleFlip` deleted
- ✅ Ingredients shown on front — `RecipeContent` component added
- ✅ Directions shown on front — `RecipeContent` component added
- ✅ Empty state handled — `RecipeContent` returns `null` when both lists are empty
- ✅ Existing data unaffected — `RecipeData` shape unchanged, storage/Supabase untouched
- ✅ All callers work — `PreviewScreen` and `CardViewScreen` both use `ScrollView`, card height auto-grows
- ✅ Tests stay green — translations test passes after key removal
- ✅ `CardViewScreen` scroll alignment fixed — `justifyContent: 'center'` removed

**Placeholder scan:** No TBD/TODO/similar references found.

**Type consistency:**
- `RecipeContent` takes `{ recipe: RecipeData }` — matches the `RecipeData` type defined in the same file
- `CardFront` no longer takes `onFlip` — `RecipeCard` no longer passes it
- `RecipeCard` export is a plain function, not `forwardRef` — no callers used the ref anyway
