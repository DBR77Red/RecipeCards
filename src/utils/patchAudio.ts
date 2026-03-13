/**
 * Patches expo-audio's AudioPlayer constructor to forward only 3 arguments
 * instead of 4. Needed because expo-audio 55.0.8 JS passes 4 args but the
 * native module in this build only accepts 3.
 *
 * Must be called once before any useAudioPlayer / createAudioPlayer usage.
 */
let patched = false;

export function patchAudioModule() {
  if (patched) return;
  try {
    const AudioModule = require('expo-audio/build/AudioModule').default;
    const NativePlayer = AudioModule.AudioPlayer;
    // Wrap constructor: drop the 4th arg (preferredForwardBufferDuration)
    AudioModule.AudioPlayer = function (
      this: any,
      source: any,
      updateInterval: number,
      keepAudioSessionActive: boolean,
    ) {
      return new NativePlayer(source, updateInterval, keepAudioSessionActive);
    };
    AudioModule.AudioPlayer.prototype = NativePlayer.prototype;
    patched = true;
  } catch (e) {
    console.warn('[patchAudio] Failed to patch AudioModule:', e);
  }
}
