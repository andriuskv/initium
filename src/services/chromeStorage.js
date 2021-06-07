/* global chrome */

const handlers = [];
let isLocalChange = false;

(function listenToChanges() {
  chrome.storage.onChanged.addListener(changes => {
    if (isLocalChange) {
      isLocalChange = false;
      return;
    }
    handlers.forEach(handler => handler(changes));
  });
})();

function subscribeToChanges(handler) {
  handlers.push(handler);
}

function get(id) {
  return new Promise(resolve => {
    chrome.storage.sync.get(id, sync => {
      resolve(sync[id]);
    });
  });
}

function set(value) {
  isLocalChange = true;
  chrome.storage.sync.set(value);
}

export {
  subscribeToChanges,
  get,
  set
};
