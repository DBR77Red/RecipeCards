import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { RecipeData } from '../components/RecipeCard';
import { RecipeForm } from '../components/RecipeForm';
import { useLanguage } from '../context/LanguageContext';
import { RootStackParamList } from '../types/navigation';
import { emptyRecipe } from '../utils/recipe';
import { getUserName, markPublishedLocally, saveDraft, syncToCloud } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

export function FormScreen({ route, navigation }: Props) {
  const { t } = useLanguage();
  const incoming = route.params?.recipe;
  const [recipe, setRecipe] = useState<RecipeData>(emptyRecipe());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (incoming?.status === 'published') {
      navigation.replace('Preview', { recipe: incoming });
      return;
    }

    async function init() {
      const userName = await getUserName();
      const initial = incoming ?? emptyRecipe();
      if (!initial.creatorName && userName) {
        initial.creatorName = userName;
      }
      setRecipe(initial);
      setInitialized(true);
    }
    init();
  }, []);

  if (incoming?.status === 'published' || !initialized) return null;

  const handleSaveDraft = async () => {
    const saved = await saveDraft(recipe);
    setRecipe(saved);
  };

  const handlePublish = async () => {
    try {
      const saved = await saveDraft(recipe);
      const local = await markPublishedLocally(saved.id);
      navigation.replace('Preview', { recipe: local });
      try {
        await syncToCloud(local);
      } catch {
        // Card stays with cloudSyncStatus: 'pending' — App.tsx will retry on next foreground
      }
    } catch (err: any) {
      Alert.alert(t.publishFailedTitle, err?.message ?? t.somethingWentWrong);
    }
  };

  return (
    <RecipeForm
      recipe={recipe}
      onChange={setRecipe}
      onSaveDraft={handleSaveDraft}
      onPublish={handlePublish}
      onPreview={() => navigation.navigate('Preview', { recipe })}
      onBack={() => navigation.goBack()}
    />
  );
}
