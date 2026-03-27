import { RecipeData } from '../components/RecipeCard';
import { supabase } from '../lib/supabase';

export async function fetchSharedRecipe(cardId: string): Promise<RecipeData> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', cardId)
    .single();
  if (error || !data) throw new Error('Recipe not found');
  return {
    id: data.id,
    status: 'published',
    title: data.title,
    creatorName: data.creator_name,
    photo: data.photo_url,
    servings: data.servings ?? '',
    prepTime: data.prep_time ?? '',
    cookTime: data.cook_time ?? '',
    ingredients: data.ingredients ?? [],
    directions: data.directions ?? [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    shareUrl: data.share_url,
    receiveCount: (data.receive_count as number) || 1,
  };
}
