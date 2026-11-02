// Firebase project settings.
//
// Paste the "firebaseConfig" object from the Firebase console here:
//   Project settings > General > Your apps > SDK setup and configuration > Config
//
// Until real values are pasted in, the site talks to the local Firebase
// emulators instead (see SETUP.md), so it can be developed and tested
// without a live project.

export const firebaseConfig = {
  apiKey: 'AIzaSyClR9p1yXNYnOd3mrZvRA3voddTI6xhmCA',
  authDomain: 'solar-explorer-f310d.firebaseapp.com',
  projectId: 'solar-explorer-f310d',
  storageBucket: 'solar-explorer-f310d.firebasestorage.app',
  messagingSenderId: '1065117615816',
  appId: '1:1065117615816:web:8938e5e5f2e4f8cb4787fd'
};

// Email address allowed to load the solar system data into the database.
// Must match the account used on seed.html. Also used in firestore.rules.
export const OWNER_EMAIL = 'jdhuber@go.olemiss.edu';
