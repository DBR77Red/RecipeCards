import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeData } from '../components/RecipeCard';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../types/navigation';
import { getDrafts } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'CardView'>;

export function CardViewScreen({ route, navigation }: Props) {
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
        <Text style={styles.backBtnText}>← Home</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="rgba(255,255,255,0.4)" />
      ) : recipe ? (
        <>
          <Text style={styles.sharedBy}>
            Recipe by{' '}
            <Text style={styles.creatorName}>{recipe.creatorName}</Text>
          </Text>
          <RecipeCard recipe={recipe} />
        </>
      ) : (
        <Text style={styles.notFound}>Recipe not found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 24,
  },
  backBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
  },
  sharedBy: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  creatorName: {
    fontFamily: 'DMSans_600SemiBold',
    color: 'rgba(255,255,255,0.75)',
  },
  notFound: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
  },
});
