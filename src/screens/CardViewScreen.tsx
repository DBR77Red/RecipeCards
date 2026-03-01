import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeData } from '../components/RecipeCard';
import { RootStackParamList } from '../types/navigation';
import { getDrafts } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'CardView'>;

export function CardViewScreen({ route, navigation }: Props) {
  const { cardId } = route.params;
  const [recipe, setRecipe] = useState<RecipeData | null>(null);

  useEffect(() => {
    getDrafts().then(drafts => {
      const found = drafts.find(d => d.id === cardId) ?? null;
      setRecipe(found);
    });
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

      {recipe ? (
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
