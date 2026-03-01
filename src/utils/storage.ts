import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecipeData } from '../components/RecipeCard';

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

/** Sets a recipe's status to 'published' and returns the updated object. */
export async function publishRecipe(id: string): Promise<RecipeData> {
  const now = new Date().toISOString();
  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  const drafts: RecipeData[] = raw ? JSON.parse(raw) : [];
  const idx = drafts.findIndex(d => d.id === id);
  if (idx < 0) throw new Error('Recipe not found');
  const published = { ...drafts[idx], status: 'published' as const, updatedAt: now };
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
