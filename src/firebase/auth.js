/**
 * Firebase Silent Anonymous Authentication Helper
 */
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

export async function initAnonymousAuth() {
  if (!isFirebaseConfigured || !auth) {
    return { uid: 'local_' + Math.random().toString(36).substring(2, 9), isAnonymous: true };
  }

  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        resolve(user);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          resolve(userCredential.user);
        } catch (error) {
          console.warn('Anonymous sign in error, fallback to local ID:', error);
          resolve({ uid: 'anon_' + Math.random().toString(36).substring(2, 9), isAnonymous: true });
        }
      }
    });
  });
}
