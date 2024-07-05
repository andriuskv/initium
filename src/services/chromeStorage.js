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

async function get(id) {
  const item = await chrome.storage.sync.get(id);
  return item[id];
}

function set(value, updateLocally = false) {
  isLocalChange = !updateLocally;
  return chrome.storage.sync.set(value);
}

function getBytesInUse(id) {
  return chrome.storage.sync.getBytesInUse(id);
}

export {
  subscribeToChanges,
  get,
  set,
  getBytesInUse
};
