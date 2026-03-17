import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeData } from '../components/RecipeCard';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../types/navigation';
import * as Haptics from 'expo-haptics';
import { getDrafts, incrementReceiveCount, toggleFavorite } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'CardView'>;

export function CardViewScreen({ route, navigation }: Props) {
  const { t } = useLanguage();
  const { cardId: rawCardId } = route.params;
  const cardId = /^[\w-]{1,64}$/.test(rawCardId ?? '') ? rawCardId : '';
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(true);

  const handleToggleFavorite = async () => {
    if (!recipe?.isReceived) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = await toggleFavorite(recipe.id);
    setRecipe(r => r ? { ...r, isFavorite: newValue } : r);
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
        incrementReceiveCount(cardId);
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

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
      >
        <Text style={styles.backBtnText}>{t.cardViewBack}</Text>
      </TouchableOpacity>

      {recipe?.isReceived && (
        <TouchableOpacity style={styles.heartBtn} onPress={handleToggleFavorite} activeOpacity={0.7}>
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
      )}

      {loading ? (
        <ActivityIndicator size="large" color="rgba(255,255,255,0.3)" />
      ) : recipe ? (
        <>
          <Text style={styles.sharedBy}>
            {t.cardViewRecipeBy}{' '}
            <Text style={styles.creatorName}>{recipe.creatorName}</Text>
          </Text>
          <RecipeCard recipe={recipe} />
        </>
      ) : (
        <Text style={styles.notFound}>{t.cardViewNotFound}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
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
