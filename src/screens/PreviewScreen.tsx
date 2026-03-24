import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ErrorModal } from '../components/ErrorModal';
import { PublishConfirmModal } from '../components/PublishConfirmModal';
import { ShareQRModal } from '../components/ShareQRModal';
import { RecipeCard } from '../components/RecipeCard';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../types/navigation';
import { markPublishedLocally, saveDraft, syncToCloud, toggleFavorite } from '../utils/storage';
import { useSound } from '../utils/useSound';

const CELEBRATE_LOTTIE = require('../../assets/celebrate.json');

type Props = NativeStackScreenProps<RootStackParamList, 'Preview'>;

export function PreviewScreen({ route, navigation }: Props) {
  const { t } = useLanguage();
  const { width: SW, height: SH } = useWindowDimensions();
  const [recipe, setRecipe] = useState(route.params.recipe);
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [receiveCount, setReceiveCount] = useState<number | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; body: string } | null>(null);
  const shouldCelebrate = useRef(false);
  const playCelebrate = useSound(require('../../assets/celebrate_sound.mp3'));
  const heartScale = useRef(new Animated.Value(1)).current;
  const countScale = useRef(new Animated.Value(1)).current;

  const animateCountPop = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(countScale, { toValue: 1.45, duration: 140, useNativeDriver: true }),
      Animated.spring(countScale, { toValue: 1, useNativeDriver: true, damping: 5, stiffness: 200, mass: 0.8 }),
    ]).start();
  }, [countScale]);

  useEffect(() => {
    if (route.params.celebrate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCelebration(true);
      playCelebrate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (recipe.status !== 'published' || !recipe.id) return;
      supabase
        .from('recipes')
        .select('receive_count')
        .eq('id', recipe.id)
        .single()
        .then(({ data }) => {
          if (data) setReceiveCount((data.receive_count as number) ?? 0);
        });
    }, [recipe.id, recipe.status])
  );

  // Realtime: animate count the moment someone saves the card
  useEffect(() => {
    if (recipe.status !== 'published' || !recipe.id) return;
    const channel = supabase
      .channel(`receive-count-${recipe.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'recipes', filter: `id=eq.${recipe.id}` },
        (payload) => {
          const newCount = (payload.new as any).receive_count as number;
          setReceiveCount(prev => {
            if (prev !== null && newCount > prev) animateCountPop();
            return newCount;
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [recipe.id, recipe.status, animateCountPop]);

  const webUrl = `${process.env.EXPO_PUBLIC_SERVER_URL}/card/${recipe.id}`;

  const handleToggleFavorite = async () => {
    const becomingFavorite = !recipe.isFavorite;
    Haptics.impactAsync(
      becomingFavorite ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    );
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: becomingFavorite ? 1.35 : 1.2,
        duration: becomingFavorite ? 100 : 80,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: becomingFavorite ? 6 : 12,
        stiffness: 220,
        mass: 0.8,
      }),
    ]).start();
    const newValue = await toggleFavorite(recipe.id);
    setRecipe(r => ({ ...r, isFavorite: newValue }));
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowQRModal(true);
  };

  const handlePublish = () => {
    if (publishing) return;
    setShowPublishModal(true);
  };

  const doPublish = async () => {
    setPublishing(true);
    try {
      // Step 1: mark published locally — QR appears immediately
      const base = await saveDraft(recipe);
      shouldCelebrate.current = true;
      const local = await markPublishedLocally(base.id);
      setRecipe(local); // triggers useEffect → haptic + celebration

      // Step 2: sync photo + recipe to Supabase (best-effort — retried on next foreground if it fails)
      try {
        const synced = await syncToCloud(local);
        setRecipe(synced);
      } catch {
        // Card stays with cloudSyncStatus: 'pending' — App.tsx will retry on next foreground
        // and fire a local notification when it succeeds
      }
    } catch (err: any) {
      setErrorModal({ title: t.publishFailedTitle, body: err?.message ?? t.somethingWentWrong });
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    if (recipe.status === 'published' && shouldCelebrate.current) {
      shouldCelebrate.current = false;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      triggerCelebration();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.status]);

  const triggerCelebration = () => {
    setShowCelebration(true);
    playCelebrate();
  };

  return (
    <View style={styles.screen}>
      <PublishConfirmModal
        visible={showPublishModal}
        recipeTitle={recipe.title}
        onConfirm={() => { setShowPublishModal(false); doPublish(); }}
        onCancel={() => setShowPublishModal(false)}
      />
      <ShareQRModal
        visible={showQRModal}
        recipeTitle={recipe.title}
        qrUrl={recipe.shareUrl ?? `recipecards://card/${recipe.id}`}
        shareUrl={webUrl}
        creatorName={recipe.creatorName}
        onClose={() => setShowQRModal(false)}
      />
      <StatusBar style="light" />

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() =>
          recipe.status === 'published'
            ? navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
            : navigation.goBack()
        }
      >
        <Text style={styles.backBtnText}>
          {recipe.status === 'published' ? t.previewBack : t.previewEditRecipe}
        </Text>
      </TouchableOpacity>

      {recipe.status === 'published' && (
        <Animated.View
          collapsable={false}
          style={[styles.heartBtn, { transform: [{ scale: heartScale }] }]}
        >
          <TouchableOpacity onPress={handleToggleFavorite} activeOpacity={0.7}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Path
                d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 6a5 5 0 0 1 9 2.5C21 14.5 12 21 12 21z"
                fill={recipe.isFavorite ? '#EA580C' : 'none'}
                stroke={recipe.isFavorite ? '#EA580C' : 'rgba(255,255,255,0.45)'}
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RecipeCard
          recipe={{ ...recipe, receiveCount: receiveCount ?? undefined }}
          onShare={handleShare}
          onPublish={handlePublish}
          publishing={publishing}
        />

        {recipe.status === 'published' && receiveCount !== null && (
          <Animated.Text style={[styles.receiveCount, { transform: [{ scale: countScale }] }]}>
            {receiveCount === 0 ? t.previewReceiveNone : t.previewReceiveCount(receiveCount)}
          </Animated.Text>
        )}
      </ScrollView>

      {showCelebration && (
        <View pointerEvents="none" style={styles.celebrationOverlay}>
          <LottieView
            source={CELEBRATE_LOTTIE}
            autoPlay
            loop={false}
            style={{ width: SW, height: SH }}
            onAnimationFinish={() => setShowCelebration(false)}
          />
        </View>
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
    backgroundColor: '#1C0F06',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 104,
    paddingBottom: 52,
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 24,
    zIndex: 10,
  },
  heartBtn: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
    padding: 4,
  },
  backBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100,
  },
  receiveCount: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 20,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
