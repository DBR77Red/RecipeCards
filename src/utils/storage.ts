import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecipeData } from '../components/RecipeCard';
import { supabase } from '../lib/supabase';

const DRAFTS_KEY = '@recipecards/drafts';
const USER_NAME_KEY = '@recipecards/userName';

export async function getUserName(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(USER_NAME_KEY)) || '';
  } catch {
    return '';
  }
}

export async function setUserName(name: string): Promise<void> {
  await AsyncStorage.setItem(USER_NAME_KEY, name);
}

/** Returns all stored drafts sorted newest-updated first. Returns [] on any error. */
export async function getDrafts(): Promise<RecipeData[]> {
  try {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const drafts: RecipeData[] = JSON.parse(raw);
    console.log('Storage raw:', raw);
    console.log('Storage parsed:', drafts.map(d => ({ id: d.id, status: d.status, title: d.title })));
    return [...drafts].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * Upserts a draft and returns the saved object (with id/timestamps filled in).
 * - If recipe.id is empty, assigns a new Date.now() string id.
 * - Always stamps updatedAt with the current time.
 */
export async function saveDraft(recipe: RecipeData): Promise<RecipeData> {
  const now = new Date().toISOString();
  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  const drafts: RecipeData[] = raw ? JSON.parse(raw) : [];

  let saved: RecipeData;
  if (recipe.id) {
    saved = { ...recipe, updatedAt: now };
    const idx = drafts.findIndex(d => d.id === saved.id);
    if (idx >= 0) drafts[idx] = saved;
    else drafts.push(saved);
  } else {
    saved = {
      ...recipe,
      id: String(Date.now()),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    drafts.push(saved);
  }

  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  return saved;
}

/** Sets a recipe's status to 'published', uploads photo + data to Supabase, and returns the updated object. */
export async function publishRecipe(id: string): Promise<RecipeData> {
  const now = new Date().toISOString();
  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  const drafts: RecipeData[] = raw ? JSON.parse(raw) : [];
  const idx = drafts.findIndex(d => d.id === id);
  if (idx < 0) throw new Error('Recipe not found');
  const recipe = drafts[idx];

  // Upload photo to Supabase Storage if it's a local device URI
  let photoUrl: string | null = recipe.photo;
  const isLocalUri =
    recipe.photo &&
    (recipe.photo.startsWith('file://') || recipe.photo.startsWith('content://'));

  if (isLocalUri && recipe.photo) {
    try {
      const response = await fetch(recipe.photo);
      const blob = await response.blob();
      const path = `${id}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('recipe-photos')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) {
        console.warn('Photo upload failed:', uploadError.message);
      } else {
        const { data: urlData } = supabase.storage
          .from('recipe-photos')
          .getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }
    } catch (e) {
      console.warn('Photo upload error:', e);
    }
  }

  const shareUrl = `recipecards://card/${id}`;
  const published: RecipeData = {
    ...recipe,
    photo: photoUrl,
    status: 'published',
    updatedAt: now,
    shareUrl,
  };

  // Upsert recipe row to Supabase
  const { error: dbError } = await supabase.from('recipes').upsert({
    id: published.id,
    title: published.title,
    creator_name: published.creatorName,
    photo_url: photoUrl,
    servings: published.servings,
    prep_time: published.prepTime,
    cook_time: published.cookTime,
    ingredients: published.ingredients,
    directions: published.directions,
    created_at: published.createdAt,
    updated_at: now,
    share_url: shareUrl,
  });
  if (dbError) throw new Error(dbError.message);

  // Keep local storage in sync
  drafts[idx] = published;
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  return published;
}

/** Removes a draft by id. Silently does nothing if the id is not found. */
export async function deleteDraft(id: string): Promise<void> {
  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  if (!raw) return;
  const drafts: RecipeData[] = JSON.parse(raw);
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.filter(d => d.id !== id)));
}
