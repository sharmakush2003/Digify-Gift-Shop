import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyABkgMPNCDnTBnuCOnqx1JwA3ZKBqq50n4",
  authDomain: "orient-crockeries.firebaseapp.com",
  projectId: "orient-crockeries",
  storageBucket: "orient-crockeries.firebasestorage.app",
  messagingSenderId: "758606616031",
  appId: "1:758606616031:web:590d48df12c12407b2e06a",
  measurementId: "G-RZTVHSCW79"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
