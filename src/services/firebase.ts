import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB3vqPqFJXQibegAgqcWu50TWLsBY_pWGI",
  authDomain: "chatapp-cec7a.firebaseapp.com",
  projectId: "chatapp-cec7a",
  storageBucket: "chatapp-cec7a.firebasestorage.app",
  messagingSenderId: "977247538614",
  appId: "1:977247538614:web:58096d75ea7427a4488517"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);