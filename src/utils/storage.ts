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
    return [...drafts]
      .filter(d => !d.deletedAt)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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

/**
 * Step 1 of publishing: marks the recipe as published in local storage only.
 * Always succeeds — guarantees the QR code appears even if cloud sync fails.
 */
export async function markPublishedLocally(id: string): Promise<RecipeData> {
  const now = new Date().toISOString();
  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  const drafts: RecipeData[] = raw ? JSON.parse(raw) : [];
  const idx = drafts.findIndex(d => d.id === id);
  if (idx < 0) throw new Error('Recipe not found');
  const published: RecipeData = {
    ...drafts[idx],
    status: 'published',
    updatedAt: now,
    shareUrl: `recipecards://card/${id}`,
  };
  drafts[idx] = published;
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  return published;
}

/**
 * Step 2 of publishing: uploads photo to Supabase Storage and upserts the
 * recipe row. Throws a descriptive error on failure so the caller can alert
 * the user. On success, updates local storage with the public photo URL.
 */
export async function syncToCloud(recipe: RecipeData): Promise<RecipeData> {
  const now = new Date().toISOString();

  let photoUrl: string | null = recipe.photo;
  const isLocalUri =
    recipe.photo &&
    (recipe.photo.startsWith('file://') || recipe.photo.startsWith('content://'));

  if (isLocalUri && recipe.photo) {
    const formData = new FormData();
    formData.append('file', {
      uri: recipe.photo,
      name: `${recipe.id}.jpg`,
      type: 'image/jpeg',
    } as any);
    const { error: uploadError } = await supabase.storage
      .from('recipe-photos')
      .upload(`${recipe.id}.jpg`, formData, { upsert: true });
    if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
    const { data: urlData } = supabase.storage
      .from('recipe-photos')
      .getPublicUrl(`${recipe.id}.jpg`);
    photoUrl = urlData.publicUrl;
  }

  const { error: dbError } = await supabase.from('recipes').upsert({
    id: recipe.id,
    title: recipe.title,
    creator_name: recipe.creatorName,
    photo_url: photoUrl,
    servings: recipe.servings,
    prep_time: recipe.prepTime,
    cook_time: recipe.cookTime,
    ingredients: recipe.ingredients,
    directions: recipe.directions,
    created_at: recipe.createdAt,
    updated_at: now,
    share_url: recipe.shareUrl,
  });
  if (dbError) throw new Error(`Database sync failed: ${dbError.message}`);

  // Update local storage with the public cloud photo URL
  const synced: RecipeData = { ...recipe, photo: photoUrl, updatedAt: now };
  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  const drafts: RecipeData[] = raw ? JSON.parse(raw) : [];
  const idx = drafts.findIndex(d => d.id === recipe.id);
  if (idx >= 0) {
    drafts[idx] = synced;
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  }
  return synced;
}

/**
 * Saves a card received from another user as a read-only published record.
 * Never editable — always has isReceived: true.
 */
export async function saveReceivedCard(recipe: RecipeData): Promise<RecipeData> {
  const now = new Date().toISOString();

  // Increment receive count on the original Supabase record (best-effort)
  try {
    const { data } = await supabase
      .from('recipes')
      .select('receive_count')
      .eq('id', recipe.id)
      .single();
    const newCount = ((data?.receive_count as number) ?? 0) + 1;
    await supabase
      .from('recipes')
      .update({ receive_count: newCount })
      .eq('id', recipe.id);
  } catch { /* non-critical — silently ignore */ }

  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  const drafts: RecipeData[] = raw ? JSON.parse(raw) : [];
  const saved: RecipeData = {
    ...recipe,
    id: String(Date.now()),
    status: 'published',
    isReceived: true,
    createdAt: now,
    updatedAt: now,
  };
  drafts.push(saved);
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  return saved;
}

/** Removes a draft by id. Silently does nothing if the id is not found. */
export async function deleteDraft(id: string): Promise<void> {
  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  if (!raw) return;
  const drafts: RecipeData[] = JSON.parse(raw);
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.filter(d => d.id !== id)));
}

/** Soft-deletes a published recipe by stamping deletedAt. The record stays in
 *  AsyncStorage until purgeDeletedRecipes() runs on next app startup. */
export async function softDeletePublished(id: string): Promise<void> {
  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  if (!raw) return;
  const drafts: RecipeData[] = JSON.parse(raw);
  const idx = drafts.findIndex(d => d.id === id);
  if (idx < 0) return;
  drafts[idx] = { ...drafts[idx], deletedAt: new Date().toISOString() };
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

/** Permanently removes any soft-deleted records. Call once at app startup. */
export async function purgeDeletedRecipes(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    if (!raw) return;
    const drafts: RecipeData[] = JSON.parse(raw);
    const cleaned = drafts.filter(d => !d.deletedAt);
    if (cleaned.length !== drafts.length) {
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(cleaned));
    }
  } catch { /* best-effort */ }
}
