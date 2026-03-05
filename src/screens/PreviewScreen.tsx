import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RecipeCard } from '../components/RecipeCard';
import { RootStackParamList } from '../types/navigation';
import { markPublishedLocally, saveDraft, syncToCloud } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Preview'>;

export function PreviewScreen({ route, navigation }: Props) {
  const [recipe, setRecipe] = useState(route.params.recipe);
  const [publishing, setPublishing] = useState(false);

  const shareUrl = recipe.shareUrl ?? `recipecards://card/${recipe.id}`;

  const handleShare = async () => {
    await Share.share({
      message: `${recipe.creatorName} shared a recipe with you: ${shareUrl}`,
    });
  };

  const handlePublish = async () => {
    if (publishing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPublishing(true);
    try {
      // Step 1: mark published locally — QR appears immediately
      const base = recipe.id ? recipe : await saveDraft(recipe);
      const local = await markPublishedLocally(base.id);
      setRecipe(local);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Step 2: sync photo + recipe to Supabase
      try {
        const synced = await syncToCloud(local);
        setRecipe(synced);
      } catch (cloudErr: any) {
        Alert.alert(
          'Cloud sync failed',
          `Your card is saved locally and the QR works on this device, but other phones won't be able to load it.\n\nError: ${cloudErr?.message ?? 'Unknown error'}\n\nCheck that the "recipes" table and "recipe-photos" bucket exist in Supabase and that the bucket is set to Public.`
        );
      }
    } catch (err: any) {
      Alert.alert('Publish failed', err?.message ?? 'Something went wrong.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={styles.screen}>
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
          {recipe.status === 'published' ? '← Back' : '← Edit Recipe'}
        </Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RecipeCard recipe={recipe} onShare={handleShare} />

        {recipe.status !== 'published' && (
          <TouchableOpacity
            style={[styles.publishBtn, publishing && styles.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={publishing}
          >
            <Text style={styles.publishBtnText}>
              {publishing ? 'Publishing…' : 'Publish to Share'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
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
  backBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
  },
  // ── Publish button (draft preview) ────────────────────────────────────────
  publishBtn: {
    marginTop: 28,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  publishBtnDisabled: {
    opacity: 0.4,
  },
  publishBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
