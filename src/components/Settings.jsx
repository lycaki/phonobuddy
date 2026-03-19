import { useState } from 'react';
import PhonoBuddyOwl from './PhonoBuddyOwl';
import FamilyCode from './FamilyCode';
import { db, getAllRecordingIds, getRecordingBlob, saveRecordingBlob } from '../utils/storage';
import { PHONEMES } from '../data/phonemes';
import { MASTERY_LEVELS } from '../data/leitner';

export default function Settings({ familyCode, onSetFamilyCode, onPullFromCloud, syncStatus, onReset, progress, sessionCount, onSyncProgress, onPullProgress, progressSyncStatus }) {
  const [cleared, setCleared] = useState(null);
  const [backupStatus, setBackupStatus] = useState(null);

  const introduced = Object.values(progress).filter(p => p.introduced).length;
  const totalCorrect = Object.values(progress).reduce((s, p) => s + (p.correct || 0), 0);
  const totalIncorrect = Object.values(progress).reduce((s, p) => s + (p.incorrect || 0), 0);

  // ─── BACKUP: Export all recordings as a zip-like download ───
  async function backupRecordings() {
    setBackupStatus('working');
    try {
      const ids = await getAllRecordingIds();
      if (ids.length === 0) {
        setBackupStatus('empty');
        setTimeout(() => setBackupStatus(null), 2000);
        return;
      }

      // Create a JSON manifest + base64 audio blobs
      const manifest = { version: 1, date: new Date().toISOString(), recordings: {} };
      for (const id of ids) {
        const blob = await getRecordingBlob(id);
        if (blob) {
          const buffer = await blob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          manifest.recordings[id] = { type: blob.type, data: base64 };
        }
      }

      const json = JSON.stringify(manifest);
      const downloadBlob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phonobuddy-recordings-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const soundCount = ids.filter(id => !id.startsWith('word:')).length;
      const wordCount = ids.filter(id => id.startsWith('word:')).length;
      const savedCount = Object.keys(manifest.recordings).length;
      setBackupStatus(`done-${soundCount}-${wordCount}-${savedCount}`);
      setTimeout(() => setBackupStatus(null), 5000);
    } catch (e) {
      console.error('Backup failed:', e);
      setBackupStatus('error');
      setTimeout(() => setBackupStatus(null), 3000);
    }
  }

  // ─── RESTORE: Import a backup file ───
  async function restoreRecordings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setBackupStatus('restoring');
      try {
        const text = await file.text();
        const manifest = JSON.parse(text);
        if (!manifest.recordings) throw new Error('Invalid backup file');

        let restored = 0;
        for (const [id, rec] of Object.entries(manifest.recordings)) {
          const binary = atob(rec.data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: rec.type || 'audio/webm' });
          await saveRecordingBlob(id, blob);
          restored++;
        }

        setBackupStatus(`restored-${restored}`);
        setTimeout(() => { setBackupStatus(null); window.location.reload(); }, 2000);
      } catch (err) {
        console.error('Restore failed:', err);
        setBackupStatus('error');
        setTimeout(() => setBackupStatus(null), 3000);
      }
    };
    input.click();
  }

  // ─── BACKUP: Export all progress data ───
  async function backupProgress() {
    setBackupStatus('working');
    try {
      const allProgress = await db.progress.toArray();
      const sessions = await db.sessions.toArray();
      const settings = await db.settings.toArray();

      const backup = {
        version: 1,
        date: new Date().toISOString(),
        progress: allProgress,
        sessions,
        settings: settings.filter(s => s.key !== 'familyCode'), // don't export family code
      };

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phonobuddy-progress-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus('done');
      setTimeout(() => setBackupStatus(null), 3000);
    } catch (e) {
      console.error('Progress backup failed:', e);
      setBackupStatus('error');
      setTimeout(() => setBackupStatus(null), 3000);
    }
  }

  async function clearProgress() {
    if (!confirm("Clear all learning progress? Recordings will be kept.")) return;
    await db.progress.clear();
    await db.settings.delete('sessionCount');
    setCleared('progress');
    onReset();
  }

  async function clearRecordings() {
    if (!confirm("Delete all recorded sounds? Make sure you've backed up first!")) return;
    await db.recordings.clear();
    setCleared('recordings');
    window.location.reload();
  }

  async function clearHistory() {
    if (!confirm("Clear session history?")) return;
    await db.sessions.clear();
    setCleared('history');
  }

  async function clearEverything() {
    if (!confirm("WIPE EVERYTHING? Progress, recordings, history, family code — all gone. Have you backed up?")) return;
    await db.progress.clear();
    await db.recordings.clear();
    await db.sessions.clear();
    await db.settings.clear();
    setCleared('all');
    window.location.reload();
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <PhonoBuddyOwl size={60} mood="happy" />
        <div>
          <h2 style={{fontFamily:"'Fredoka'",fontSize:28,color:"#ffd966",margin:0}}>Settings</h2>
          <p style={{fontFamily:"'Andika'",fontSize:16,color:"#a0aec0",margin:0}}>Manage your PhonoBuddy</p>
        </div>
      </div>

      {/* Data summary */}
      <div style={{background:"#1a2744",borderRadius:16,padding:16,marginBottom:16}}>
        <h3 style={{fontFamily:"'Fredoka'",fontSize:16,color:"#4ecdc4",margin:"0 0 10px"}}>Current Data</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0"}}>Sessions completed</div>
          <div style={{fontFamily:"'Fredoka'",fontSize:14,color:"#f0f0f0",textAlign:"right"}}>{sessionCount}</div>
          <div style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0"}}>Sounds introduced</div>
          <div style={{fontFamily:"'Fredoka'",fontSize:14,color:"#f0f0f0",textAlign:"right"}}>{introduced} of {PHONEMES.length}</div>
          <div style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0"}}>Total correct answers</div>
          <div style={{fontFamily:"'Fredoka'",fontSize:14,color:"#7bc67e",textAlign:"right"}}>{totalCorrect}</div>
          <div style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0"}}>Total incorrect answers</div>
          <div style={{fontFamily:"'Fredoka'",fontSize:14,color:"#e88d8d",textAlign:"right"}}>{totalIncorrect}</div>
        </div>
      </div>

      {/* Cloud sync */}
      <FamilyCode
        familyCode={familyCode}
        onSetCode={onSetFamilyCode}
        onPullFromCloud={onPullFromCloud}
        syncStatus={syncStatus}
      />

      {/* PROGRESS SYNC */}
      {familyCode && (
        <div style={{background:"#1a2744",borderRadius:16,padding:16,marginTop:16}}>
          <h3 style={{fontFamily:"'Fredoka'",fontSize:16,color:"#b088f9",margin:"0 0 8px"}}>📊 Progress Sync</h3>
          <p style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0",margin:"0 0 12px"}}>
            Sync Logan's mastery levels, scores, and session history across devices.
            Progress auto-syncs after every session.
          </p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button onClick={onSyncProgress} disabled={progressSyncStatus === 'syncing'} style={{
              background: progressSyncStatus === 'syncing' ? "#2a3a5c" : "#b088f9",
              border:"none",borderRadius:10,padding:"10px 14px",fontSize:14,
              fontFamily:"'Fredoka'",color: progressSyncStatus === 'syncing' ? "#a0aec0" : "#0f1729",cursor:"pointer",
            }}>
              {progressSyncStatus === 'syncing' ? '⏫ Syncing...' : '⬆️ Push progress'}
            </button>
            <button onClick={onPullProgress} disabled={progressSyncStatus === 'syncing'} style={{
              background: progressSyncStatus === 'syncing' ? "#2a3a5c" : "#4ecdc4",
              border:"none",borderRadius:10,padding:"10px 14px",fontSize:14,
              fontFamily:"'Fredoka'",color: progressSyncStatus === 'syncing' ? "#a0aec0" : "#0f1729",cursor:"pointer",
            }}>
              {progressSyncStatus === 'syncing' ? '⏬ Syncing...' : '⬇️ Pull progress'}
            </button>
          </div>
          {progressSyncStatus === 'done' && <p style={{fontFamily:"'Andika'",fontSize:12,color:"#7bc67e",margin:"8px 0 0",textAlign:"center"}}>✅ Progress synced!</p>}
          {progressSyncStatus === 'error' && <p style={{fontFamily:"'Andika'",fontSize:12,color:"#e88d8d",margin:"8px 0 0",textAlign:"center"}}>❌ Sync failed — check connection</p>}
        </div>
      )}

      {/* BACKUP / RESTORE */}
      <div style={{background:"#1a2744",borderRadius:16,padding:16,marginTop:16,marginBottom:16}}>
        <h3 style={{fontFamily:"'Fredoka'",fontSize:16,color:"#7bc67e",margin:"0 0 8px"}}>💾 Backup & Restore</h3>
        <p style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0",margin:"0 0 12px"}}>
          Save your recordings and progress before making changes. You've done all the sounds — keep them safe!
        </p>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button onClick={backupRecordings} style={{background:"#1e3d2f",border:"2px solid #7bc67e",borderRadius:10,padding:"12px 12px",fontSize:13,color:"#7bc67e",cursor:"pointer",fontFamily:"'Fredoka'",textAlign:"center"}}>
            📦 Backup Recordings
          </button>
          <button onClick={restoreRecordings} style={{background:"#1e2d4f",border:"2px solid #4ecdc4",borderRadius:10,padding:"12px 12px",fontSize:13,color:"#4ecdc4",cursor:"pointer",fontFamily:"'Fredoka'",textAlign:"center"}}>
            📂 Restore Recordings
          </button>
          <button onClick={backupProgress} style={{background:"#1e3d2f",border:"2px solid #7bc67e",borderRadius:10,padding:"12px 12px",fontSize:13,color:"#7bc67e",cursor:"pointer",fontFamily:"'Fredoka'",textAlign:"center"}}>
            📊 Backup Progress
          </button>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:8}}>
            <span style={{fontFamily:"'Andika'",fontSize:11,color:"#a0aec0",textAlign:"center"}}>
              Backups save as JSON files you can keep anywhere
            </span>
          </div>
        </div>

        {backupStatus && (
          <p style={{fontFamily:"'Andika'",fontSize:13,marginTop:8,color:
            backupStatus === 'done' ? "#7bc67e" :
            backupStatus === 'working' || backupStatus === 'restoring' ? "#f4a261" :
            backupStatus === 'empty' ? "#a0aec0" :
            backupStatus.startsWith('restored') ? "#7bc67e" : "#e88d8d"
          }}>
            {backupStatus === 'working' && "Creating backup..."}
            {backupStatus === 'restoring' && "Restoring recordings..."}
            {backupStatus === 'done' && "✓ Backup downloaded!"}
            {backupStatus.startsWith('done-') && (() => {
              const [,sounds,words,total] = backupStatus.split('-');
              return `✓ Backed up ${total} recordings (${sounds} sounds, ${words} words)`;
            })()}
            {backupStatus === 'empty' && "No recordings to back up yet."}
            {backupStatus === 'error' && "✗ Backup failed — try again."}
            {backupStatus.startsWith('restored') && `✓ ${backupStatus.split('-')[1]} recordings restored! Reloading...`}
          </p>
        )}
      </div>

      {/* Reset options */}
      <div style={{padding:16,background:"#1a2744",borderRadius:16}}>
        <h3 style={{fontFamily:"'Fredoka'",fontSize:16,color:"#f4a261",margin:"0 0 12px"}}>Reset Options</h3>
        <p style={{fontFamily:"'Andika'",fontSize:13,color:"#a0aec0",margin:"0 0 12px"}}>
          Use these for testing or to start fresh. <strong style={{color:"#f4a261"}}>Back up first!</strong>
        </p>

        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={clearProgress} style={{background:"transparent",border:"1px solid #2a3a5c",borderRadius:10,padding:"10px 16px",fontSize:14,color:"#f4a261",cursor:"pointer",fontFamily:"'Andika'",textAlign:"left"}}>
            Reset learning progress <span style={{color:"#a0aec0",fontSize:12}}>— clears mastery levels, streaks, answers</span>
          </button>
          <button onClick={clearHistory} style={{background:"transparent",border:"1px solid #2a3a5c",borderRadius:10,padding:"10px 16px",fontSize:14,color:"#f4a261",cursor:"pointer",fontFamily:"'Andika'",textAlign:"left"}}>
            Clear session history <span style={{color:"#a0aec0",fontSize:12}}>— removes the session log</span>
          </button>
          <button onClick={clearRecordings} style={{background:"transparent",border:"1px solid #2a3a5c",borderRadius:10,padding:"10px 16px",fontSize:14,color:"#e88d8d",cursor:"pointer",fontFamily:"'Andika'",textAlign:"left"}}>
            Delete all recordings <span style={{color:"#a0aec0",fontSize:12}}>— removes local audio files</span>
          </button>
          <button onClick={clearEverything} style={{background:"#2a1010",border:"2px solid #e88d8d",borderRadius:10,padding:"12px 16px",fontSize:14,color:"#e88d8d",cursor:"pointer",fontFamily:"'Fredoka'",textAlign:"left"}}>
            WIPE EVERYTHING <span style={{color:"#a0aec0",fontSize:12}}>— total reset for testing</span>
          </button>
        </div>

        {cleared && (
          <p style={{fontFamily:"'Andika'",fontSize:13,color:"#7bc67e",marginTop:8}}>
            {cleared === 'all' ? 'Everything cleared! Reloading...' :
             cleared === 'progress' ? 'Progress cleared!' :
             cleared === 'recordings' ? 'Recordings deleted! Reloading...' :
             'History cleared!'}
          </p>
        )}
      </div>
    </div>
  );
}
