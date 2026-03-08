import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PublishConfirmModal } from '../components/PublishConfirmModal';
import { RecipeCard } from '../components/RecipeCard';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../types/navigation';
import { markPublishedLocally, saveDraft, syncToCloud } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Preview'>;

export function PreviewScreen({ route, navigation }: Props) {
  const { t } = useLanguage();
  const [recipe, setRecipe] = useState(route.params.recipe);
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [receiveCount, setReceiveCount] = useState<number | null>(null);

  useEffect(() => {
    if (recipe.status !== 'published' || !recipe.id) return;
    supabase
      .from('recipes')
      .select('receive_count')
      .eq('id', recipe.id)
      .single()
      .then(({ data }) => {
        if (data) setReceiveCount((data.receive_count as number) ?? 0);
      });
  }, [recipe.id, recipe.status]);

  const webUrl = `${process.env.EXPO_PUBLIC_SERVER_URL}/card/${recipe.id}`;

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: `${recipe.creatorName} shared a recipe with you: ${webUrl}`,
      url: webUrl,
    });
  };

  const handlePublish = () => {
    if (publishing) return;
    setShowPublishModal(true);
  };

  const doPublish = async () => {
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
          t.cloudSyncFailedTitle,
          `Your card is saved locally and the QR works on this device, but other phones won't be able to load it.\n\nError: ${cloudErr?.message ?? 'Unknown error'}\n\nCheck that the "recipes" table and "recipe-photos" bucket exist in Supabase and that the bucket is set to Public.`
        );
      }
    } catch (err: any) {
      Alert.alert(t.publishFailedTitle, err?.message ?? t.somethingWentWrong);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <PublishConfirmModal
        visible={showPublishModal}
        recipeTitle={recipe.title}
        onConfirm={() => { setShowPublishModal(false); doPublish(); }}
        onCancel={() => setShowPublishModal(false)}
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RecipeCard
          recipe={recipe}
          onShare={handleShare}
          onPublish={handlePublish}
          publishing={publishing}
        />

        {recipe.status === 'published' && receiveCount !== null && (
          <Text style={styles.receiveCount}>
            {receiveCount === 0 ? t.previewReceiveNone : t.previewReceiveCount(receiveCount)}
          </Text>
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
  receiveCount: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 20,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
