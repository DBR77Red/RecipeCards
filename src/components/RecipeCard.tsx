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
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  card:       '#F7F5F2',
  photoBg:    '#DDD9D3',
  photoMark:  'rgba(0,0,0,0.10)',
  title:      '#1C1917',
  body:       '#44403C',
  muted:      '#78716C',
  label:      '#A8A29E',
  divider:    '#E7E5E4',
  terracotta: '#B45A3C',
  sage:       '#4F7A64',
  circleBase: '#1C1917',
  circleText: '#F7F5F2',
};

const CARD_W  = 340;
const CARD_H  = 580;
const PHOTO_H = 280;
const RADIUS  = 18;

// ─── Photo area ───────────────────────────────────────────────────────────────

function PhotoArea({ uri }: { uri: string | null }) {
  if (uri) {
    return (
      <Image source={{ uri }} style={styles.photoArea} resizeMode="cover" />
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

// ─── Section with accent bar ──────────────────────────────────────────────────

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
      <PhotoArea uri={recipe.photo} />
      <View style={styles.photoDivider} />

      <View style={styles.frontContent}>
        <View>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <Text style={styles.creator}>
            {recipe.creatorName.toUpperCase()}
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

      <Text style={styles.flipHint}>tap to flip  ↺</Text>
    </View>
  );
}

// ─── Back face ────────────────────────────────────────────────────────────────

function CardBack({ recipe }: { recipe: RecipeData }) {
  return (
    <View style={styles.face}>
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
          {recipe.directions.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepCircleNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Section>
      </View>

      <Text style={styles.flipHint}>tap to flip  ↺</Text>
    </View>
  );
}

// ─── Flip wrapper ─────────────────────────────────────────────────────────────

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
  wrapper: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: RADIUS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.22,
    shadowRadius: 48,
    elevation: 24,
  },
  faceShell: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: C.card,
    borderRadius: RADIUS,
    overflow: 'hidden',
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
  face: {
    flex: 1,
    flexDirection: 'column',
  },
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
