import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// v7.2.15: Firebase config with environment variable support
// SECURITY NOTE: Firebase API keys are designed to be public.
// Security is enforced through Firebase Security Rules, not API key secrecy.
// Override these via .env file if needed (see .env.example)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCCIww51kzyr3eN2oJn24D7SmFptfdK_2o",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "ekamanam.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "ekamanam",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "ekamanam.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "662515641730",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:662515641730:web:a1534c00347df3cc0cb39b"
};

// Check if Firebase is actually configured
const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

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

