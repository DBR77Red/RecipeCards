import { RecipeData } from '../components/RecipeCard';

export function emptyRecipe(): RecipeData {
  const now = new Date().toISOString();
  return {
    id: '',
    status: 'draft',
    title: '',
    creatorName: '',
    photo: null,
    servings: '',
    prepTime: '',
    cookTime: '',
    ingredients: [''],
    directions: [''],
    createdAt: now,
    updatedAt: now,
  };
}
