import { useState, useEffect, useCallback, useRef } from 'react';
import { saveRecordingBlob, getRecordingBlob, getAllRecordingIds, getRecordingRecord } from '../utils/storage';
import { speakPhoneme } from '../utils/speech';

export function useRecordings(familyCode) {
  const [recordingIds, setRecordingIds] = useState(new Set());
  const [syncStatus, setSyncStatus] = useState('idle');
  const urlCache = useRef({});

  // Load existing recording IDs on mount
  useEffect(() => {
    getAllRecordingIds().then(keys => {
      console.log(`[PhonoBuddy] Loaded ${keys.length} recordings from DB`, keys.filter(k => k.startsWith('word:')).length, 'words');
      setRecordingIds(new Set(keys));
    });
  }, []);

  const saveRecording = useCallback(async (recordingId, blob) => {
    const timestamp = Date.now();
    await saveRecordingBlob(recordingId, blob, timestamp);
    setRecordingIds(prev => new Set([...prev, recordingId]));

    // Revoke old cached URL
    if (urlCache.current[recordingId]) {
      URL.revokeObjectURL(urlCache.current[recordingId]);
      delete urlCache.current[recordingId];
    }

    // Upload to Firebase if family code exists
    if (familyCode) {
      setSyncStatus('uploading');
      try {
        const { uploadRecording } = await import('../utils/cloudSync');
        await uploadRecording(familyCode, recordingId, blob, timestamp);
        setSyncStatus('idle');
      } catch (e) {
        console.error('Upload failed:', e);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    }
  }, [familyCode]);

  const getPlaybackUrl = useCallback(async (recordingId) => {
    if (urlCache.current[recordingId]) return urlCache.current[recordingId];
    const blob = await getRecordingBlob(recordingId);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.current[recordingId] = url;
    return url;
  }, []);

  const hasRecording = useCallback((recordingId) => {
    return recordingIds.has(recordingId);
  }, [recordingIds]);

  // Play a sound or word: ALWAYS check DB directly, never rely only on in-memory Set
  const playSound = useCallback(async (id) => {
    // Try DB directly — this avoids stale closure issues with recordingIds
    const blob = await getRecordingBlob(id);
    if (blob && blob.size > 0) {
      // Got a recording from DB — play it
      let url = urlCache.current[id];
      if (!url) {
        url = URL.createObjectURL(blob);
        urlCache.current[id] = url;
      }
      try {
        const audio = new Audio(url);
        await audio.play();
        return;
      } catch (e) {
        console.warn(`[PhonoBuddy] Audio play failed for "${id}":`, e);
        // Fall through to TTS
      }
    }

    // No recording found — use TTS fallback
    if (id.startsWith('word:')) {
      const { speak } = await import('../utils/speech');
      speak(id.slice(5), 0.7);
    } else {
      speakPhoneme(id);
    }
  }, []); // No dependencies — reads DB directly every time

  const pullFromCloud = useCallback(async (code) => {
    setSyncStatus('downloading');
    try {
      const { downloadAllRecordingEntries } = await import('../utils/cloudSync');
      const remoteRecordings = await downloadAllRecordingEntries(code);
      let saved = 0;
      for (const [recordingId, entry] of Object.entries(remoteRecordings)) {
        const local = await getRecordingRecord(recordingId);
        const localTimestamp = local?.timestamp || 0;
        const remoteTimestamp = entry.updated || 0;
        if (!local?.blob || remoteTimestamp >= localTimestamp) {
          await saveRecordingBlob(recordingId, entry.blob, remoteTimestamp || Date.now());
          saved++;
        }
      }
      const keys = await getAllRecordingIds();
      setRecordingIds(new Set(keys));
      setSyncStatus('idle');
      return saved;
    } catch (e) {
      console.error('Pull failed:', e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
      throw e;
    }
  }, []);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(urlCache.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return { saveRecording, getPlaybackUrl, hasRecording, playSound, pullFromCloud, syncStatus, recordingIds };
}
