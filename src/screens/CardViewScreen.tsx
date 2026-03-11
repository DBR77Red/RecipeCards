import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeData } from '../components/RecipeCard';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../types/navigation';
import { getDrafts, incrementReceiveCount } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'CardView'>;

export function CardViewScreen({ route, navigation }: Props) {
  const { t } = useLanguage();
  const { cardId } = route.params;
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(true);

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
