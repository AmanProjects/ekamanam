import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// v7.2.15: All Firebase config from environment variables
// SECURITY NOTE: Firebase API keys are designed to be public.
// Security is enforced through Firebase Security Rules, not API key secrecy.
// Configure these in your .env file (see .env.example)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Check if Firebase is actually configured (requires all env vars)
const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId
);

let app, auth, db, googleProvider;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();

    // Add Google Drive API scopes for seamless Drive integration
    // Users will be prompted once to grant these permissions during sign-in
    googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
    googleProvider.addScope('https://www.googleapis.com/auth/drive.appdata');

    db = getFirestore(app);
    console.log("✅ Firebase initialized successfully");
    console.log("✅ Google Drive scopes added");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    console.warn("Firebase features disabled. Check your configuration.");
  }
} else {
  console.info("ℹ️ Firebase not configured. App will work in local-only mode.");
}

export { auth, googleProvider, db, isFirebaseConfigured };
export default app;

