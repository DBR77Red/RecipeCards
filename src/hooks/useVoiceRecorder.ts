import { Audio } from 'expo-av';
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

  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => {
      setHasPermission(granted);
    });

    return () => {
      clearTick();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
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
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI() ?? null;
      setAudioUri(uri);
    } catch {
      setAudioUri(null);
    }
    recordingRef.current = null;
    setState('stopped');
  };

  const startRecording = async () => {
    if (state === 'recording') return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recordingRef.current = recording;
    setElapsed(0);
    setState('recording');

    intervalRef.current = setInterval(async () => {
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
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    setAudioUri(null);
    setElapsed(0);
    setState('idle');
  };

  return { state, elapsed, audioUri, hasPermission, startRecording, stopRecording, reset };
}
