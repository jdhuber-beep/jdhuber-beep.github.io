// Sets up Firebase once, and shares the Auth and Firestore handles with the
// other scripts. Every page imports from this file.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// True while firebase-config.js still holds the PASTE_ placeholders.
const configIsPlaceholder = Object.values(firebaseConfig).some((value) => String(value).includes('PASTE_'));

// The emulators are used when there is no real config yet, or when the page
// is opened with ?emulator=1 (handy for testing after the real config exists).
const useEmulators = configIsPlaceholder || new URLSearchParams(window.location.search).has('emulator');

const activeConfig = useEmulators
  ? { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-solar-explorer', appId: 'demo-app' }
  : firebaseConfig;

const app = initializeApp(activeConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const usingEmulators = useEmulators;

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
