import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { RecipeData } from '../components/RecipeCard';
import { supabase } from '../lib/supabase';

const DRAFTS_KEY = '@recipecards/drafts';
const USER_NAME_KEY = '@recipecards/userName';
const ORDER_KEY = '@recipecards/order';

interface SectionOrder {
  drafts: string[];
  published: string[];
  received: string[];
}

export async function loadOrder(): Promise<SectionOrder> {
  try {
    const raw = await AsyncStorage.getItem(ORDER_KEY);
    return raw ? JSON.parse(raw) : { drafts: [], published: [], received: [] };
  } catch {
    return { drafts: [], published: [], received: [] };
  }
}

export async function saveOrder(
  section: keyof SectionOrder,
  orderedIds: string[],
): Promise<void> {
  try {
    const current = await loadOrder();
    current[section] = orderedIds;
    await AsyncStorage.setItem(ORDER_KEY, JSON.stringify(current));
  } catch {}
}

export function applyOrder(recipes: RecipeData[], savedIds: string[]): RecipeData[] {
  if (!savedIds.length) return recipes;
  const map = new Map(recipes.map(r => [r.id, r]));
  const ordered = savedIds.map(id => map.get(id)).filter(Boolean) as RecipeData[];
  const seen = new Set(savedIds);
  recipes.forEach(r => { if (!seen.has(r.id)) ordered.push(r); });
  return ordered;
}

// Serialized queue to prevent concurrent read-modify-write races on AsyncStorage.
// Every function that reads→modifies→writes DRAFTS_KEY must go through this lock.
let _lock = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = _lock.then(fn, fn);
  _lock = next.then(() => {}, () => {});
  return next;
}

/** Safely parse drafts JSON — returns [] on any parse error to prevent crashes from corrupted data. */
function safeParseDrafts(raw: string | null): RecipeData[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function getUserName(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(USER_NAME_KEY)) || '';
  } catch {
    return '';
  }
}

export async function setUserName(name: string): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_NAME_KEY, name);
  } catch { /* best-effort */ }
}

/** Returns all stored drafts sorted newest-updated first. Returns [] on any error. */
export async function getDrafts(): Promise<RecipeData[]> {
  try {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts = safeParseDrafts(raw);
    return [...drafts]
      .filter(d => !d.deletedAt)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

/**
 * Upserts a draft and returns the saved object (with id/timestamps filled in).
 * - If recipe.id is empty, assigns a new UUID.
 * - Always stamps updatedAt with the current time.
 */
export async function saveDraft(recipe: RecipeData): Promise<RecipeData> {
  return withLock(async () => {
    const now = new Date().toISOString();
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts = safeParseDrafts(raw);

    let saved: RecipeData;
    if (recipe.id) {
      saved = { ...recipe, updatedAt: now };
      const idx = drafts.findIndex(d => d.id === saved.id);
      if (idx >= 0) drafts[idx] = saved;
      else drafts.push(saved);
    } else {
      saved = {
        ...recipe,
        id: Crypto.randomUUID(),
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };
      drafts.push(saved);
    }

    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    return saved;
  });
}

/**
 * Step 1 of publishing: marks the recipe as published in local storage only.
 * Always succeeds — guarantees the QR code appears even if cloud sync fails.
 */
export async function markPublishedLocally(id: string): Promise<RecipeData> {
  return withLock(async () => {
    const now = new Date().toISOString();
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts = safeParseDrafts(raw);
    const idx = drafts.findIndex(d => d.id === id);
    if (idx < 0) throw new Error('Recipe not found');
    const published: RecipeData = {
      ...drafts[idx],
      status: 'published',
      updatedAt: now,
      shareUrl: `recipecards://card/${id}`,
      cloudSyncStatus: 'pending',
    };
    drafts[idx] = published;
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    return published;
  });
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

  // Update local storage with the public cloud photo URL and mark as synced
  const synced: RecipeData = { ...recipe, photo: photoUrl, updatedAt: now, cloudSyncStatus: 'synced' };
  await withLock(async () => {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts = safeParseDrafts(raw);
    const idx = drafts.findIndex(d => d.id === recipe.id);
    if (idx >= 0) {
      drafts[idx] = synced;
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    }
  });
  return synced;
}

/**
 * Increments the receive_count on a Supabase recipe row atomically.
 * Best-effort — silently ignores errors.
 */
export async function incrementReceiveCount(id: string): Promise<void> {
  try {
    await supabase.rpc('increment_receive_count', { recipe_id: id });
  } catch { /* non-critical */ }
}

/**
 * Saves a card received from another user as a read-only published record.
 * Never editable — always has isReceived: true and sourceCardId pointing to the
 * original Supabase card ID. Deduplicates: if this card was already saved,
 * returns the existing record and does NOT increment the count again.
 */
export async function saveReceivedCard(recipe: RecipeData): Promise<RecipeData> {
  let isNew = false;

  const saved = await withLock(async () => {
    const now = new Date().toISOString();
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts = safeParseDrafts(raw);

    // Deduplication — soft-deleted records are excluded so a user who deleted their
    // own card can still receive a shared copy, and a user who deleted a received
    // card can receive it again.
    //
    // Three checks in order:
    // 1. New-format received card (has sourceCardId set)
    // 2. Own published card (same id, not received)
    // 3. Old-format received card (pre-sourceCardId migration): match by title +
    //    creatorName + shareUrl since createdAt was overwritten at receive time.
    //    This is intentionally conservative (three fields) to avoid false positives.
    const existing = drafts.find(d => {
      if (d.deletedAt) return false;
      if (d.isReceived && d.sourceCardId === recipe.id) return true;
      if (!d.isReceived && d.id === recipe.id) return true;
      // Legacy: received card saved before sourceCardId was introduced
      if (
        d.isReceived &&
        !d.sourceCardId &&
        d.title === recipe.title &&
        d.creatorName === recipe.creatorName &&
        d.shareUrl === recipe.shareUrl
      ) return true;
      return false;
    });
    if (existing) return existing;

    isNew = true;
    const newRecord: RecipeData = {
      ...recipe,
      id: Crypto.randomUUID(),
      sourceCardId: recipe.id,
      status: 'published',
      isReceived: true,
      createdAt: now,
      updatedAt: now,
    };
    drafts.push(newRecord);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    return newRecord;
  });

  if (isNew) await incrementReceiveCount(recipe.id);

  return saved;
}

/** Toggles isFavorite on a recipe. Returns the new value, or false if not found. */
export async function toggleFavorite(id: string): Promise<boolean> {
  return withLock(async () => {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts = safeParseDrafts(raw);
    const idx = drafts.findIndex(d => d.id === id);
    if (idx < 0) return false;
    const newValue = !drafts[idx].isFavorite;
    drafts[idx] = { ...drafts[idx], isFavorite: newValue };
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    return newValue;
  });
}

/** Removes a draft by id. Silently does nothing if the id is not found. */
export async function deleteDraft(id: string): Promise<void> {
  return withLock(async () => {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts = safeParseDrafts(raw);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.filter(d => d.id !== id)));
  });
}

/** Soft-deletes a published recipe by stamping deletedAt. The record stays in
 *  AsyncStorage until purgeDeletedRecipes() runs on next app startup. */
export async function softDeletePublished(id: string): Promise<void> {
  return withLock(async () => {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts = safeParseDrafts(raw);
    const idx = drafts.findIndex(d => d.id === id);
    if (idx < 0) return;
    drafts[idx] = { ...drafts[idx], deletedAt: new Date().toISOString() };
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  });
}

/** Permanently removes any soft-deleted records. Call once at app startup. */
export async function purgeDeletedRecipes(): Promise<void> {
  try {
    await withLock(async () => {
      const raw = await AsyncStorage.getItem(DRAFTS_KEY);
      const drafts = safeParseDrafts(raw);
      const cleaned = drafts.filter(d => !d.deletedAt);
      if (cleaned.length !== drafts.length) {
        await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(cleaned));
      }
    });
  } catch { /* best-effort */ }
}
