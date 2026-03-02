import { Platform } from 'react-native';

function getServerUrl(): string {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  return 'http://localhost:3001';
}

export async function transcribeAudio(localUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Voice recording is not supported on web.');
  }

  const serverUrl = getServerUrl();

  const formData = new FormData();
  formData.append('audio', {
    uri: localUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  const response = await fetch(`${serverUrl}/api/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Transcription failed (${response.status}): ${text}`);
  }

  const json = await response.json();
  if (!json.transcript && json.transcript !== '') {
    throw new Error('No transcript returned from server.');
  }
  return json.transcript as string;
}
