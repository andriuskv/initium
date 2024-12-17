/* global chrome */

import { formatBytes } from "utils";

type Subscriber = {
  id: string,
  listenToLocal?: boolean,
  handler: (changes: { [key: string]: chrome.storage.StorageChange; }) => void,
}

const MAX_QUOTA = chrome.storage.sync.QUOTA_BYTES_PER_ITEM || 8192;
const subscribers: Subscriber[] = [];
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

function subscribeToChanges(handler: Subscriber["handler"], { id, listenToLocal = false } = {} as Omit<Subscriber, "handler">) {
  if (id) {
    removeSubscriber(id);
  }
  subscribers.push({ id, handler, listenToLocal });
}

function removeSubscriber(id: string) {
  const index = subscribers.findIndex(subscriber => subscriber.id === id);

  if (index >= 0) {
    const subscriber = subscribers[index];

    chrome.storage.onChanged.removeListener(subscriber.handler);
    subscribers.splice(index, 1);
  }
}

async function get(id: string) {
  const item = await chrome.storage.sync.get(id);
  return item[id];
}

async function set(value: { [key: string]: unknown }, { updateLocally, warnSize }: { updateLocally?: boolean, warnSize: boolean } = { updateLocally: false, warnSize: false }) {
  isLocalChange = !updateLocally;

  try {
    await chrome.storage.sync.set(value);

    if (warnSize) {
      const id = Object.keys(value)[0];
      return checkSize(id);
    }
  } catch (e) {
    console.log(e.message);

    if (e.message?.startsWith("QUOTA_BYTES_PER_ITEM")) {
      return {
        usedRatio: 1,
        message: "Storage is full, no data was saved."
      };
    }
  }
}

function remove(id: string) {
  return chrome.storage.sync.remove(id);
}

async function getBytesInUse(id: string) {
  const bytes = await chrome.storage.sync.getBytesInUse(id);

  return {
    used: bytes,
    usedFormated: formatBytes(bytes),
    usedRatio: bytes / MAX_QUOTA,
    max: MAX_QUOTA,
    maxFormated: formatBytes(MAX_QUOTA)
  };
}

async function checkSize(id: string) {
  const { usedRatio } = await getBytesInUse(id);

  if (usedRatio >= 0.9) {
    return {
      usedRatio,
      message: "Storage is almost full."
    };
  }
  return { usedRatio };
}

export {
  MAX_QUOTA,
  subscribeToChanges,
  removeSubscriber,
  get,
  set,
  remove,
  getBytesInUse,
  checkSize
};
