import { RecipeData } from '../components/RecipeCard';

function getServerUrl(): string {
  const url = process.env.EXPO_PUBLIC_SERVER_URL;
  if (!url) throw new Error('EXPO_PUBLIC_SERVER_URL is not set. Add it to your .env file.');
  return url;
}

export async function voiceToRecipe(localUri: string, currentRecipe?: Partial<RecipeData>): Promise<Partial<RecipeData>> {
  const formData = new FormData();
  formData.append('audio', {
    uri: localUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  if (currentRecipe) {
    // Send only the recipe content fields — no id, status, photo, dates
    const context = {
      title:       currentRecipe.title       ?? '',
      servings:    currentRecipe.servings    ?? '',
      prepTime:    currentRecipe.prepTime    ?? '',
      cookTime:    currentRecipe.cookTime    ?? '',
      ingredients: (currentRecipe.ingredients ?? []).filter(i => i.trim()),
      directions:  (currentRecipe.directions  ?? []).filter(d => d.trim()),
    };
    formData.append('currentRecipe', JSON.stringify(context));
  }

  const response = await fetch(`${getServerUrl()}/api/voice-to-recipe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    if (json.error === 'no_speech') throw new Error('no_speech');
    throw new Error(`Server error (${response.status}): ${json.error ?? response.statusText}`);
  }

  const json = await response.json();
  return json.recipe as Partial<RecipeData>;
}
