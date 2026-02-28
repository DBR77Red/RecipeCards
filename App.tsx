import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { RecipeCard, RecipeData } from './src/components/RecipeCard';

const SAMPLE_RECIPE: RecipeData = {
  title: 'Classic Carbonara',
  creator: 'Marco Romano',
  servings: '4',
  prepTime: '15 min',
  cookTime: '20 min',
  difficulty: 'Medium',
  ingredients: [
    '400 g spaghetti',
    '200 g guanciale, diced',
    '4 large egg yolks',
    '60 g Pecorino Romano, grated',
    'Freshly cracked black pepper',
    'Coarse salt, for pasta water',
  ],
  steps: [
    'Bring a large pot of salted water to a boil and cook spaghetti until al dente.',
    'Render guanciale in a cold skillet over medium heat until golden and crispy.',
    'Whisk yolks with Pecorino and a generous amount of black pepper.',
    'Off heat, toss hot pasta in the skillet, add egg mixture, and loosen with pasta water until silky.',
  ],
};

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <RecipeCard recipe={SAMPLE_RECIPE} />
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
});
