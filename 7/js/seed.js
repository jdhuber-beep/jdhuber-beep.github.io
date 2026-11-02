// Owner tool: writes data/solar-system.json into the "groups" collection.
// One document per group, holding that group's objects array. Firestore
// rules only let the owner's email write here.

import { collection, doc, getDocs, writeBatch } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { db } from './firebase-app.js';
import { OWNER_EMAIL } from './firebase-config.js';
import { initPage, describeError, setBusy, showMessage } from './auth.js';

const DATA_URL = 'data/solar-system.json';

function countGroups() {
  const status = document.getElementById('seedStatus');
  setBusy(true, 'Reading the database...');
  return getDocs(collection(db, 'groups'))
    .then((snapshot) => {
      setBusy(false);
      if (snapshot.empty) {
        showMessage(status, 'The database has no groups yet. Press "Load solar system data" to add them.', 'info');
      } else {
        const names = snapshot.docs.map((groupDoc) => groupDoc.data().name).join(', ');
        showMessage(status, 'The database holds ' + snapshot.size + ' groups: ' + names + '.', 'success');
      }
    })
    .catch((error) => {
      setBusy(false);
      showMessage(status, 'Could not read the database. ' + describeError(error), 'error');
    });
}

function seedGroups() {
  const status = document.getElementById('seedStatus');
  setBusy(true, 'Loading the data into the database...');
  return fetch(DATA_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Could not read ' + DATA_URL + ' (status ' + response.status + ').');
      }
      return response.json();
    })
    .then((solarData) => {
      const batch = writeBatch(db);
      solarData.groups.forEach((group, index) => {
        batch.set(doc(db, 'groups', group.id), {
          name: group.name,
          summary: group.summary,
          description: group.description,
          order: index,
          objects: group.objects
        });
      });
      return batch.commit().then(() => solarData.groups.length);
    })
    .then((count) => {
      setBusy(false);
      showMessage(status, 'Done. ' + count + ' groups were written to the database. The Explorer will show them now.', 'success');
    })
    .catch((error) => {
      setBusy(false);
      showMessage(status, 'The data was not loaded. ' + describeError(error), 'error');
    });
}

initPage({ required: true }).then((user) => {
  if (!user) {
    return;
  }
  const status = document.getElementById('seedStatus');
  if (user.email !== OWNER_EMAIL) {
    showMessage(status, 'You are signed in as ' + user.email + ', which is not the owner account, so the database will refuse writes from here.', 'error');
  }
  document.getElementById('checkButton').addEventListener('click', countGroups);
  document.getElementById('seedButton').addEventListener('click', seedGroups);
});
