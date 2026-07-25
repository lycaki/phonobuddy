import { createContext } from 'react';

export const RecordingsContext = createContext({
  playSound: () => {},
  saveRecording: () => {},
  getPlaybackUrl: () => null,
  hasRecording: () => false,
  syncStatus: 'idle',
  recordingIds: new Set(),
});
