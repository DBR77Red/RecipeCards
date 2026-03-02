import { RecipeData } from '../components/RecipeCard';

function getServerUrl(): string {
  const url = process.env.EXPO_PUBLIC_SERVER_URL;
  if (!url) throw new Error('EXPO_PUBLIC_SERVER_URL is not set. Add it to your .env file.');
  return url;
}

export async function voiceToRecipe(localUri: string): Promise<Partial<RecipeData>> {
  const formData = new FormData();
  formData.append('audio', {
    uri: localUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

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
