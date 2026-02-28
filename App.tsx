import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RecipeCard, RecipeData } from './src/components/RecipeCard';
import { RecipeForm } from './src/components/RecipeForm';

const STORAGE_KEY = '@recipecards/draft';

const EMPTY_RECIPE: RecipeData = {
  title: '',
  creator: '',
  photo: undefined,
  servings: '',
  prepTime: '',
  cookTime: '',
  difficulty: '',
  ingredients: [''],
  steps: [''],
};

type AppView = 'form' | 'preview';

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  const [view, setView]         = useState<AppView>('form');
  const [recipe, setRecipe]     = useState<RecipeData>(EMPTY_RECIPE);
  const [hydrated, setHydrated] = useState(false);

  // Load saved draft on first mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setRecipe(JSON.parse(raw)); } catch { /* ignore bad data */ }
      }
      setHydrated(true);
    });
  }, []);

  // Auto-save on every change
  const handleChange = (next: RecipeData) => {
    setRecipe(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  if (!fontsLoaded || !hydrated) return null;

  // ── Preview ─────────────────────────────────────────────────────────────────
  if (view === 'preview') {
    return (
      <View style={styles.previewScreen}>
        <StatusBar style="light" />
        <TouchableOpacity style={styles.backBtn} onPress={() => setView('form')}>
          <Text style={styles.backBtnText}>← Edit Recipe</Text>
        </TouchableOpacity>
        <RecipeCard recipe={recipe} />
      </View>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <>
      <StatusBar style="dark" />
      <RecipeForm
        recipe={recipe}
        onChange={handleChange}
        onPreview={() => setView('preview')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  previewScreen: {
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
});
