/* global chrome */

const subscribers = [];
let isLocalChange = false;

(function listenToChanges() {
  chrome.storage.onChanged.addListener(changes => {
    for (const subscriber of subscribers) {
      if (isLocalChange) {
        if (subscriber.listenToLocal) {
          subscriber.handler(changes);
        }
      }
      else {
        subscriber.handler(changes);
      }
    }
    isLocalChange = false;
  });
})();

function subscribeToChanges(handler, { id, listenToLocal = false } = {}) {
  if (id) {
    const index = subscribers.findIndex(subscriber => subscriber.id === id);

    if (index >= 0) {
      const subscriber = subscribers[index];

      chrome.storage.onChanged.removeListener(subscriber.hanlder);
      subscribers.splice(index, 1);
    }
  }
  subscribers.push({ id, handler, listenToLocal });
}

function get(id) {
  return new Promise(resolve => {
    chrome.storage.sync.get(id, sync => {
      resolve(sync[id]);
    });
  });
}

function set(value, cb, updateLocally = false) {
  isLocalChange = !updateLocally;
  chrome.storage.sync.set(value, cb);
}

function getBytesInUse(name) {
  return new Promise(resolve => {
    chrome.storage.sync.getBytesInUse(name, resolve);
  });
}

export {
  subscribeToChanges,
  get,
  set,
  getBytesInUse
};
