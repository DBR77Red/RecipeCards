import { emptyRecipe } from '../utils/recipe';

describe('emptyRecipe', () => {
  it('returns a recipe with blank string fields', () => {
    const r = emptyRecipe();
    expect(r.id).toBe('');
    expect(r.title).toBe('');
    expect(r.creatorName).toBe('');
    expect(r.servings).toBe('');
    expect(r.prepTime).toBe('');
    expect(r.cookTime).toBe('');
    expect(r.photo).toBeNull();
  });

  it('starts as a draft', () => {
    expect(emptyRecipe().status).toBe('draft');
  });

  it('seeds ingredients and directions with one empty entry each', () => {
    const r = emptyRecipe();
    expect(r.ingredients).toEqual(['']);
    expect(r.directions).toEqual(['']);
  });

  it('sets createdAt and updatedAt to a valid ISO date', () => {
    const before = Date.now();
    const r = emptyRecipe();
    const after = Date.now();
    const created = new Date(r.createdAt).getTime();
    const updated = new Date(r.updatedAt).getTime();
    expect(created).toBeGreaterThanOrEqual(before);
    expect(created).toBeLessThanOrEqual(after);
    expect(updated).toBeGreaterThanOrEqual(before);
    expect(updated).toBeLessThanOrEqual(after);
  });

  it('returns a new object on every call', () => {
    const a = emptyRecipe();
    const b = emptyRecipe();
    expect(a).not.toBe(b);
    a.ingredients.push('something');
    expect(b.ingredients).toHaveLength(1);
  });
});
