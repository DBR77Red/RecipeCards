import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// LayoutAnimation requires this flag on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
};

const CARD_W      = 320;
const CARD_H      = 460;
const CARD_H_PUB  = 720; // published front: photo + stats + QR 148 + label + share btn
const PHOTO_H     = Math.round(CARD_H * 0.65); // 299
const RADIUS      = 16;
const P           = 1400;

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

function CardFront({ recipe, onShare }: { recipe: RecipeData; onShare?: () => void }) {
  const shareUrl = recipe.shareUrl ?? `recipecards://card/${recipe.id}`;
  const published = recipe.status === 'published';

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

      <View style={[styles.bottomZone, published && styles.bottomZonePub]}>
        <View style={styles.statsRow}>
          <Stat label="Serves" value={recipe.servings} />
          <View style={styles.statDivider} />
          <Stat label="Prep"   value={recipe.prepTime} />
          <View style={styles.statDivider} />
          <Stat label="Cook"   value={recipe.cookTime} />
        </View>

        {published ? (
          <>
            <View style={styles.qrDivider} />
            <View style={styles.qrCenter}>
              <View style={styles.qrBox}>
                <QRCode value={shareUrl} size={148} />
              </View>
              <Text style={styles.qrLabel}>Scan to receive this recipe</Text>
              <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
                <Text style={styles.shareBtnText}>Share Recipe</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.frontHint}>Tap to see recipe details</Text>
        )}
      </View>
    </View>
  );
}

// ─── Back face ────────────────────────────────────────────────────────────────

function CardBack({ recipe, onMeasured }: { recipe: RecipeData; onMeasured: (h: number) => void }) {
  return (
    <View onLayout={e => onMeasured(e.nativeEvent.layout.height)}>
      {/* Header */}
      <View style={styles.backHeader}>
        <Text style={styles.backTitle} numberOfLines={2}>{recipe.title}</Text>
        <Text style={styles.backHint}>Tap to flip back</Text>
      </View>

      {/* Content — fully expanded, no clipping */}
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
    </View>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

export function RecipeCard({ recipe, onShare }: { recipe: RecipeData; onShare?: () => void }) {
  const frontH = recipe.status === 'published' ? CARD_H_PUB : CARD_H;

  const [flipped,    setFlipped]    = useState(false);
  const [cardHeight, setCardHeight] = useState(frontH);
  const flipAnim                    = useRef(new Animated.Value(0)).current;
  // Ref so handleFlip always reads the latest measured value,
  // even if the React state update hasn't flushed yet.
  const backHRef                    = useRef(CARD_H);

  // When recipe is published while the front is showing, expand the card
  useEffect(() => {
    if (!flipped) {
      LayoutAnimation.configureNext({
        duration: 300,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
      setCardHeight(frontH);
    }
  }, [recipe.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMeasured = (h: number) => {
    backHRef.current = h;
    if (flipped) setCardHeight(h);
  };

  const handleFlip = () => {
    const toBack = !flipped;
    setCardHeight(toBack ? backHRef.current : frontH);
    setFlipped(toBack);

    Animated.spring(flipAnim, {
      toValue:         toBack ? 1 : 0,
      friction:        7,
      tension:         9,
      useNativeDriver: true,
    }).start();
  };

  const frontSpin    = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg',    '180deg'] });
  const backSpin     = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg']   });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0.45, 0.55], outputRange: [1, 0], extrapolate: 'clamp' });
  const backOpacity  = flipAnim.interpolate({ inputRange: [0.45, 0.55], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={[styles.wrapper, { height: cardHeight }]}>
      <Pressable onPress={handleFlip} style={StyleSheet.absoluteFill}>
        {/* Front face */}
        <Animated.View style={[styles.faceShell, {
          height: frontH,
          backfaceVisibility: 'hidden',
          opacity:   frontOpacity,
          transform: [{ perspective: P }, { rotateY: frontSpin }],
        }]}>
          <CardFront recipe={recipe} onShare={onShare} />
        </Animated.View>

        {/* Back face — height matches content */}
        <Animated.View style={[styles.faceShellBack, {
          height: backHRef.current,
          backfaceVisibility: 'hidden',
          opacity:   backOpacity,
          transform: [{ perspective: P }, { rotateY: backSpin }],
        }]}>
          <CardBack recipe={recipe} onMeasured={handleMeasured} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Shell ──
  wrapper: {
    width: CARD_W,
    // height is animated — no static value here
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
    position: 'absolute',
    top: 0,
    left: 0,
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
    width: CARD_W,
    backgroundColor: C.bg,
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: C.border,
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
    flex: 1,
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
  bottomZonePub: {
    justifyContent: 'flex-start',
    gap: 16,
  },
  qrDivider: {
    width: '100%',
    height: 1,
    backgroundColor: C.border,
  },
  qrCenter: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  qrBox: {
    padding: 14,
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  qrLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    letterSpacing: 0.3,
    color: C.bodyText,
    textAlign: 'center',
  },
  shareBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  shareBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: C.amber,
    letterSpacing: 0.3,
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
    paddingBottom: 20,
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
});
