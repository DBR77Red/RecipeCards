import React, { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecipeData {
  id: string;
  status: 'draft' | 'published';
  title: string;
  creatorName: string;
  photo: string | null;
  servings: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  directions: string[];
  createdAt: string;
  updatedAt: string;
  shareUrl?: string;
  deletedAt?: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:       '#fdf8f0',
  border:   '#e8d5b0',
  amber:    '#d4820a',
  darkText: '#2c1810',
  bodyText: '#5a3e2b',
  white:    '#ffffff',
  crease:   'rgba(212,130,10,0.4)',
};

const CARD_W  = 320;
const CARD_H  = 460;
const PHOTO_H = Math.round(CARD_H * 0.65); // 299
const BOT_H   = CARD_H - PHOTO_H;          // 161
const RADIUS  = 16;
const P       = 1400;

// Back face layout constants
const BACK_HEADER_H = 80;  // approx height of the fixed title/hint header
const CREASE_H      = 40;  // approx height of the crease row (line + button)
const BODY_H        = CARD_H - BACK_HEADER_H; // 380 — fold detection threshold
const CLIP_H        = BODY_H - CREASE_H;      // 340 — main body clip height

// ─── Stat column ─────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value || '—'}</Text>
    </View>
  );
}

// ─── Front face ───────────────────────────────────────────────────────────────

function CardFront({ recipe }: { recipe: RecipeData }) {
  return (
    <View style={styles.face}>
      <View style={styles.photoZone}>
        {recipe.photo ? (
          <Image source={{ uri: recipe.photo }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]} />
        )}

        {/* Faux gradient scrim */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={{ flex: 0.38 }} />
          <View style={{ flex: 0.22, backgroundColor: 'rgba(0,0,0,0.18)' }} />
          <View style={{ flex: 0.22, backgroundColor: 'rgba(0,0,0,0.32)' }} />
          <View style={{ flex: 0.18, backgroundColor: 'rgba(0,0,0,0.50)' }} />
        </View>

        <View style={styles.scrimText} pointerEvents="none">
          <Text style={styles.photoTitle} numberOfLines={2}>{recipe.title}</Text>
          <Text style={styles.photoMeta}>By {recipe.creatorName} · 🔀 —</Text>
        </View>
      </View>

      <View style={styles.bottomZone}>
        <View style={styles.statsRow}>
          <Stat label="Serves" value={recipe.servings} />
          <View style={styles.statDivider} />
          <Stat label="Prep"   value={recipe.prepTime} />
          <View style={styles.statDivider} />
          <Stat label="Cook"   value={recipe.cookTime} />
        </View>
        <Text style={styles.frontHint}>Tap to see recipe details</Text>
      </View>
    </View>
  );
}

// ─── Back content ─────────────────────────────────────────────────────────────

function BackContent({ recipe }: { recipe: RecipeData }) {
  return (
    <View style={styles.backContentInner}>
      <Text style={styles.sectionHeading}>Ingredients</Text>
      {recipe.ingredients.map((ing, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{ing}</Text>
        </View>
      ))}

      <Text style={[styles.sectionHeading, { marginTop: 14 }]}>Instructions</Text>
      {recipe.directions.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <Text style={styles.stepNum}>{i + 1}.</Text>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Card back ────────────────────────────────────────────────────────────────
// Fold state is owned by RecipeCard and passed down so that RecipeCard
// can drive the layout spacer from the same animation values.

interface CardBackProps {
  recipe: RecipeData;
  scrollRef: React.RefObject<ScrollView>;
  contentH: number;
  onContentMeasured: (h: number) => void;
  unfolded: boolean;
  foldAnim: Animated.Value;
  shadowAnim: Animated.Value;
  onToggleFold: () => void;
}

function CardBack({
  recipe,
  scrollRef,
  contentH,
  onContentMeasured,
  unfolded,
  foldAnim,
  shadowAnim,
  onToggleFold,
}: CardBackProps) {
  const measured  = contentH > 0;
  const needsFold = contentH > BODY_H;
  const foldoutH  = Math.max(0, contentH - CLIP_H);
  const half      = foldoutH / 2;

  const onMeasure = (e: LayoutChangeEvent) => {
    if (contentH > 0) return;
    onContentMeasured(e.nativeEvent.layout.height);
  };

  const shadowOpacity = shadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.2] });

  return (
    <View style={styles.face}>
      {/* Fixed header */}
      <View style={styles.backHeader}>
        <Text style={styles.backTitle} numberOfLines={2}>{recipe.title}</Text>
        <Text style={styles.backHint}>Tap to flip back</Text>
      </View>

      {/* Pass 1: hidden measurement view (within card bounds so onLayout fires) */}
      <View style={styles.measureShell} pointerEvents="none">
        <View onLayout={onMeasure}>
          <BackContent recipe={recipe} />
        </View>
      </View>

      {/* Pass 2: display */}
      {measured && (needsFold ? (

        <View style={{ flex: 1 }}>
          {/* Main body clipped at CLIP_H — leaves room for the crease row */}
          <View style={{ height: CLIP_H, overflow: 'hidden' }}>
            <BackContent recipe={recipe} />
          </View>

          {/* Crease: dashed line + pill button */}
          <View style={styles.creaseRow}>
            <View style={styles.creaseLine} />
            <Pressable onPress={onToggleFold} style={styles.foldBtn} hitSlop={8}>
              <Text style={styles.foldBtnText}>{unfolded ? 'Fold ↑' : 'Unfold ↓'}</Text>
            </Pressable>
            <View style={styles.creaseLine} />
          </View>

          {/* Drop shadow under crease when unfolded */}
          <Animated.View
            style={[styles.creaseShadow, { opacity: shadowOpacity }]}
            pointerEvents="none"
          />

          {/*
            Foldout panel.
            Fixed height = foldoutH so translate-scale-translate has stable math.
            overflow:hidden clips the absolutely-positioned child above y=0.
            The child is offset top:-CLIP_H so only the overflow content is visible.
          */}
          <Animated.View
            style={{
              height: foldoutH,
              overflow: 'hidden',
              backgroundColor: C.bg,
              opacity: foldAnim,
              transform: [
                { translateY: -half },
                { scaleY: foldAnim },
                { translateY: half },
              ],
            }}
          >
            <View style={{ position: 'absolute', top: -CLIP_H, left: 0, right: 0 }}>
              <BackContent recipe={recipe} />
            </View>
          </Animated.View>
        </View>

      ) : (

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <BackContent recipe={recipe} />
        </ScrollView>

      ))}
    </View>
  );
}

// ─── Flip + fold wrapper ──────────────────────────────────────────────────────

export function RecipeCard({ recipe }: { recipe: RecipeData }) {
  const [flipped, setFlipped]   = useState(false);
  const flipAnim                = useRef(new Animated.Value(0)).current;
  const backScrollRef           = useRef<ScrollView>(null);

  // Fold state lifted here so we can drive the layout spacer
  const [contentH, setContentH] = useState(0);
  const [unfolded, setUnfolded] = useState(false);
  // foldAnim / shadowAnim: useNativeDriver:true — drives scaleY, opacity, translateY
  const foldAnim   = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;
  // spacerAnim: useNativeDriver:false — drives the layout `height` of the spacer
  // (height is not supported by the native animated module)
  const spacerAnim = useRef(new Animated.Value(0)).current;

  const foldoutH = Math.max(0, contentH - CLIP_H);

  const handleFlip = () => {
    if (!flipped) {
      backScrollRef.current?.scrollTo({ y: 0, animated: false });
    } else if (unfolded) {
      // Collapse foldout instantly when flipping back to front
      setUnfolded(false);
      foldAnim.setValue(0);
      shadowAnim.setValue(0);
      spacerAnim.setValue(0);
    }
    Animated.spring(flipAnim, {
      toValue: flipped ? 0 : 1,
      friction: 7,
      tension: 9,
      useNativeDriver: true,
    }).start();
    setFlipped(f => !f);
  };

  const handleToggleFold = () => {
    const next    = !unfolded;
    const toVal   = next ? 1 : 0;
    const dur     = next ? 350 : 250;
    const easing  = next ? Easing.out(Easing.ease) : Easing.in(Easing.ease);
    setUnfolded(next);
    Animated.parallel([
      // Native driver: transform + opacity on the foldout panel
      Animated.timing(foldAnim, { toValue: toVal, duration: dur, easing, useNativeDriver: true }),
      Animated.timing(shadowAnim, { toValue: toVal, duration: dur, easing, useNativeDriver: true }),
      // JS driver: layout height of the spacer (not supported by native driver)
      Animated.timing(spacerAnim, { toValue: toVal, duration: dur, easing, useNativeDriver: false }),
    ]).start();
  };

  const frontSpin    = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg',    '180deg'] });
  const backSpin     = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg']   });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0.45, 0.55], outputRange: [1, 0], extrapolate: 'clamp' });
  const backOpacity  = flipAnim.interpolate({ inputRange: [0.45, 0.55], outputRange: [0, 1], extrapolate: 'clamp' });

  /*
    Spacer driven by spacerAnim (useNativeDriver:false) — not foldAnim —
    because `height` is a layout property unsupported by the native driver.
    Runs in parallel with foldAnim so visually they stay in sync.
  */
  const spacerHeight = spacerAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, foldoutH],
  });

  return (
    <View>
      <Pressable onPress={handleFlip}>
        <View style={styles.wrapper}>
          {/* Front */}
          <Animated.View style={[styles.faceShell, {
            backfaceVisibility: 'hidden',
            opacity: frontOpacity,
            transform: [{ perspective: P }, { rotateY: frontSpin }],
          }]}>
            <CardFront recipe={recipe} />
          </Animated.View>

          {/* Back — overflow:visible so foldout can extend below card boundary */}
          <Animated.View style={[styles.faceShell, styles.faceShellBack, {
            backfaceVisibility: 'hidden',
            opacity: backOpacity,
            transform: [{ perspective: P }, { rotateY: backSpin }],
          }]}>
            <CardBack
              recipe={recipe}
              scrollRef={backScrollRef}
              contentH={contentH}
              onContentMeasured={setContentH}
              unfolded={unfolded}
              foldAnim={foldAnim}
              shadowAnim={shadowAnim}
              onToggleFold={handleToggleFold}
            />
          </Animated.View>
        </View>
      </Pressable>

      {/*
        Transparent spacer that matches the foldout height.
        Grows/shrinks in sync with the foldout animation, pushing
        the QR code and other siblings in the parent ScrollView downward.
        pointerEvents:none so it never intercepts touches.
      */}
      <Animated.View style={{ height: spacerHeight }} pointerEvents="none" />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Shell ──
  wrapper: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: RADIUS,
    ...Platform.select({
      web: { boxShadow: '0px 20px 40px rgba(0,0,0,0.2)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 40,
        elevation: 20,
      },
    }),
  },
  faceShell: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: C.bg,
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: C.border,
    overflow: 'hidden',
  },
  faceShellBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    // Allow foldout to extend below card boundary
    overflow: 'visible',
  },
  face: {
    flex: 1,
  },

  // ── Front: photo zone ──
  photoZone: {
    width: '100%',
    height: PHOTO_H,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    backgroundColor: '#e0cda8',
  },
  scrimText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  photoTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 19,
    lineHeight: 25,
    color: C.white,
    marginBottom: 4,
  },
  photoMeta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },

  // ── Front: bottom zone ──
  bottomZone: {
    height: BOT_H,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: C.amber,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: C.darkText,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: C.border,
  },
  frontHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    fontStyle: 'italic',
    color: C.amber,
    textAlign: 'center',
  },

  // ── Back: header ──
  backHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 17,
    lineHeight: 23,
    color: C.darkText,
    textAlign: 'center',
    marginBottom: 3,
  },
  backHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    fontStyle: 'italic',
    color: C.amber,
  },

  // ── Back: content ──
  backContentInner: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  sectionHeading: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: C.amber,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.amber,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: C.bodyText,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  stepNum: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: C.amber,
    width: 22,
    flexShrink: 0,
  },
  stepText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: C.bodyText,
  },

  // ── Measurement pass ──
  measureShell: {
    position: 'absolute',
    top: BACK_HEADER_H,
    left: 0,
    right: 0,
    opacity: 0,
  },

  // ── Fold mechanics ──
  creaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  creaseLine: {
    flex: 1,
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.crease,
  },
  foldBtn: {
    backgroundColor: C.amber,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  foldBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: C.white,
  },
  creaseShadow: {
    height: 6,
    ...Platform.select({
      web: { boxShadow: '0px 4px 8px rgba(0,0,0,0.18)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
});
