import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RecipeCard } from '../components/RecipeCard';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Preview'>;

export function PreviewScreen({ route, navigation }: Props) {
  const recipe = route.params.recipe;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() =>
          recipe.status === 'published'
            ? navigation.navigate('Home')
            : navigation.goBack()
        }
      >
        <Text style={styles.backBtnText}>
          {recipe.status === 'published' ? '← Back' : '← Edit Recipe'}
        </Text>
      </TouchableOpacity>

      <RecipeCard recipe={recipe} />

      {recipe.status === 'published' && (
        <View style={styles.publishedBadge}>
          <Text style={styles.publishedBadgeText}>✓  Published</Text>
        </View>
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
  publishedBadge: {
    marginTop: 28,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  publishedBadgeText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.3,
  },
});
