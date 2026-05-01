import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { RecipeCard, RecipeData } from '../components/RecipeCard';
import { useLanguage } from '../context/LanguageContext';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Deck'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Card dimensions — match RecipeCard exactly
const CARD_W     = 320;
const CARD_H_PUB = 760;
const RADIUS     = 16;

// Scale the full card to fit the screen with breathing room
const HEADER_FOOTER = 180;
const CARD_SCALE    = Math.min(1, (SCREEN_H - HEADER_FOOTER) / CARD_H_PUB);
const SCALED_W      = CARD_W * CARD_SCALE;
const SCALED_H      = CARD_H_PUB * CARD_SCALE;

// Compensate for transform scaling from center
const SCALE_OFFSET_X = -(CARD_W * (1 - CARD_SCALE)) / 2;
const SCALE_OFFSET_Y = -(CARD_H_PUB * (1 - CARD_SCALE)) / 2;

// Swipe config
const SWIPE_THRESHOLD     = 100;
const SWIPE_VEL_THRESHOLD = 700;
const FLY_DURATION        = 220;

// Palette
const BG_DARK = '#0f0d0b';
const BG_GLOW = '#271e17';
const AMBER   = '#d4820a';
const CREAM   = '#fdf8f0';
const BORDER  = '#e8d5b0';

// ─── Card shell (behind cards for stack depth) ───────────────────────────────

function CardShell() {
  return <View style={shellStyles.shell} />;
}

const shellStyles = StyleSheet.create({
  shell: {
    width: SCALED_W,
    height: SCALED_H,
    borderRadius: RADIUS,
    backgroundColor: CREAM,
    borderWidth: 2,
    borderColor: BORDER,
    ...Platform.select({
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
});

// ─── Dot indicator ───────────────────────────────────────────────────────────

function DotIndicator({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null;

  const MAX = 7;

  if (total <= MAX) {
    return (
      <View style={dotStyles.row}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[dotStyles.dot, i === current && dotStyles.dotActive]} />
        ))}
      </View>
    );
  }

  // Sliding window for large sets
  const half  = Math.floor(MAX / 2);
  let start   = Math.max(0, current - half);
  let end     = start + MAX;
  if (end > total) { end = total; start = Math.max(0, end - MAX); }

  return (
    <View style={dotStyles.row}>
      {start > 0 && <View style={[dotStyles.dot, dotStyles.dotSmall]} />}
      {Array.from({ length: end - start }, (_, i) => {
        const idx  = start + i;
        const dist = Math.abs(idx - current);
        return (
          <View
            key={idx}
            style={[
              dotStyles.dot,
              idx === current && dotStyles.dotActive,
              dist >= 3 && dotStyles.dotSmall,
            ]}
          />
        );
      })}
      {end < total && <View style={[dotStyles.dot, dotStyles.dotSmall]} />}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AMBER,
  },
  dotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
});

// ─── Deck Screen ─────────────────────────────────────────────────────────────

export function DeckScreen({ route, navigation }: Props) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  // Recipes passed directly from HomeScreen — no async delay
  const recipes = route.params.recipes;
  const initialIdx = recipes.findIndex(r => r.id === route.params.startCardId);
  const startIdx = initialIdx >= 0 ? initialIdx : 0;
  const [currentIndex, setCurrentIndex] = useState(startIdx);
  const [behindIndex, setBehindIndex]   = useState(startIdx < recipes.length - 1 ? startIdx + 1 : -1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const topOpacity = useSharedValue(1);
  const canGoNext  = useSharedValue(startIdx < recipes.length - 1);
  const canGoPrev  = useSharedValue(startIdx > 0);

  // Entrance animation
  const entrance = useSharedValue(0);
  useEffect(() => {
    entrance.value = withTiming(1, { duration: 420 });
  }, []);

  // Refs for stable worklet callbacks
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const isFirstLayout = useRef(true);

  useEffect(() => {
    canGoNext.value = currentIndex < recipes.length - 1;
    canGoPrev.value = currentIndex > 0;
  }, [currentIndex, recipes.length]);

  // KEY FIX: After React commits the new currentIndex, the top <RecipeCard>
  // now renders the NEW recipe data. Only now do we reset translateX to 0 and
  // restore opacity to 1. Both shared-value writes are dispatched to the UI
  // thread in the same JS microtask, so Reanimated applies them atomically --
  // the new card appears at center, never the old card.
  useLayoutEffect(() => {
    if (isFirstLayout.current) {
      isFirstLayout.current = false;
      return;
    }
    // Reset position and reveal — dispatched together to UI thread
    translateX.value = 0;
    translateY.value = 0;
    topOpacity.value = 1;
    // Now that the top card is visible, update the behind card to the real next recipe.
    // This triggers another render, but the top card already covers the behind slot.
    setBehindIndex(currentIndex < recipes.length - 1 ? currentIndex + 1 : -1);
  }, [currentIndex]);

  // ── Callbacks ──

  const handleSwipeComplete = useCallback((dir: 'next' | 'prev') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const delta = dir === 'next' ? 1 : -1;
    const newIdx = currentIndexRef.current + delta;
    // Hide the top card on the UI thread. The card is already off-screen
    // (fly-out just finished), so this is invisible to the user.
    topOpacity.value = 0;
    // Set behindIndex to the NEW top card index — it acts as a visible stand-in
    // while the top card is hidden. This way the user sees the correct card
    // throughout the transition, never the card after it.
    setBehindIndex(newIdx);
    setCurrentIndex(i => {
      currentIndexRef.current = newIdx;
      return newIdx;
    });
  }, []);

  const handleTap = useCallback(() => {
    const idx = currentIndexRef.current;
    if (recipes[idx]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate('CardView', { cardId: recipes[idx].id });
    }
  }, [recipes, navigation]);

  // ── Gestures ──

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      'worklet';
      let tx = e.translationX;
      // Rubber band at boundaries
      if ((tx > 0 && !canGoPrev.value) || (tx < 0 && !canGoNext.value)) {
        tx = tx * 0.2;
      }
      translateX.value = tx;
      translateY.value = e.translationY * 0.2;
    })
    .onEnd((e) => {
      'worklet';
      const swipedLeft =
        (e.translationX < -SWIPE_THRESHOLD || e.velocityX < -SWIPE_VEL_THRESHOLD) &&
        canGoNext.value;
      const swipedRight =
        (e.translationX > SWIPE_THRESHOLD || e.velocityX > SWIPE_VEL_THRESHOLD) &&
        canGoPrev.value;

      if (swipedLeft) {
        translateX.value = withTiming(-SCREEN_W - SCALED_W, { duration: FLY_DURATION }, () => {
          runOnJS(handleSwipeComplete)('next');
        });
      } else if (swipedRight) {
        translateX.value = withTiming(SCREEN_W + SCALED_W, { duration: FLY_DURATION }, () => {
          runOnJS(handleSwipeComplete)('prev');
        });
      } else {
        translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
        translateY.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
      }
    });

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      'worklet';
      runOnJS(handleTap)();
    });

  const composed = Gesture.Exclusive(pan, tap);

  // ── Animated styles ──

  const entranceStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: entrance.value,
      transform: [
        { translateY: interpolate(entrance.value, [0, 1], [36, 0]) },
      ],
    };
  });

  const topCardStyle = useAnimatedStyle(() => {
    'worklet';
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_W, 0, SCREEN_W],
      [-10, 0, 10],
      Extrapolation.CLAMP,
    );
    return {
      opacity: topOpacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const thirdStyle = useAnimatedStyle(() => {
    'worklet';
    const p = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    return {
      transform: [
        { scale: interpolate(p, [0, 1], [0.9, 0.95]) },
        { translateY: interpolate(p, [0, 1], [-16, -8]) },
      ],
    };
  });

  // ── Render ──

  if (recipes.length === 0) {
    return (
      <View style={styles.screen}>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="bgEmpty" cx="50%" cy="40%" r="70%">
              <Stop offset="0%" stopColor={BG_GLOW} />
              <Stop offset="100%" stopColor={BG_DARK} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bgEmpty)" />
        </Svg>
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 12 }]}
          onPress={() => navigation.goBack()}
          hitSlop={12}
        >
          <Text style={styles.backText}>{t.previewBack}</Text>
        </TouchableOpacity>
        <Text style={styles.emptyText}>{t.emptyTitle}</Text>
      </View>
    );
  }

  const recipe = recipes[currentIndex];
  if (!recipe) return null;

  const behindRecipe = behindIndex >= 0 && behindIndex < recipes.length ? recipes[behindIndex] : null;
  const hasNext      = behindRecipe !== null;
  const hasNextNext  = behindIndex >= 0 && behindIndex < recipes.length - 1;

  return (
    <View style={styles.screen}>
      {/* Warm radial gradient background */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="bgMain" cx="50%" cy="38%" r="65%">
            <Stop offset="0%" stopColor={BG_GLOW} />
            <Stop offset="100%" stopColor={BG_DARK} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bgMain)" />
      </Svg>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>{t.previewBack}</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>
          {t.deckPosition(currentIndex + 1, recipes.length)}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Deck */}
      <Animated.View style={[styles.deckArea, entranceStyle]}>
        <View style={styles.cardStack}>
          {/* Third card (deepest) */}
          {hasNextNext && (
            <Animated.View style={[styles.cardSlot, thirdStyle, { zIndex: 1 }]}>
              <CardShell />
            </Animated.View>
          )}

          {/* Second card (behind) — full-size stand-in, always stationary */}
          {hasNext && (
            <View style={[styles.cardSlot, { zIndex: 2 }]}>
              <View
                style={[styles.cardInner, { marginLeft: SCALE_OFFSET_X, marginTop: SCALE_OFFSET_Y }]}
                pointerEvents="none"
              >
                <RecipeCard recipe={behindRecipe!} />
              </View>
            </View>
          )}

          {/* Top card (interactive) — full-size RecipeCard front face */}
          <GestureDetector gesture={composed}>
            <Animated.View style={[styles.cardSlot, topCardStyle, { zIndex: 3 }]}>
              <View
                style={[
                  styles.cardInner,
                  { marginLeft: SCALE_OFFSET_X, marginTop: SCALE_OFFSET_Y },
                ]}
                pointerEvents="none"
              >
                <RecipeCard recipe={recipe} />
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <DotIndicator current={currentIndex} total={recipes.length} />
        <Text style={styles.hintText}>{t.deckTapHint}</Text>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG_DARK,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 4,
    width: '100%',
    zIndex: 10,
  },
  backBtn: {
    position: 'absolute',
    left: 24,
    zIndex: 10,
  },
  backText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
    minWidth: 60,
  },
  counter: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 60,
  },
  deckArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStack: {
    width: SCALED_W,
    height: SCALED_H,
  },
  cardSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCALED_W,
    height: SCALED_H,
  },
  cardInner: {
    width: CARD_W,
    height: CARD_H_PUB,
    transform: [{ scale: CARD_SCALE }],
  },
  footer: {
    alignItems: 'center',
    paddingTop: 2,
    zIndex: 10,
  },
  hintText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.18)',
    letterSpacing: 0.3,
    marginTop: 2,
    marginBottom: 4,
  },
  emptyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 120,
  },
});
