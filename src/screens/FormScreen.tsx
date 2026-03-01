import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { RecipeForm } from '../components/RecipeForm';
import { RootStackParamList } from '../types/navigation';
import { emptyRecipe } from '../utils/recipe';
import { publishRecipe, saveDraft } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

export function FormScreen({ route, navigation }: Props) {
  const incoming = route.params?.recipe;
  const [recipe, setRecipe] = useState(incoming ?? emptyRecipe());

  useEffect(() => {
    if (incoming?.status === 'published') {
      navigation.replace('Preview', { recipe: incoming });
    }
  }, []);

  if (incoming?.status === 'published') return null;

  const handleSaveDraft = async () => {
    const saved = await saveDraft(recipe);
    setRecipe(saved);
  };

  const handlePublish = async () => {
    const saved = await saveDraft(recipe);
    const published = await publishRecipe(saved.id);
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
