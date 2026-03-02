import { Platform } from 'react-native';
import { RecipeData } from '../components/RecipeCard';

function getServerUrl(): string {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  return 'http://localhost:3001';
}

export async function parseRecipeFromTranscript(
  transcript: string
): Promise<Partial<RecipeData>> {
  const serverUrl = getServerUrl();

  const response = await fetch(`${serverUrl}/api/parse-recipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Recipe parsing failed (${response.status}): ${text}`);
  }

  const json = await response.json();
  if (!json.recipe) {
    throw new Error('No recipe data returned from server.');
  }
  return json.recipe as Partial<RecipeData>;
}
