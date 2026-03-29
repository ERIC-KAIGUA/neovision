// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getStorage } from "firebase/storage"
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzeim66RnN0ZdT3XO5QBcLwyvuf-eyV3w",
  authDomain: "neovision-22326.firebaseapp.com",
  projectId: "neovision-22326",
  storageBucket: "neovision-22326.firebasestorage.app",
  messagingSenderId: "261527157902",
  appId: "1:261527157902:web:ff9c98ce644128e8f8dddf",
  measurementId: "G-V1Z0T4QHXY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()