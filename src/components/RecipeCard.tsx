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
import QRCode from 'react-native-qrcode-svg';
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
  panelDiv:   'rgba(255,255,255,0.08)', // divider on dark
};

const CARD_W      = 320;
const CARD_H      = 460;
const CARD_H_PUB  = 760; // published front: photo + stats + QR + label + share btn
const PHOTO_H     = 445; // golden ratio split — photo dominant at 58% of card height
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
    <View style={styles.face}>
      {/* Flip target: only the photo zone — keeps buttons below free from conflicts */}
      <Pressable onPress={onFlip} style={styles.photoZone}>
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
      </Pressable>

      <Pressable style={[styles.bottomZone, published && styles.bottomZonePub]} onPress={onFlip}>
        <View style={styles.statsRow}>
          <Stat label={t.cardServes} value={recipe.servings} />
          <View style={styles.statDivider} />
          <Stat label={t.cardPrep}   value={recipe.prepTime ? recipe.prepTime.replace(/\D/g, '') + ' min' : ''} />
          <View style={styles.statDivider} />
          <Stat label={t.cardCook}   value={recipe.cookTime ? recipe.cookTime.replace(/\D/g, '') + ' min' : ''} />
        </View>

        <View style={styles.qrDivider} />

        {published ? (
          <View style={styles.qrCenter}>
            <View style={styles.qrBox}>
              <QRCode value={shareUrl} size={110} />
            </View>
            <Text style={styles.qrLabel}>{t.cardScanHint}</Text>
            <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                <Circle cx="9" cy="7" r="3" stroke={C.amber} strokeWidth="1.8" />
                <Path d="M3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1" stroke={C.amber} strokeWidth="1.8" strokeLinecap="round" />
                <Circle cx="18" cy="8" r="2.2" stroke={C.amber} strokeWidth="1.8" />
                <Path d="M21 21v-.5a4.5 4.5 0 0 0-3-4.24" stroke={C.amber} strokeWidth="1.8" strokeLinecap="round" />
              </Svg>
              <Text style={styles.shareBtnText}>{t.cardShareBtn}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.qrCenter}>
            <View style={styles.publishPlaceholder}>
              <Text style={styles.publishPlaceholderIcon}>✦</Text>
            </View>
            <Text style={styles.publishTitle}>{t.cardReadyToShare}</Text>
            <Text style={styles.qrLabel}>{t.cardPublishHint}</Text>
            <TouchableOpacity
              style={[styles.shareBtn, styles.publishBtn, publishing && styles.publishBtnDisabled]}
              onPress={onPublish}
              disabled={publishing}
            >
              <Text style={styles.publishBtnText}>
                {publishing ? t.cardPublishing : t.cardPublishBtn}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Pressable>
    </View>
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

      {/* Content — fully expanded, no clipping */}
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
      friction:        7,
      tension:         9,
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
    paddingBottom: 14,
    zIndex: 1,
  },
  photoTitle: {
    fontFamily: 'Poppins_700Bold',
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 8,
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
  frontHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    fontStyle: 'italic',
    color: C.panelAmber,
    textAlign: 'center',
  },
  bottomZonePub: {
    gap: 10,
  },
  qrDivider: {
    width: '100%',
    height: 1,
    backgroundColor: C.panelDiv,
  },
  qrCenter: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  qrBox: {
    padding: 10,
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  qrLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    letterSpacing: 0.3,
    color: C.panelMuted,
    textAlign: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,120,10,0.4)',
    backgroundColor: 'rgba(212,120,10,0.1)',
    marginBottom: 8,
  },
  shareBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: C.panelAmber,
    letterSpacing: 0.3,
  },
  publishPlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,120,10,0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(212,120,10,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishPlaceholderIcon: {
    fontSize: 28,
    color: C.panelAmber,
  },
  publishTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: C.panelText,
    textAlign: 'center',
  },
  publishBtn: {
    backgroundColor: '#E8521A',
    borderColor: '#E8521A',
  },
  publishBtnDisabled: {
    opacity: 0.5,
  },
  publishBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: C.white,
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
    fontFamily: 'Poppins_700Bold',
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
