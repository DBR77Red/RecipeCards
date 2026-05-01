import Constants from 'expo-constants';
import AudioModule from 'expo-audio/build/AudioModule';

/**
 * Expo Go ships with a pre-compiled expo-audio whose native AudioPlayer constructor
 * accepts only 3 args (source, updateInterval, keepAudioSessionActive).
 *
 * Local dev/production builds compile expo-audio from node_modules, where the
 * native constructor accepts 4 args (adds preferredForwardBufferDuration).
 *
 * ExpoAudio.js always calls: new AudioModule.AudioPlayer(source, updateInterval,
 * keepAudioSessionActive, preferredForwardBufferDuration) — 4 args.
 *
 * So in Expo Go we intercept the constructor and drop the 4th arg.
 * In any other environment (bare/standalone) we leave it untouched.
 */
export function patchAudioModule() {
  if (Constants.appOwnership !== 'expo') return;

  const mutableAudioModule = AudioModule as typeof AudioModule & {
    AudioPlayer: typeof AudioModule.AudioPlayer;
  };
  const OrigClass = mutableAudioModule.AudioPlayer;
  mutableAudioModule.AudioPlayer = new Proxy(OrigClass, {
    construct(target: any, args: any[]) {
      return Reflect.construct(target, args.slice(0, 3));
    },
  }) as typeof OrigClass;
}
