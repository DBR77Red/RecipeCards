import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'recording' | 'stopped';

export interface VoiceRecorderResult {
  state: RecorderState;
  elapsed: number;
  audioUri: string | null;
  hasPermission: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  reset: () => void;
}

const MAX_SECONDS = 60;

export function useVoiceRecorder(): VoiceRecorderResult {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    requestRecordingPermissionsAsync().then(({ granted }) => {
      setHasPermission(granted);
    });

    return () => {
      clearTick();
    };
  }, []);

  function clearTick() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  const stopRecording = async () => {
    clearTick();
    try {
      await recorder.stop();
      setAudioUri(recorder.uri ?? null);
    } catch {
      setAudioUri(null);
    }
    setState('stopped');
  };

  const startRecording = async () => {
    if (state === 'recording') return;

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });

    await recorder.prepareToRecordAsync();
    recorder.record();
    setElapsed(0);
    setState('recording');

    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= MAX_SECONDS) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  };

  const reset = () => {
    clearTick();
    setAudioUri(null);
    setElapsed(0);
    setState('idle');
  };

  return { state, elapsed, audioUri, hasPermission, startRecording, stopRecording, reset };
}
