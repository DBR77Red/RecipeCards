import React, { useImperativeHandle, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';

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
  isReceived?: boolean;
  sourceCardId?: string;  // original Supabase card ID — set on received cards for deduplication
  isFavorite?: boolean;
  receiveCount?: number;
  cloudSyncStatus?: 'synced' | 'pending' | 'failed';
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:         '#F5EDD9',   // parchment cream — photo zone & back face
  border:     '#E8D8B8',   // warm beige border
  amber:      '#D4780A',   // amber accent labels
  darkText:   '#1C0A00',   // deep warm black
  bodyText:   '#4A2D1A',   // warm brown body
  white:      '#FFFFFF',
  panel:      '#1C0F06',   // espresso dark — bottom zone
  panelAmber: '#D4780A',   // amber on dark
  panelText:  '#F5EDD9',   // parchment on dark
  panelMuted: '#C4A882',   // muted on dark
  panelDiv:   'rgba(255,255,255,0.15)', // divider on dark
};

const CARD_W      = 320;
const CARD_H      = 518; // golden ratio: 320 × 1.618 = 517.8
const CARD_H_PUB  = CARD_H; // both states same height — no layout shift on publish
const PHOTO_H     = 384; // photo dominant at 74% of card height
const RADIUS      = 16;
const P           = 1400;

// ─── Stat column ─────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{label}</Text>
      <Text style={styles.statValue}>{value || '—'}</Text>
    </View>
  );
}

// ─── Front face ───────────────────────────────────────────────────────────────

function CardFront({
  recipe, onFlip, onShare, onPublish, publishing,
}: {
  recipe: RecipeData;
  onFlip: () => void;
  onShare?: () => void;
  onPublish?: () => void;
  publishing?: boolean;
}) {
  const { t } = useLanguage();
  const shareUrl = recipe.shareUrl ?? `recipecards://card/${recipe.id}`;
  const published = recipe.status === 'published';

  return (
    <Pressable onPress={onFlip} style={styles.face}>
      {/* Photo zone — plain View; parent Pressable handles flip */}
      <View style={styles.photoZone}>
        {recipe.photo ? (
          <Image source={{ uri: recipe.photo }} style={styles.photo} resizeMode="cover" />
        ) : (
          <Image
            source={require('../../assets/placeholder.jpg')}
            style={[styles.photo, styles.photoPlaceholder]}
            resizeMode="cover"
          />
        )}

        {/* Gradient scrim */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id="scrimGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="black" stopOpacity={0} />
              <Stop offset="55%" stopColor="black" stopOpacity={0} />
              <Stop offset="72%" stopColor="black" stopOpacity={0.25} />
              <Stop offset="88%" stopColor="black" stopOpacity={0.5} />
              <Stop offset="100%" stopColor="black" stopOpacity={0.72} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrimGradient)" />
        </Svg>

        <View style={styles.scrimText} pointerEvents="none">
          <Text style={styles.photoTitle} numberOfLines={2}>{recipe.title}</Text>
          <View style={styles.photoMetaRow}>
            <Text style={styles.photoMeta}>{t.cardBy} {recipe.creatorName}</Text>
            <View style={styles.photoMetaCount}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
                <Circle cx="9" cy="7" r="3" stroke="#ffffff" strokeWidth="2" />
                <Path d="M3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <Circle cx="18" cy="8" r="2.2" stroke="#ffffff" strokeWidth="2" />
                <Path d="M21 21v-.5a4.5 4.5 0 0 0-3-4.24" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              </Svg>
              <Text style={styles.photoMetaCountText}>{recipe.receiveCount ?? 0}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom zone — plain View; share/publish button absorbs its own touch */}
      <View style={styles.bottomZone}>
        <View style={styles.statsRow}>
          <Stat label={t.cardServes} value={recipe.servings} />
          <View style={styles.statDivider} />
          <Stat label={t.cardPrep}   value={recipe.prepTime ? recipe.prepTime.replace(/\D/g, '') + ' ' + t.cardMinSuffix : ''} />
          <View style={styles.statDivider} />
          <Stat label={t.cardCook}   value={recipe.cookTime ? recipe.cookTime.replace(/\D/g, '') + ' ' + t.cardMinSuffix : ''} />
        </View>

        <View style={styles.ctaDivider} />

        {published ? (
          <TouchableOpacity style={styles.ctaBtnOutline} onPress={onShare} activeOpacity={0.8}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" style={{ marginRight: 7 }}>
              <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke={C.panelAmber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M16 6l-4-4-4 4" stroke={C.panelAmber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M12 2v13" stroke={C.panelAmber} strokeWidth="2" strokeLinecap="round" />
            </Svg>
            <Text style={styles.ctaBtnOutlineText}>{t.cardShareBtn}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ctaBtn, publishing && styles.ctaBtnDisabled]}
            onPress={onPublish}
            disabled={publishing}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>
              {publishing ? t.cardPublishing : t.cardPublishBtn}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}

// ─── Back face ────────────────────────────────────────────────────────────────

function CardBack({ recipe, onFlip, onMeasured }: {
  recipe: RecipeData;
  onFlip: () => void;
  onMeasured: (h: number) => void;
}) {
  const { t } = useLanguage();

  return (
    <Pressable onPress={onFlip} onLayout={e => onMeasured(e.nativeEvent.layout.height)}>
      {/* Header */}
      <View style={styles.backHeader}>
        <Text style={styles.backTitle} numberOfLines={2}>{recipe.title}</Text>
        <Text style={styles.backHint}>{t.cardTapToFlip}</Text>
      </View>

      {/* Content */}
      <View style={styles.backContentInner}>
        <Text style={styles.sectionHeading}>{t.cardIngredients}</Text>
        {recipe.ingredients.filter(ing => ing.trim()).map((ing, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{ing}</Text>
          </View>
        ))}

        <Text style={[styles.sectionHeading, { marginTop: 14 }]}>{t.cardInstructions}</Text>
        {recipe.directions.filter(step => step.trim()).map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepNum}>{i + 1}.</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

export interface RecipeCardRef {
  flip: () => void;
}

export const RecipeCard = React.forwardRef<RecipeCardRef, {
  recipe: RecipeData;
  onShare?: () => void;
  onPublish?: () => void;
  publishing?: boolean;
}>(function RecipeCard({ recipe, onShare, onPublish, publishing }, ref) {
  const frontH = CARD_H_PUB; // always the same height regardless of status

  const [flipped,    setFlipped]    = useState(false);
  const [cardHeight, setCardHeight] = useState(frontH);
  const flipAnim                    = useRef(new Animated.Value(0)).current;
  // Ref so handleFlip always reads the latest measured value,
  // even if the React state update hasn't flushed yet.
  const backHRef                    = useRef(CARD_H);

  const handleMeasured = (h: number) => {
    backHRef.current = Math.max(h, frontH);
    if (flipped) setCardHeight(backHRef.current);
  };

  const handleFlip = () => {
    const toBack = !flipped;
    setCardHeight(toBack ? backHRef.current : frontH);
    setFlipped(toBack);

    Animated.spring(flipAnim, {
      toValue:         toBack ? 1 : 0,
      friction:        8,
      tension:         50,
      useNativeDriver: true,
    }).start();
  };

  useImperativeHandle(ref, () => ({ flip: handleFlip }));

  const frontSpin    = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg',    '180deg'] });
  const backSpin     = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg']   });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0.45, 0.55], outputRange: [1, 0], extrapolate: 'clamp' });
  const backOpacity  = flipAnim.interpolate({ inputRange: [0.45, 0.55], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={[styles.wrapper, { height: cardHeight }]}>
      {/* Front face */}
      <Animated.View
        pointerEvents={flipped ? 'none' : 'auto'}
        style={[styles.faceShell, {
          height: frontH,
          backfaceVisibility: 'hidden',
          opacity:   frontOpacity,
          transform: [{ perspective: P }, { rotateY: frontSpin }],
        }]}
      >
        <CardFront recipe={recipe} onFlip={handleFlip} onShare={onShare} onPublish={onPublish} publishing={publishing} />
      </Animated.View>

      {/* Back face — height matches content */}
      <Animated.View
        pointerEvents={flipped ? 'auto' : 'none'}
        style={[styles.faceShellBack, {
          height: backHRef.current,
          backfaceVisibility: 'hidden',
          opacity:   backOpacity,
          transform: [{ perspective: P }, { rotateY: backSpin }],
        }]}
      >
        <CardBack recipe={recipe} onFlip={handleFlip} onMeasured={handleMeasured} />
      </Animated.View>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Shell ──
  wrapper: {
    width: CARD_W,
    // height is animated — no static value here
    borderRadius: RADIUS,
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
  faceShell: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_W,
    height: CARD_H,
    backgroundColor: C.bg,
    borderRadius: RADIUS,
    borderWidth: 1.5,
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
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: 'hidden',
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
  },
  scrimText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 18,
    zIndex: 1,
  },
  photoTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontStyle: 'italic',
    fontSize: 21,
    lineHeight: 28,
    color: C.white,
    marginBottom: 4,
  },
  photoMeta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  photoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoMetaCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoMetaCountText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },

  // ── Front: bottom zone (dark espresso panel) ──
  bottomZone: {
    flex: 1,
    backgroundColor: C.panel,
    borderTopWidth: 2,
    borderTopColor: C.panelAmber,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 0,
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
    color: C.panelAmber,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: C.panelText,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: C.panelDiv,
  },
  ctaDivider: {
    width: '100%',
    height: 1,
    backgroundColor: C.panelDiv,
    marginTop: 12,
    marginBottom: 12,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8521A',
    borderRadius: 100,
    height: 54,
    width: '100%',
    shadowColor: '#E8521A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnDisabled: {
    opacity: 0.5,
  },
  ctaBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: C.white,
    letterSpacing: 0.3,
  },
  ctaBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    height: 54,
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(212,120,10,0.5)',
    backgroundColor: 'rgba(212,120,10,0.08)',
  },
  ctaBtnOutlineText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: C.panelAmber,
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
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 25,
    color: C.darkText,
    textAlign: 'center',
    marginBottom: 3,
  },
  backHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    fontStyle: 'italic',
    color: C.bodyText,
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
