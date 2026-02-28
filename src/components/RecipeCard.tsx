import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecipeData {
  title: string;
  creator: string;
  photo?: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  ingredients: string[];
  steps: string[];
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  // Card
  card:         '#F7F5F2',   // warm off-white
  photoBg:      '#DDD9D3',   // muted warm gray
  photoMark:    'rgba(0,0,0,0.10)',

  // Typography
  title:        '#1C1917',   // near-black, warm
  body:         '#44403C',   // warm dark gray
  muted:        '#78716C',   // stone-500
  label:        '#A8A29E',   // stone-400
  divider:      '#E7E5E4',   // stone-200

  // Accent colors for section labels
  terracotta:   '#B45A3C',   // warm earthy red — Ingredients
  sage:         '#4F7A64',   // deep sage green — Directions

  // Step number circles
  circleBase:   '#1C1917',
  circleText:   '#F7F5F2',
};

const CARD_W  = 340;
const CARD_H  = 580;
const PHOTO_H = 280;
const RADIUS  = 18;

// ─── Photo placeholder ────────────────────────────────────────────────────────

function PhotoArea({ uri }: { uri?: string }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={styles.photoArea}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={styles.photoArea}>
      <View style={styles.guideRing}>
        <View style={styles.guideDot} />
      </View>
    </View>
  );
}

// ─── Section with colored accent bar ─────────────────────────────────────────

function Section({
  label,
  accent,
  children,
}: {
  label: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { borderLeftColor: accent }]}>
        <Text style={[styles.sectionLabel, { color: accent }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Front face ───────────────────────────────────────────────────────────────

function CardFront({ recipe }: { recipe: RecipeData }) {
  return (
    <View style={styles.face}>
      {/* Full-bleed photo — no margin, clips to card's top border-radius */}
      <PhotoArea uri={recipe.photo} />

      {/* 1 px hairline divider separating photo from text */}
      <View style={styles.photoDivider} />

      {/* Text content — flex:1 with space-between to anchor meta to bottom */}
      <View style={styles.frontContent}>
        <View>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <Text style={styles.creator}>
            {recipe.creator.toUpperCase()}
          </Text>
        </View>

        <View>
          <View style={styles.hairline} />
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{recipe.servings} servings</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>{recipe.prepTime} prep</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>{recipe.cookTime} cook</Text>
          </View>
        </View>
      </View>

      {/* Pinned to bottom in normal flow — never overlaps */}
      <Text style={styles.flipHint}>tap to flip  ↺</Text>
    </View>
  );
}

// ─── Back face ────────────────────────────────────────────────────────────────

function CardBack({ recipe }: { recipe: RecipeData }) {
  return (
    <View style={styles.face}>
      {/* Scrollable content area clipped so it can never reach the flip hint */}
      <View style={styles.backInner}>
        <Text style={styles.backTitle} numberOfLines={2}>
          {recipe.title}
        </Text>

        <Section label="INGREDIENTS" accent={C.terracotta}>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <View style={styles.ingredientDot} />
              <Text style={styles.ingredientText}>{ing}</Text>
            </View>
          ))}
        </Section>

        <Section label="DIRECTIONS" accent={C.sage}>
          {recipe.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepCircleNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Section>
      </View>

      {/* Pinned to bottom in normal flow */}
      <Text style={styles.flipHint}>tap to flip  ↺</Text>
    </View>
  );
}

// ─── Animated flip card ───────────────────────────────────────────────────────

export function RecipeCard({ recipe }: { recipe: RecipeData }) {
  const [flipped, setFlipped] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const handleFlip = () => {
    Animated.spring(anim, {
      toValue: flipped ? 0 : 1,
      friction: 7,
      tension: 9,
      useNativeDriver: true,
    }).start();
    setFlipped(f => !f);
  };

  const frontSpin    = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg',    '180deg'] });
  const backSpin     = anim.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg']   });
  const frontOpacity = anim.interpolate({ inputRange: [0.45, 0.55], outputRange: [1, 0], extrapolate: 'clamp' });
  const backOpacity  = anim.interpolate({ inputRange: [0.45, 0.55], outputRange: [0, 1], extrapolate: 'clamp' });

  const P = 1400;

  return (
    <TouchableWithoutFeedback onPress={handleFlip}>
      {/*
        Wrapper carries the layered shadow — no overflow:hidden here
        so the shadow isn't clipped. Each face handles its own clipping.
      */}
      <View style={styles.wrapper}>
        <Animated.View style={[styles.faceShell, {
          backfaceVisibility: 'hidden',
          opacity: frontOpacity,
          transform: [{ perspective: P }, { rotateY: frontSpin }],
        }]}>
          <CardFront recipe={recipe} />
        </Animated.View>

        <Animated.View style={[styles.faceShell, styles.faceShellBack, {
          backfaceVisibility: 'hidden',
          opacity: backOpacity,
          transform: [{ perspective: P }, { rotateY: backSpin }],
        }]}>
          <CardBack recipe={recipe} />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // ── Outer shell — carries the layered shadow ────────────────────────────────

  wrapper: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: RADIUS,
    // Primary shadow: deep ambient lift
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.22,
    shadowRadius: 48,
    elevation: 24,
  },

  // ── Each face — clips content to card shape ─────────────────────────────────

  faceShell: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: C.card,
    borderRadius: RADIUS,
    overflow: 'hidden',
    // Secondary shadow: tight contact shadow for physicality
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  faceShellBack: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // Face inner layout (flex column)
  face: {
    flex: 1,
    flexDirection: 'column',
  },

  // ── Photo area ──────────────────────────────────────────────────────────────

  photoArea: {
    width: '100%',
    height: PHOTO_H,
    backgroundColor: C.photoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  guideRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: C.photoMark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  guideDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.photoMark,
  },

  photoDivider: {
    height: 1,
    backgroundColor: C.divider,
  },

  // ── Front content ───────────────────────────────────────────────────────────

  frontContent: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 20,
    paddingBottom: 6,
    justifyContent: 'space-between',
  },

  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    lineHeight: 33,
    color: C.title,
    letterSpacing: -0.3,
    marginBottom: 6,
  },

  creator: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 9,
    letterSpacing: 2.5,
    color: C.muted,
  },

  hairline: {
    height: 1,
    backgroundColor: C.divider,
    marginBottom: 12,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  metaText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: C.muted,
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.label,
  },

  // ── Back content ────────────────────────────────────────────────────────────

  // Clips at the boundary so content never bleeds into the flip hint area
  backInner: {
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 8,
  },

  backTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 19,
    lineHeight: 25,
    color: C.title,
    letterSpacing: -0.2,
    marginBottom: 22,
  },

  // Section
  section: {
    marginBottom: 20,
  },

  sectionHeader: {
    borderLeftWidth: 2.5,
    paddingLeft: 8,
    marginBottom: 12,
  },

  sectionLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    letterSpacing: 3,
  },

  // Ingredients
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
    gap: 10,
  },

  ingredientDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.label,
    marginTop: 9,
    flexShrink: 0,
  },

  ingredientText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 22,
    color: C.body,
  },

  // Steps
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
    gap: 10,
  },

  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.circleBase,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },

  stepCircleNum: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9.5,
    color: C.circleText,
    lineHeight: 12,
  },

  stepText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 22,
    color: C.body,
  },

  // ── Flip hint — always last child, sits in normal flow ──────────────────────

  flipHint: {
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: C.label,
    paddingTop: 10,
    paddingBottom: 16,
  },
});
