// Home page: public. Updates the header for signed-in users and shows a
// note after a sign-out.

import { initPage, showMessage } from './auth.js';

initPage({ required: false }).then((user) => {
  const banner = document.getElementById('pageMessage');
  const params = new URLSearchParams(window.location.search);

  if (params.has('signedout')) {
    showMessage(banner, 'You are signed out. Sign in again any time to keep exploring.', 'success');
  } else if (user) {
    showMessage(banner, 'Welcome back, ' + user.email + '. The Explorer, Facts, and Contact pages are open to you.', 'success');
  }
});
