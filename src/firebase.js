import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyBJ-ApEeab37v-uEJ7tL4ytVzzfwRcSodA',
  authDomain:        'cft-calculator-746eb.firebaseapp.com',
  projectId:         'cft-calculator-746eb',
  storageBucket:     'cft-calculator-746eb.firebasestorage.app',
  messagingSenderId: '888740878211',
  appId:             '1:888740878211:web:5c2896f01eeb270dd4c8b6',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
