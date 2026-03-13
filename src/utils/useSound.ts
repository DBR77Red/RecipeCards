import { useAudioPlayer } from 'expo-audio';

/**
 * Thin wrapper around expo-audio's useAudioPlayer.
 * The constructor mismatch is handled by patchAudioModule() in App.tsx.
 * Returns a play() function that rewinds and plays the sound.
 */
export function useSound(source: number): () => void {
  const player = useAudioPlayer(source);
  return () => {
    player.seekTo(0).then(() => player.play()).catch(() => {});
  };
}
