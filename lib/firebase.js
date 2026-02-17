import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyAjEK_VE8UWchejb_t7RtfnS7agGf2N-OY",
  authDomain: "efham-b7776.firebaseapp.com",
  projectId: "efham-b7776",
  storageBucket: "efham-b7776.firebasestorage.app",
  messagingSenderId: "507090246189",
  appId: "1:507090246189:web:1738689b1d4632639a76a4"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const provider = new GoogleAuthProvider();
export const auth = getAuth(app);
export const db = getFirestore(app);