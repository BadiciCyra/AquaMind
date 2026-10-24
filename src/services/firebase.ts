import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AquaSettings, SipRecord } from '../types';

export { onAuthStateChanged };

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with custom databaseId if specified
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface CloudUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  personName?: string;
  todayTotalDrank: number;
  todayDateStr: string;
  settings: AquaSettings;
  sips?: SipRecord[];
  updatedAt?: unknown;
}

/**
 * Signs in with Google Popup
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Creates new account with Email & Password
 */
export async function registerWithEmail(email: string, pass: string, name?: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && userCredential.user) {
    await updateProfile(userCredential.user, { displayName: name });
  }
  return userCredential.user;
}

/**
 * Signs in with Email & Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

/**
 * Sends a password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Signs out
 */
export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Fetches user data from Firestore
 */
export async function fetchUserData(uid: string): Promise<CloudUserData | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as CloudUserData;
    }
    return null;
  } catch (err) {
    console.error('[Firebase] fetchUserData error:', err);
    return null;
  }
}

/**
 * Syncs user data (settings, todayTotalDrank, personName, sips) to Firestore
 */
export async function syncUserDataToCloud(
  uid: string,
  data: Partial<CloudUserData>
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firebase] syncUserDataToCloud warning:', err);
  }
}

export type { User };
