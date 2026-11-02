// Contact page: saves the form to the "messages" collection in Firestore and
// confirms the save with a reference number. Also lists the signed-in user's
// earlier messages, read back from the database.

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { db } from './firebase-app.js';
import { initPage, describeError, setBusy, showMessage, clearMessage } from './auth.js';

let currentUser = null;

// Formats a Firestore timestamp for display. Messages just saved may not
// have their server time yet, so fall back to "just now".
function formatWhen(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return 'just now';
  }
  return timestamp.toDate().toLocaleString();
}

// Builds one list item for an earlier message. Returns the li element.
function createSentItem(messageData) {
  const item = document.createElement('li');
  const label = document.createElement('strong');
  label.textContent = messageData.topic + ' · ' + formatWhen(messageData.createdAt);
  const text = document.createElement('span');
  text.textContent = messageData.message;
  item.append(label, text);
  return item;
}

// Reads the user's own messages. Sorting happens here rather than in the
// query so no extra database index is needed.
function loadSentMessages() {
  const sentStatus = document.getElementById('sentStatus');
  const sentList = document.getElementById('sentList');
  showMessage(sentStatus, 'Loading your messages...', 'info');

  const ownMessages = query(collection(db, 'messages'), where('uid', '==', currentUser.uid));
  return getDocs(ownMessages)
    .then((snapshot) => {
      const messages = snapshot.docs.map((messageDoc) => messageDoc.data());
      messages.sort((a, b) => {
        const aTime = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : Date.now();
        const bTime = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : Date.now();
        return bTime - aTime;
      });

      sentList.innerHTML = '';
      if (messages.length === 0) {
        showMessage(sentStatus, 'You have not sent any messages yet.', 'info');
        return;
      }
      showMessage(sentStatus, 'You have sent ' + messages.length + (messages.length === 1 ? ' message.' : ' messages.'), 'info');
      messages.forEach((messageData) => sentList.appendChild(createSentItem(messageData)));
    })
    .catch((error) => {
      showMessage(sentStatus, 'Your earlier messages could not be loaded. ' + describeError(error), 'error');
    });
}

// Checks the fields and returns the first problem as text, or null if fine.
function validateForm(form) {
  if (!form.name.value.trim()) {
    form.name.focus();
    return 'Please enter your name.';
  }
  const email = form.email.value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    form.email.focus();
    return 'Please enter a valid reply-to email address.';
  }
  if (!form.topic.value) {
    form.topic.focus();
    return 'Please choose a topic.';
  }
  if (!form.message.value.trim()) {
    form.message.focus();
    return 'Please write a message before sending.';
  }
  return null;
}

function setUpContactForm() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('contactMessageStatus');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearMessage(status);

    const problem = validateForm(form);
    if (problem) {
      showMessage(status, problem, 'error');
      return;
    }

    const messageData = {
      uid: currentUser.uid,
      accountEmail: currentUser.email,
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      topic: form.topic.value,
      message: form.message.value.trim(),
      createdAt: serverTimestamp()
    };

    setBusy(true, 'Sending your message...');
    addDoc(collection(db, 'messages'), messageData)
      .then((savedDoc) => {
        setBusy(false);
        form.message.value = '';
        showMessage(
          status,
          'Thanks, ' + messageData.name + '. Your message was saved to the database. Reference number: ' + savedDoc.id,
          'success'
        );
        status.focus();
        return loadSentMessages();
      })
      .catch((error) => {
        setBusy(false);
        showMessage(status, 'Your message was not saved. ' + describeError(error), 'error');
      });
  });
}

initPage({ required: true }).then((user) => {
  if (!user) {
    return;
  }
  currentUser = user;
  document.getElementById('contactEmail').value = user.email || '';
  document.getElementById('contactMessageStatus').tabIndex = -1;
  setUpContactForm();
  loadSentMessages();
});
