/**
 * Firebase Initialization and Configuration
 * Fully integrated with provisioned Firebase Firestore and Firebase Authentication.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: appletConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: appletConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: appletConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: appletConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: appletConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: appletConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    
    // Connect to specific provisioned databaseId or default Firestore with resilient long-polling auto-detection
    const dbId = appletConfig.firestoreDatabaseId;
    const firestoreSettings = {
      experimentalAutoDetectLongPolling: true,
    };

    try {
      if (dbId && dbId !== '(default)') {
        db = initializeFirestore(app, firestoreSettings, dbId);
      } else {
        db = initializeFirestore(app, firestoreSettings);
      }
    } catch (fsInitErr) {
      if (dbId && dbId !== '(default)') {
        db = getFirestore(app, dbId);
      } else {
        db = getFirestore(app);
      }
    }

    try {
      storage = getStorage(app);
    } catch (sErr) {
      console.warn('Firebase Storage init notice:', sErr);
    }
  } catch (error) {
    console.warn('Firebase initialization error, falling back to local multi-tab sync mode:', error);
  }
}

export { app, auth, db, storage, firebaseConfig };

