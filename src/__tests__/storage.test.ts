/**
 * Tests for src/utils/storage.ts
 *
 * AsyncStorage is auto-mocked by jest-expo via
 * @react-native-async-storage/async-storage/jest/async-storage-mock
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetCounter } from './__mocks__/expo-crypto';

// Import after mocks are in place
import {
  applyOrder,
  getDrafts,
  saveDraft,
  deleteDraft,
  softDeletePublished,
  purgeDeletedRecipes,
  markPublishedLocally,
  toggleFavorite,
} from '../utils/storage';
import type { RecipeData } from '../components/RecipeCard';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeRecipe(overrides: Partial<RecipeData> = {}): RecipeData {
  return {
    id: 'r1',
    status: 'draft',
    title: 'Pancakes',
    creatorName: 'Alice',
    photo: null,
    servings: '2',
    prepTime: '10',
    cookTime: '15',
    ingredients: ['flour', 'eggs'],
    directions: ['mix', 'fry'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const DRAFTS_KEY = '@recipecards/drafts';

async function seedStorage(recipes: RecipeData[]) {
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(recipes));
}

// ─── applyOrder (pure function) ───────────────────────────────────────────────

describe('applyOrder', () => {
  const a = makeRecipe({ id: 'a' });
  const b = makeRecipe({ id: 'b' });
  const c = makeRecipe({ id: 'c' });

  it('returns recipes in the saved order', () => {
    expect(applyOrder([a, b, c], ['c', 'a', 'b'])).toEqual([c, a, b]);
  });

  it('appends recipes not present in savedIds at the end', () => {
    const result = applyOrder([a, b, c], ['b']);
    expect(result[0]).toEqual(b);
    expect(result).toContain(a);
    expect(result).toContain(c);
  });

  it('returns original array when savedIds is empty', () => {
    expect(applyOrder([a, b, c], [])).toEqual([a, b, c]);
  });

  it('skips ids in savedIds that no longer exist', () => {
    expect(applyOrder([a, b], ['z', 'a', 'b'])).toEqual([a, b]);
  });
});

// ─── getDrafts ────────────────────────────────────────────────────────────────

describe('getDrafts', () => {
  beforeEach(() => AsyncStorage.clear());

  it('returns [] when storage is empty', async () => {
    expect(await getDrafts()).toEqual([]);
  });

  it('returns [] on corrupted JSON', async () => {
    await AsyncStorage.setItem(DRAFTS_KEY, 'not-json{{{');
    expect(await getDrafts()).toEqual([]);
  });

  it('sorts by updatedAt newest first', async () => {
    const older = makeRecipe({ id: 'old', updatedAt: '2024-01-01T00:00:00.000Z' });
    const newer = makeRecipe({ id: 'new', updatedAt: '2024-06-01T00:00:00.000Z' });
    await seedStorage([older, newer]);
    const result = await getDrafts();
    expect(result[0].id).toBe('new');
    expect(result[1].id).toBe('old');
  });

  it('excludes soft-deleted records', async () => {
    const deleted = makeRecipe({ id: 'del', deletedAt: '2024-02-01T00:00:00.000Z' });
    const active = makeRecipe({ id: 'active' });
    await seedStorage([deleted, active]);
    const result = await getDrafts();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('active');
  });
});

// ─── saveDraft ────────────────────────────────────────────────────────────────

describe('saveDraft', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    resetCounter();
  });

  it('assigns a new id when recipe.id is empty', async () => {
    const recipe = makeRecipe({ id: '' });
    const saved = await saveDraft(recipe);
    expect(saved.id).toBe('mock-uuid-1');
    expect(saved.status).toBe('draft');
  });

  it('stamps createdAt and updatedAt on new recipe', async () => {
    const before = Date.now();
    const saved = await saveDraft(makeRecipe({ id: '' }));
    const after = Date.now();
    expect(new Date(saved.createdAt).getTime()).toBeGreaterThanOrEqual(before);
    expect(new Date(saved.updatedAt).getTime()).toBeLessThanOrEqual(after);
  });

  it('updates an existing recipe by id', async () => {
    const original = makeRecipe({ id: 'r1', title: 'Original' });
    await seedStorage([original]);
    const updated = await saveDraft({ ...original, title: 'Updated' });
    expect(updated.title).toBe('Updated');
    const drafts = await getDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0].title).toBe('Updated');
  });

  it('bumps updatedAt on update', async () => {
    const original = makeRecipe({ id: 'r1', updatedAt: '2020-01-01T00:00:00.000Z' });
    await seedStorage([original]);
    const saved = await saveDraft({ ...original, title: 'Changed' });
    expect(saved.updatedAt).not.toBe('2020-01-01T00:00:00.000Z');
  });

  it('appends when id not found in storage', async () => {
    await seedStorage([makeRecipe({ id: 'existing' })]);
    await saveDraft(makeRecipe({ id: 'brand-new' }));
    const drafts = JSON.parse((await AsyncStorage.getItem(DRAFTS_KEY))!);
    expect(drafts).toHaveLength(2);
  });

  it('persists to AsyncStorage', async () => {
    await saveDraft(makeRecipe({ id: '', title: 'Stored' }));
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed[0].title).toBe('Stored');
  });
});

// ─── deleteDraft ──────────────────────────────────────────────────────────────

describe('deleteDraft', () => {
  beforeEach(() => AsyncStorage.clear());

  it('removes a recipe by id', async () => {
    await seedStorage([makeRecipe({ id: 'r1' }), makeRecipe({ id: 'r2' })]);
    await deleteDraft('r1');
    const drafts = await getDrafts();
    expect(drafts.map(d => d.id)).not.toContain('r1');
    expect(drafts.map(d => d.id)).toContain('r2');
  });

  it('does nothing when id not found', async () => {
    await seedStorage([makeRecipe({ id: 'r1' })]);
    await deleteDraft('does-not-exist');
    const drafts = await getDrafts();
    expect(drafts).toHaveLength(1);
  });
});

// ─── softDeletePublished ──────────────────────────────────────────────────────

describe('softDeletePublished', () => {
  beforeEach(() => AsyncStorage.clear());

  it('stamps deletedAt and hides the record from getDrafts', async () => {
    await seedStorage([makeRecipe({ id: 'r1', status: 'published' })]);
    await softDeletePublished('r1');
    const drafts = await getDrafts();
    expect(drafts).toHaveLength(0);
    // Record still physically present in storage
    const raw = JSON.parse((await AsyncStorage.getItem(DRAFTS_KEY))!);
    expect(raw[0].deletedAt).toBeDefined();
  });

  it('does nothing when id not found', async () => {
    await seedStorage([makeRecipe({ id: 'r1' })]);
    await softDeletePublished('missing');
    const raw = JSON.parse((await AsyncStorage.getItem(DRAFTS_KEY))!);
    expect(raw[0].deletedAt).toBeUndefined();
  });
});

// ─── purgeDeletedRecipes ──────────────────────────────────────────────────────

describe('purgeDeletedRecipes', () => {
  beforeEach(() => AsyncStorage.clear());

  it('removes soft-deleted records permanently', async () => {
    const deleted = makeRecipe({ id: 'del', deletedAt: '2024-01-01T00:00:00.000Z' });
    const active = makeRecipe({ id: 'active' });
    await seedStorage([deleted, active]);
    await purgeDeletedRecipes();
    const raw = JSON.parse((await AsyncStorage.getItem(DRAFTS_KEY))!);
    expect(raw).toHaveLength(1);
    expect(raw[0].id).toBe('active');
  });

  it('is a no-op when nothing is deleted', async () => {
    await seedStorage([makeRecipe({ id: 'r1' })]);
    await purgeDeletedRecipes();
    const raw = JSON.parse((await AsyncStorage.getItem(DRAFTS_KEY))!);
    expect(raw).toHaveLength(1);
  });
});

// ─── markPublishedLocally ─────────────────────────────────────────────────────

describe('markPublishedLocally', () => {
  beforeEach(() => AsyncStorage.clear());

  it('sets status=published and stamps shareUrl', async () => {
    await seedStorage([makeRecipe({ id: 'r1' })]);
    const result = await markPublishedLocally('r1');
    expect(result.status).toBe('published');
    expect(result.shareUrl).toBe('recipecards://card/r1');
    expect(result.cloudSyncStatus).toBe('pending');
  });

  it('throws when recipe id is not found', async () => {
    await seedStorage([]);
    await expect(markPublishedLocally('nope')).rejects.toThrow('Recipe not found');
  });
});

// ─── toggleFavorite ───────────────────────────────────────────────────────────

describe('toggleFavorite', () => {
  beforeEach(() => AsyncStorage.clear());

  it('sets isFavorite=true on first toggle', async () => {
    await seedStorage([makeRecipe({ id: 'r1' })]);
    const result = await toggleFavorite('r1');
    expect(result).toBe(true);
  });

  it('toggles back to false on second call', async () => {
    await seedStorage([makeRecipe({ id: 'r1', isFavorite: true } as any)]);
    const result = await toggleFavorite('r1');
    expect(result).toBe(false);
  });

  it('returns false when id not found', async () => {
    await seedStorage([]);
    expect(await toggleFavorite('missing')).toBe(false);
  });
});
