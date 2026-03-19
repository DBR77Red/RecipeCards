import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeData } from '../components/RecipeCard';
import { ErrorModal } from '../components/ErrorModal';
import { PublishConfirmModal } from '../components/PublishConfirmModal';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../types/navigation';
import { getDrafts, markPublishedLocally, saveDraft, syncToCloud, toggleFavorite } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'CardView'>;

const { width: SCREEN_W } = Dimensions.get('window');
const FLY_DISTANCE = SCREEN_W + 60;
const SWIPE_THRESHOLD = 80;
const SWIPE_VEL_THRESHOLD = 500;

export function CardViewScreen({ route, navigation }: Props) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { cardId: rawCardId, recipes: deckRecipes } = route.params;
  const isDeckMode = Array.isArray(deckRecipes) && deckRecipes.length > 0;

  // ── Deck-mode state ──
  const initialIdx = isDeckMode
    ? Math.max(0, deckRecipes!.findIndex(r => r.id === rawCardId))
    : 0;
  const [currentIndex, setCurrentIndex] = useState(initialIdx);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const isFirstLayout = useRef(true);

  // Local favorite overrides so heart updates immediately in deck mode
  const [localFavoriteOverrides, setLocalFavoriteOverrides] = useState<Record<string, boolean>>({});

  // ── Standalone-mode state ──
  const cardId = /^[\w-]{1,64}$/.test(rawCardId ?? '') ? rawCardId : '';
  const [standaloneRecipe, setStandaloneRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(!isDeckMode);

  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ title: string; body: string } | null>(null);

  // ── Current recipe ──
  const recipe: RecipeData | null = isDeckMode
    ? (deckRecipes![currentIndex] ?? null)
    : standaloneRecipe;

  const displayRecipe: RecipeData | null = recipe
    ? { ...recipe, isFavorite: localFavoriteOverrides[recipe.id] ?? recipe.isFavorite }
    : null;

  const canFavorite = displayRecipe?.status === 'published' || displayRecipe?.isReceived;

  // ── Reanimated values ──
  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  // After index changes, reset position and fade in the new card
  useLayoutEffect(() => {
    if (isFirstLayout.current) {
      isFirstLayout.current = false;
      return;
    }
    translateX.value = 0;
    cardOpacity.value = withTiming(1, { duration: 180 });
  }, [currentIndex]);

  // ── Load for standalone mode ──
  useEffect(() => {
    if (isDeckMode) return;
    async function load() {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', cardId)
        .single();

      if (!error && data) {
        setStandaloneRecipe({
          id: data.id,
          status: 'published',
          title: data.title,
          creatorName: data.creator_name,
          photo: data.photo_url,
          servings: data.servings ?? '',
          prepTime: data.prep_time ?? '',
          cookTime: data.cook_time ?? '',
          ingredients: data.ingredients ?? [],
          directions: data.directions ?? [],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          shareUrl: data.share_url,
        });
      } else {
        const drafts = await getDrafts();
        setStandaloneRecipe(drafts.find(d => d.id === cardId) ?? null);
      }
      setLoading(false);
    }
    load();
  }, [cardId, isDeckMode]);

  // ── Favorite toggle ──
  const handleToggleFavorite = async () => {
    if (!displayRecipe || !canFavorite) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = await toggleFavorite(displayRecipe.id);
    if (isDeckMode) {
      setLocalFavoriteOverrides(prev => ({ ...prev, [displayRecipe.id]: newValue }));
    } else {
      setStandaloneRecipe(r => r ? { ...r, isFavorite: newValue } : r);
    }
  };

  // ── Publish ──
  const handlePublish = () => {
    if (publishing) return;
    setShowPublishModal(true);
  };

  const doPublish = async () => {
    if (!recipe) return;
    setPublishing(true);
    try {
      const base = await saveDraft(recipe);
      const local = await markPublishedLocally(base.id);
      if (!isDeckMode) setStandaloneRecipe(local);

      try {
        const synced = await syncToCloud(local);
        if (!isDeckMode) setStandaloneRecipe(synced);
      } catch {
        // Stays pending — retried on next foreground
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setErrorModal({ title: t.publishFailedTitle, body: err?.message ?? t.somethingWentWrong });
    } finally {
      setPublishing(false);
    }
  };

  // ── Share ──
  const handleShare = async () => {
    if (!recipe) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const webUrl = `${process.env.EXPO_PUBLIC_SERVER_URL}/card/${recipe.id}`;
    await Share.share({
      message: `${recipe.creatorName} shared a recipe with you: ${webUrl}`,
      url: webUrl,
    });
  };

  // ── Swipe navigation (deck mode only) ──
  const handleSwipeComplete = (dir: 'next' | 'prev') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const delta = dir === 'next' ? 1 : -1;
    const newIdx = currentIndexRef.current + delta;
    cardOpacity.value = 0;
    setCurrentIndex(newIdx);
  };

  const canGoNext = isDeckMode && currentIndex < deckRecipes!.length - 1;
  const canGoPrev = isDeckMode && currentIndex > 0;

  const canGoNextSV = useSharedValue(canGoNext);
  const canGoPrevSV = useSharedValue(canGoPrev);
  useEffect(() => {
    canGoNextSV.value = isDeckMode ? currentIndex < deckRecipes!.length - 1 : false;
    canGoPrevSV.value = isDeckMode ? currentIndex > 0 : false;
  }, [currentIndex, isDeckMode]);

  const pan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      'worklet';
      let tx = e.translationX;
      if ((tx > 0 && !canGoPrevSV.value) || (tx < 0 && !canGoNextSV.value)) {
        tx = tx * 0.18;
      }
      translateX.value = tx;
    })
    .onEnd((e) => {
      'worklet';
      const swipedLeft =
        (e.translationX < -SWIPE_THRESHOLD || e.velocityX < -SWIPE_VEL_THRESHOLD) &&
        canGoNextSV.value;
      const swipedRight =
        (e.translationX > SWIPE_THRESHOLD || e.velocityX > SWIPE_VEL_THRESHOLD) &&
        canGoPrevSV.value;

      if (swipedLeft) {
        translateX.value = withTiming(-FLY_DISTANCE, { duration: 220 }, () => {
          runOnJS(handleSwipeComplete)('next');
        });
      } else if (swipedRight) {
        translateX.value = withTiming(FLY_DISTANCE, { duration: 220 }, () => {
          runOnJS(handleSwipeComplete)('prev');
        });
      } else {
        translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: cardOpacity.value,
      transform: [{ translateX: translateX.value }],
    };
  });

  // ── Render ──
  const showCounter = isDeckMode && deckRecipes!.length > 1;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <PublishConfirmModal
        visible={showPublishModal}
        recipeTitle={displayRecipe?.title ?? ''}
        onConfirm={() => { setShowPublishModal(false); doPublish(); }}
        onCancel={() => setShowPublishModal(false)}
      />

      {/* Header row — uses safe area inset */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
          }
          hitSlop={12}
        >
          <Text style={styles.backBtnText}>
            {navigation.canGoBack() ? t.previewBack : t.cardViewBack}
          </Text>
        </TouchableOpacity>

        {showCounter && (
          <Text style={styles.counter}>
            {t.deckPosition(currentIndex + 1, deckRecipes!.length)}
          </Text>
        )}

        {canFavorite ? (
          <TouchableOpacity onPress={handleToggleFavorite} activeOpacity={0.7} hitSlop={12}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Path
                d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 6a5 5 0 0 1 9 2.5C21 14.5 12 21 12 21z"
                fill={displayRecipe?.isFavorite ? '#EA580C' : 'none'}
                stroke={displayRecipe?.isFavorite ? '#EA580C' : 'rgba(255,255,255,0.45)'}
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="rgba(255,255,255,0.3)" />
      ) : displayRecipe ? (
        isDeckMode ? (
          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.flex, animatedStyle]}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sharedBy}>
                  {t.cardViewRecipeBy}{' '}
                  <Text style={styles.creatorName}>{displayRecipe.creatorName}</Text>
                </Text>
                <RecipeCard
                  key={currentIndex}
                  recipe={displayRecipe}
                  onPublish={handlePublish}
                  onShare={handleShare}
                  publishing={publishing}
                />
                <Text style={styles.hintText}>{t.deckTapHint}</Text>
              </ScrollView>
            </Animated.View>
          </GestureDetector>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sharedBy}>
              {t.cardViewRecipeBy}{' '}
              <Text style={styles.creatorName}>{displayRecipe.creatorName}</Text>
            </Text>
            <RecipeCard
              recipe={displayRecipe}
              onPublish={handlePublish}
              onShare={handleShare}
              publishing={publishing}
            />
          </ScrollView>
        )
      ) : (
        <Text style={styles.notFound}>{t.cardViewNotFound}</Text>
      )}

      <ErrorModal
        visible={!!errorModal}
        title={errorModal?.title ?? ''}
        body={errorModal?.body ?? ''}
        onDismiss={() => setErrorModal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f0d0b',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerSpacer: {
    width: 32,
  },
  counter: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingBottom: 48,
  },
  loader: {
    flex: 1,
  },
  backBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
    minWidth: 60,
  },
  sharedBy: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  creatorName: {
    fontFamily: 'DMSans_600SemiBold',
    color: 'rgba(255,255,255,0.7)',
  },
  notFound: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 80,
  },
  hintText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.18)',
    letterSpacing: 0.3,
    marginTop: 16,
  },
});
