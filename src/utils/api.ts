import { Platform } from 'react-native';
import { RecipeData } from '../components/RecipeCard';

export function getApiBase(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3001`;
  }
  return process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export async function uploadRecipe(recipe: RecipeData): Promise<string> {
  const res = await fetch(`${getApiBase()}/api/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipe),
  });
  if (!res.ok) throw new Error('Failed to upload recipe');
  const data = await res.json();
  return data.shareUrl as string;
}

export async function fetchSharedRecipe(url: string): Promise<RecipeData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Recipe not found');
  return res.json();
}
