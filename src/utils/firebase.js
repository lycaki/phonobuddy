// Firebase configuration for Realtime Database (free Spark plan)
// Create a project at https://console.firebase.google.com
// Enable Realtime Database in test mode

let firebaseApp = null;
let firebaseDb = null;

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyBETQG4LYe9X0jnk16WDZAmpEVTCDzU_fI",
  authDomain: "phonobuddy-6bf48.firebaseapp.com",
  databaseURL: "https://phonobuddy-6bf48-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "phonobuddy-6bf48",
  storageBucket: "phonobuddy-6bf48.firebasestorage.app",
  messagingSenderId: "698484056584",
  appId: "1:698484056584:web:336a84a9a95d4cdf9a67bd",
};

export async function getFirebaseDb() {
  if (firebaseDb) return firebaseDb;

  if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
    console.warn('[PhonoBuddy] Firebase not configured — cloud sync disabled');
    return null;
  }

  const { initializeApp } = await import('firebase/app');
  const { getDatabase } = await import('firebase/database');

  firebaseApp = initializeApp(firebaseConfig);
  firebaseDb = getDatabase(firebaseApp);
  return firebaseDb;
}

export function isFirebaseConfigured() {
  return !!(firebaseConfig.apiKey && firebaseConfig.databaseURL);
}

// Legacy export for anything still referencing storage
export async function getFirebaseStorage() {
  return null; // Using Realtime Database instead
}
