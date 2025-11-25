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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;

