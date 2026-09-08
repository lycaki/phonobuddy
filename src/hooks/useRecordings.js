import { useState, useEffect, useCallback, useRef } from 'react';
import { saveRecordingBlob, getRecordingBlob, getAllRecordingIds, addMissingRecording } from '../utils/storage';
import { speak, stopSpeaking } from '../utils/speech';
import { playRecordedAudio } from '../utils/recordedAudio';

export function useRecordings(familyCode) {
  const [recordingIds, setRecordingIds] = useState(new Set());
  const [localScanComplete, setLocalScanComplete] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const urlCache = useRef({});
  const autoPullCode = useRef(null);

  // Load existing recording IDs on mount
  useEffect(() => {
    getAllRecordingIds().then(keys => {
      console.log(`[PhonoBuddy] Loaded ${keys.length} recordings from DB`, keys.filter(k => k.startsWith('word:')).length, 'words');
      setRecordingIds(new Set(keys));
      setLocalScanComplete(true);
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
  const playSound = useCallback(async (id, options = {}) => {
    if (options.signal?.aborted) return false;
    stopSpeaking();
    // Try DB directly — this avoids stale closure issues with recordingIds
    const blob = await getRecordingBlob(id);
    if (options.signal?.aborted) return false;
    if (blob && blob.size > 0) {
      // Got a recording from DB — play it
      let url = urlCache.current[id];
      if (!url) {
        url = URL.createObjectURL(blob);
        urlCache.current[id] = url;
      }
      try {
        return await playRecordedAudio(url, options);
      } catch (e) {
        console.warn(`[PhonoBuddy] Audio play failed for "${id}":`, e);
        return false;
      }
    }

    // Word readers cannot safely model isolated phonemes or pseudo-words.
    if (!id.startsWith('word:') || options.allowTts === false) return false;
    return speak(id.slice(5), undefined, { signal: options.signal });
  }, []); // No dependencies — reads DB directly every time

  const pullFromCloud = useCallback(async (code) => {
    setSyncStatus('downloading');
    try {
      const { downloadAllRecordingEntries } = await import('../utils/cloudSync');
      const remoteRecordings = await downloadAllRecordingEntries(code);
      let saved = 0;
      for (const [recordingId, entry] of Object.entries(remoteRecordings)) {
        if (await addMissingRecording(recordingId, entry.blob, entry.updated || 0)) saved++;
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

  // A returning device already has its family code, so there is no Join click
  // to trigger the initial recording download. Pull automatically when its
  // local pure-sound bank is incomplete. This avoids downloading every word
  // recording again on ordinary launches where the bank is already present.
  useEffect(() => {
    if (!familyCode || !localScanComplete || autoPullCode.current === familyCode) return;
    const localSoundCount = [...recordingIds].filter(id => !id.startsWith('word:')).length;
    if (localSoundCount >= 50) {
      autoPullCode.current = familyCode;
      return;
    }

    autoPullCode.current = familyCode;
    pullFromCloud(familyCode).catch(() => {
      autoPullCode.current = null;
    });
  }, [familyCode, localScanComplete, pullFromCloud, recordingIds]);

  // Cleanup URLs on unmount
  useEffect(() => {
    const cachedUrls = urlCache.current;
    return () => {
      Object.values(cachedUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return { saveRecording, getPlaybackUrl, hasRecording, playSound, pullFromCloud, syncStatus, recordingIds };
}
