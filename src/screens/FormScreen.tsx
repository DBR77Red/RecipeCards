import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { RecipeData } from '../components/RecipeCard';
import { RecipeForm } from '../components/RecipeForm';
import { RootStackParamList } from '../types/navigation';
import { emptyRecipe } from '../utils/recipe';
import { getUserName, publishRecipe, saveDraft } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

export function FormScreen({ route, navigation }: Props) {
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
    const saved = await saveDraft(recipe);
    console.log('Saved with status:', saved.status);
    const published = await publishRecipe(saved.id);
    console.log('Published with status:', published.status);
    navigation.replace('Preview', { recipe: published });
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
