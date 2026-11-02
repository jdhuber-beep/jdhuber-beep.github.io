// User accounts: sign up, sign in, sign out, change password, and the
// "are you signed in?" check that protects pages after the home page.
// Also keeps the account area in the site header up to date.

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { auth, usingEmulators } from './firebase-app.js';

// Plain-English versions of the Firebase error codes a user is likely to hit.
const ERROR_MESSAGES = {
  'auth/invalid-email': 'That email address does not look right. Check it and try again.',
  'auth/missing-password': 'Please enter your password.',
  'auth/missing-email': 'Please enter your email address.',
  'auth/weak-password': 'Passwords need at least 6 characters.',
  'auth/email-already-in-use': 'There is already an account with that email. Try signing in instead.',
  'auth/invalid-credential': 'The email or password is wrong. Check both and try again.',
  'auth/wrong-password': 'That password is wrong. Check it and try again.',
  'auth/user-not-found': 'No account uses that email. You can create one on this page.',
  'auth/too-many-requests': 'Too many attempts in a row. Wait a minute, then try again.',
  'auth/network-request-failed': 'Could not reach the server. Check your connection and try again.',
  'auth/requires-recent-login': 'For safety, please sign out and sign in again before changing your password.',
  'permission-denied': 'You do not have permission to do that. Make sure you are signed in.',
  'unavailable': 'The database could not be reached. Check your connection and try again.'
};

// Turns any error from Firebase into a sentence the user can act on.
export function describeError(error) {
  if (error && error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  if (error && error.message) {
    return error.message.replace(/^Firebase: /, '').replace(/ \(auth\/[a-z-]+\)\.?$/, '');
  }
  return 'Something went wrong. Please try again.';
}

// Resolves with the current user (or null) once Firebase knows who is signed in.
export function getCurrentUser() {
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, (user) => {
      stop();
      resolve(user);
    });
  });
}

export function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logOut() {
  return signOut(auth);
}

// Confirms the current password first, then sets the new one.
export function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user) {
    return Promise.reject(new Error('You need to be signed in to change your password.'));
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  return reauthenticateWithCredential(user, credential).then(() => updatePassword(user, newPassword));
}

// ---- Shared page pieces -------------------------------------------------

// Shows or hides the "Working..." spinner. Pass a message to describe the wait.
export function setBusy(isBusy, message) {
  const busyElement = document.getElementById('busyIndicator');
  if (!busyElement) {
    return;
  }
  const textElement = busyElement.querySelector('.busy-text');
  if (textElement && message) {
    textElement.textContent = message;
  }
  busyElement.hidden = !isBusy;
  document.body.classList.toggle('is-busy', isBusy);
}

// Writes a message into a status box. kind is 'info', 'success', or 'error'.
export function showMessage(element, text, kind) {
  element.textContent = text;
  element.classList.remove('status-error', 'status-success');
  if (kind === 'error') {
    element.classList.add('status-error');
  } else if (kind === 'success') {
    element.classList.add('status-success');
  }
  element.hidden = !text;
}

export function clearMessage(element) {
  showMessage(element, '', 'info');
}

// Fills the account area in the header: a sign-in link for visitors, or the
// user's email with Account and Log out controls once signed in.
export function renderAccountNav(user) {
  const accountItem = document.getElementById('accountNav');
  if (!accountItem) {
    return;
  }
  accountItem.innerHTML = '';

  if (!user) {
    const loginLink = document.createElement('a');
    loginLink.className = 'login-button';
    loginLink.href = 'login.html';
    loginLink.textContent = 'Log In / Sign Up';
    if (document.body.dataset.page === 'login') {
      loginLink.setAttribute('aria-current', 'page');
    }
    accountItem.appendChild(loginLink);
    return;
  }

  const emailElement = document.createElement('span');
  emailElement.className = 'signed-in-as';
  emailElement.textContent = 'Signed in as ' + user.email;

  const accountLink = document.createElement('a');
  accountLink.href = 'login.html';
  accountLink.textContent = 'Account';
  if (document.body.dataset.page === 'login') {
    accountLink.setAttribute('aria-current', 'page');
  }

  const logoutButton = document.createElement('button');
  logoutButton.type = 'button';
  logoutButton.className = 'logout-button';
  logoutButton.textContent = 'Log out';
  logoutButton.addEventListener('click', () => {
    setBusy(true, 'Signing you out...');
    logOut()
      .then(() => {
        window.location.href = 'index.html?signedout=1';
      })
      .catch((error) => {
        setBusy(false);
        const banner = document.getElementById('pageMessage');
        if (banner) {
          showMessage(banner, describeError(error), 'error');
        }
      });
  });

  accountItem.append(emailElement, accountLink, logoutButton);
}

// Adds a small note when the site is talking to the local emulators,
// so test accounts are not mistaken for real ones.
function renderEmulatorNote() {
  if (!usingEmulators) {
    return;
  }
  const header = document.querySelector('.site-header');
  if (!header) {
    return;
  }
  const note = document.createElement('p');
  note.className = 'emulator-note';
  note.textContent = 'Development mode: using the local Firebase emulators.';
  header.appendChild(note);
}

// Call on every page. Resolves with the user (or null) after the header is
// updated. Pages that need a signed-in user pass { required: true }: visitors
// then see a sign-in prompt instead of the page content.
export function initPage(options) {
  const required = Boolean(options && options.required);
  renderEmulatorNote();
  const gate = document.getElementById('signInGate');
  const content = document.getElementById('pageContent');

  return getCurrentUser().then((user) => {
    renderAccountNav(user);

    if (required) {
      const checking = document.getElementById('authChecking');
      if (checking) {
        checking.hidden = true;
      }
      if (user) {
        if (content) {
          content.hidden = false;
        }
      } else if (gate) {
        gate.hidden = false;
        const gateHeading = gate.querySelector('h2');
        if (gateHeading) {
          gateHeading.focus();
        }
      }
    }
    return user;
  });
}
