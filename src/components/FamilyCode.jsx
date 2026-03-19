import { useState } from 'react';
import { generateFamilyCode, uploadAllRecordings } from '../utils/cloudSync';
import { isFirebaseConfigured } from '../utils/firebase';
import { getAllRecordingIds, getRecordingBlob } from '../utils/storage';

export default function FamilyCode({ familyCode, onSetCode, onPullFromCloud, syncStatus }) {
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [pullResult, setPullResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const firebaseReady = isFirebaseConfigured();

  function handleCreate() {
    const code = generateFamilyCode();
    onSetCode(code);
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Code must be 6 characters');
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const count = await onPullFromCloud(code);
      onSetCode(code);
      setPullResult(count);
    } catch {
      setError('Could not find recordings for that code. Check and try again.');
    }
    setJoining(false);
  }

  async function handleUploadAll() {
    if (!familyCode) return;
    setUploading(true);
    setUploadProgress({ done: 0, total: 0 });
    try {
      const count = await uploadAllRecordings(
        familyCode,
        getAllRecordingIds,
        getRecordingBlob,
        (done, total) => setUploadProgress({ done, total })
      );
      setUploadProgress({ done: count, total: count, complete: true });
    } catch (e) {
      console.error('Upload all failed:', e);
      setError('Upload failed: ' + e.message);
    }
    setUploading(false);
  }

  if (!firebaseReady) {
    return (
      <div style={{background:"#1a2744",borderRadius:16,padding:20}}>
        <h3 style={{fontFamily:"'Fredoka'",fontSize:18,color:"#f4a261",margin:"0 0 12px"}}>☁️ Cloud Sync</h3>
        <p style={{fontFamily:"'Andika'",fontSize:14,color:"#a0aec0",margin:0,lineHeight:1.6}}>
          Cloud sync is not yet configured. To enable syncing recordings across devices,
          add your Firebase project config to <code style={{color:"#4ecdc4"}}>src/utils/firebase.js</code>.
        </p>
      </div>
    );
  }

  return (
    <div style={{background:"#1a2744",borderRadius:16,padding:20}}>
      <h3 style={{fontFamily:"'Fredoka'",fontSize:18,color:"#ffd966",margin:"0 0 12px"}}>☁️ Family Code — Cloud Sync</h3>

      {familyCode ? (
        <div>
          <p style={{fontFamily:"'Andika'",fontSize:14,color:"#a0aec0",margin:"0 0 12px"}}>
            Your recordings sync to the cloud with this code. Use it on another device to download them.
          </p>
          <div style={{background:"#0f1729",borderRadius:12,padding:16,textAlign:"center",marginBottom:16}}>
            <div style={{fontFamily:"'Fredoka'",fontSize:36,color:"#4ecdc4",letterSpacing:8}}>{familyCode}</div>
          </div>

          {/* Upload all button */}
          <button
            onClick={handleUploadAll}
            disabled={uploading}
            style={{
              background: uploading ? "#2a3a5c" : "linear-gradient(135deg, #4ecdc4, #44a08d)",
              border:"none",borderRadius:12,padding:"14px 20px",fontSize:16,
              fontFamily:"'Fredoka'",color: uploading ? "#a0aec0" : "#0f1729",
              cursor: uploading ? "default" : "pointer",
              width:"100%",marginBottom:12,
            }}
          >
            {uploading
              ? `⏫ Uploading... ${uploadProgress?.done || 0}/${uploadProgress?.total || '?'}`
              : "⬆️ Upload ALL recordings to cloud"
            }
          </button>

          {uploadProgress?.complete && (
            <p style={{fontFamily:"'Andika'",fontSize:14,color:"#7bc67e",margin:"0 0 12px",textAlign:"center"}}>
              ✅ {uploadProgress.done} recordings uploaded!
            </p>
          )}

          {/* Status indicators */}
          {syncStatus === 'uploading' && <p style={{fontFamily:"'Andika'",fontSize:13,color:"#f4a261",margin:"4px 0"}}>Uploading recording...</p>}
          {syncStatus === 'downloading' && <p style={{fontFamily:"'Andika'",fontSize:13,color:"#4ecdc4",margin:"4px 0"}}>Downloading recordings...</p>}
          {pullResult !== null && <p style={{fontFamily:"'Andika'",fontSize:13,color:"#7bc67e",margin:"4px 0"}}>Downloaded {pullResult} recordings!</p>}
          {error && <p style={{fontFamily:"'Andika'",fontSize:13,color:"#e88d8d",margin:"4px 0"}}>{error}</p>}
        </div>
      ) : (
        <div>
          <p style={{fontFamily:"'Andika'",fontSize:14,color:"#a0aec0",margin:"0 0 16px"}}>
            Create a family code to sync recordings across devices, or join an existing one.
          </p>
          <div style={{display:"flex",gap:12,marginBottom:16}}>
            <button onClick={handleCreate} style={{flex:1,background:"#4ecdc4",border:"none",borderRadius:12,padding:"14px 20px",fontSize:16,fontFamily:"'Fredoka'",color:"#0f1729",cursor:"pointer"}}>
              🆕 Create New Code
            </button>
          </div>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:16}}>
            <p style={{fontFamily:"'Andika'",fontSize:14,color:"#a0aec0",margin:"0 0 8px"}}>Or join an existing family:</p>
            <div style={{display:"flex",gap:8}}>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                style={{flex:1,background:"#0f1729",border:"2px solid #2a3a5c",borderRadius:10,padding:"10px 14px",fontSize:20,fontFamily:"'Fredoka'",color:"white",textAlign:"center",letterSpacing:4}}
              />
              <button onClick={handleJoin} disabled={joining} style={{background:"#ffd966",border:"none",borderRadius:10,padding:"10px 20px",fontSize:16,fontFamily:"'Fredoka'",color:"#0f1729",cursor:"pointer",opacity:joining?0.6:1}}>
                {joining ? '...' : 'Join'}
              </button>
            </div>
            {error && <p style={{fontFamily:"'Andika'",fontSize:13,color:"#e88d8d",marginTop:8}}>{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
