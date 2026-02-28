import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { RecipeForm } from '../components/RecipeForm';
import { RootStackParamList } from '../types/navigation';
import { emptyRecipe } from '../utils/recipe';
import { saveDraft } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

export function FormScreen({ route, navigation }: Props) {
  const [recipe, setRecipe] = useState(route.params?.recipe ?? emptyRecipe());

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
