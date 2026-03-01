import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { RecipeForm } from '../components/RecipeForm';
import { RootStackParamList } from '../types/navigation';
import { emptyRecipe } from '../utils/recipe';
import { saveDraft } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

export function FormScreen({ route, navigation }: Props) {
  const incoming = route.params?.recipe;
  const [recipe, setRecipe] = useState(incoming ?? emptyRecipe());

  // Guard: published cards must not be editable — redirect to Preview
  useEffect(() => {
    if (incoming?.status === 'published') {
      navigation.replace('Preview', { recipe: incoming });
    }
  }, []);

  if (incoming?.status === 'published') return null;

  const handleSaveDraft = async () => {
    const saved = await saveDraft(recipe);
    setRecipe(saved); // capture assigned id so subsequent saves update instead of insert
  };

  return (
    <RecipeForm
      recipe={recipe}
      onChange={setRecipe}
      onSaveDraft={handleSaveDraft}
      onPreview={() => navigation.navigate('Preview', { recipe })}
      onBack={() => navigation.goBack()}
    />
  );
}
