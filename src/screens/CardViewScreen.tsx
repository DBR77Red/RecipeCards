import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeData } from '../components/RecipeCard';
import { ErrorModal } from '../components/ErrorModal';
import { PublishConfirmModal } from '../components/PublishConfirmModal';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../types/navigation';
import * as Haptics from 'expo-haptics';
import { getDrafts, markPublishedLocally, saveDraft, syncToCloud, toggleFavorite } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'CardView'>;

export function CardViewScreen({ route, navigation }: Props) {
  const { t } = useLanguage();
  const { cardId: rawCardId } = route.params;
  const cardId = /^[\w-]{1,64}$/.test(rawCardId ?? '') ? rawCardId : '';
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ title: string; body: string } | null>(null);

  const canFavorite = recipe?.status === 'published' || recipe?.isReceived;

  const handleToggleFavorite = async () => {
    if (!recipe || !canFavorite) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = await toggleFavorite(recipe.id);
    setRecipe(r => r ? { ...r, isFavorite: newValue } : r);
  };

  const handlePublish = () => {
    if (publishing) return;
    setShowPublishModal(true);
  };

  const doPublish = async () => {
    if (!recipe) return;
    setPublishing(true);
    try {
      const base = recipe.id ? recipe : await saveDraft(recipe);
      const local = await markPublishedLocally(base.id);
      setRecipe(local);

      try {
        const synced = await syncToCloud(local);
        setRecipe(synced);
      } catch {
        // Card stays with cloudSyncStatus: 'pending' — retried on next foreground
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setErrorModal({ title: t.publishFailedTitle, body: err?.message ?? t.somethingWentWrong });
    } finally {
      setPublishing(false);
    }
  };

  const handleShare = async () => {
    if (!recipe) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const webUrl = `${process.env.EXPO_PUBLIC_SERVER_URL}/card/${recipe.id}`;
    await Share.share({
      message: `${recipe.creatorName} shared a recipe with you: ${webUrl}`,
      url: webUrl,
    });
  };

  useEffect(() => {
    async function load() {
      // Fetch from Supabase first (works across all devices)
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', cardId)
        .single();

      if (!error && data) {
        setRecipe({
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
        // Fallback: check local storage (for recipes not yet published to cloud)
        const drafts = await getDrafts();
        setRecipe(drafts.find(d => d.id === cardId) ?? null);
      }
      setLoading(false);
    }
    load();
  }, [cardId]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <PublishConfirmModal
        visible={showPublishModal}
        recipeTitle={recipe?.title ?? ''}
        onConfirm={() => { setShowPublishModal(false); doPublish(); }}
        onCancel={() => setShowPublishModal(false)}
      />

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
      >
        <Text style={styles.backBtnText}>{navigation.canGoBack() ? t.previewBack : t.cardViewBack}</Text>
      </TouchableOpacity>

      {canFavorite && (
        <TouchableOpacity style={styles.heartBtn} onPress={handleToggleFavorite} activeOpacity={0.7}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
              d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 6a5 5 0 0 1 9 2.5C21 14.5 12 21 12 21z"
              fill={recipe?.isFavorite ? '#EA580C' : 'none'}
              stroke={recipe?.isFavorite ? '#EA580C' : 'rgba(255,255,255,0.45)'}
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="rgba(255,255,255,0.3)" />
      ) : recipe ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sharedBy}>
            {t.cardViewRecipeBy}{' '}
            <Text style={styles.creatorName}>{recipe.creatorName}</Text>
          </Text>
          <RecipeCard
            recipe={recipe}
            onPublish={handlePublish}
            onShare={handleShare}
            publishing={publishing}
          />
        </ScrollView>
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
    backgroundColor: '#18181B',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loader: {
    flex: 1,
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
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
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
  },
});
