import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecipeData } from '../components/RecipeCard';

const DRAFTS_KEY = '@recipecards/drafts';

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
    saved = { ...recipe, status: 'draft', updatedAt: now };
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

/** Removes a draft by id. Silently does nothing if the id is not found. */
export async function deleteDraft(id: string): Promise<void> {
  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  if (!raw) return;
  const drafts: RecipeData[] = JSON.parse(raw);
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.filter(d => d.id !== id)));
}
