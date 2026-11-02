// Account page: sign in, create an account, change password, log out.
// Every request shows the spinner while it runs and reports the result
// in a status box next to the form, never with window.alert().

import {
  initPage,
  signIn,
  signUp,
  logOut,
  changePassword,
  describeError,
  setBusy,
  showMessage,
  clearMessage,
  renderAccountNav
} from './auth.js';

// Pages a visitor can be sent back to after signing in.
const ALLOWED_NEXT_PAGES = ['explorer.html', 'facts.html', 'contact.html', 'seed.html'];

function nextPageAfterSignIn() {
  const next = new URLSearchParams(window.location.search).get('next');
  return ALLOWED_NEXT_PAGES.includes(next) ? next : 'index.html';
}

function showVisitorPanel() {
  document.getElementById('visitorPanel').hidden = false;
  document.getElementById('memberPanel').hidden = true;
  const next = new URLSearchParams(window.location.search).get('next');
  if (next && ALLOWED_NEXT_PAGES.includes(next)) {
    showMessage(document.getElementById('pageMessage'), 'Please sign in to open that page. You will be sent back to it afterwards.', 'info');
  }
}

function showMemberPanel(user) {
  document.getElementById('visitorPanel').hidden = true;
  document.getElementById('memberPanel').hidden = false;
  document.getElementById('memberEmail').textContent = user.email;
  renderAccountNav(user);
}

// Handles the sign-in form.
function setUpSignIn() {
  const form = document.getElementById('signInForm');
  const message = document.getElementById('signInMessage');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearMessage(message);
    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      showMessage(message, 'Enter both your email and your password.', 'error');
      return;
    }

    setBusy(true, 'Signing you in...');
    signIn(email, password)
      .then(() => {
        window.location.href = nextPageAfterSignIn();
      })
      .catch((error) => {
        setBusy(false);
        showMessage(message, describeError(error), 'error');
      });
  });
}

// Handles the create-account form.
function setUpSignUp() {
  const form = document.getElementById('signUpForm');
  const message = document.getElementById('signUpMessage');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearMessage(message);
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirm = form.confirm.value;

    if (!email) {
      showMessage(message, 'Enter an email address for the account.', 'error');
      return;
    }
    if (password.length < 6) {
      showMessage(message, 'Passwords need at least 6 characters.', 'error');
      return;
    }
    if (password !== confirm) {
      showMessage(message, 'The two passwords do not match. Type them again.', 'error');
      return;
    }

    setBusy(true, 'Creating your account...');
    signUp(email, password)
      .then(() => {
        window.location.href = nextPageAfterSignIn();
      })
      .catch((error) => {
        setBusy(false);
        showMessage(message, describeError(error), 'error');
      });
  });
}

// Handles the change-password form.
function setUpChangePassword() {
  const form = document.getElementById('changePasswordForm');
  const message = document.getElementById('changePasswordMessage');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearMessage(message);
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    const confirm = form.newPasswordConfirm.value;

    if (!currentPassword) {
      showMessage(message, 'Enter your current password first.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showMessage(message, 'The new password needs at least 6 characters.', 'error');
      return;
    }
    if (newPassword === currentPassword) {
      showMessage(message, 'The new password is the same as the current one. Pick a different one.', 'error');
      return;
    }
    if (newPassword !== confirm) {
      showMessage(message, 'The two new passwords do not match. Type them again.', 'error');
      return;
    }

    setBusy(true, 'Changing your password...');
    changePassword(currentPassword, newPassword)
      .then(() => {
        setBusy(false);
        form.reset();
        showMessage(message, 'Your password was changed. Use the new one next time you sign in.', 'success');
      })
      .catch((error) => {
        setBusy(false);
        showMessage(message, describeError(error), 'error');
      });
  });
}

function setUpLogOut() {
  document.getElementById('logOutButton').addEventListener('click', () => {
    setBusy(true, 'Signing you out...');
    logOut()
      .then(() => {
        window.location.href = 'index.html?signedout=1';
      })
      .catch((error) => {
        setBusy(false);
        showMessage(document.getElementById('pageMessage'), describeError(error), 'error');
      });
  });
}

setUpSignIn();
setUpSignUp();
setUpChangePassword();
setUpLogOut();

initPage({ required: false }).then((user) => {
  document.getElementById('authChecking').hidden = true;
  if (user) {
    showMemberPanel(user);
  } else {
    showVisitorPanel();
  }
});
