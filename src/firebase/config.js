import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCCIww51kzyr3eN2oJn24D7SmFptfdK_2o",
  authDomain: "ekamanam.firebaseapp.com",
  projectId: "ekamanam",
  storageBucket: "ekamanam.firebasestorage.app",
  messagingSenderId: "662515641730",
  appId: "1:662515641730:web:a1534c00347df3cc0cb39b"
};

// Check if Firebase is actually configured
const isFirebaseConfigured = firebaseConfig.apiKey !== "AIzaSyDEMOKEY-REPLACE-WITH-YOUR-ACTUAL-KEY";

let app, auth, db, googleProvider;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
    console.log("✅ Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    console.warn("Firebase features disabled. Check your configuration.");
  }
} else {
  console.info("ℹ️ Firebase not configured. App will work in local-only mode.");
}

export { auth, googleProvider, db, isFirebaseConfigured };
export default app;

