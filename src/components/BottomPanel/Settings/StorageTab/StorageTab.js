/* global chrome */

import { useState, useEffect, useCallback } from "react";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./storage-tab.css";

export default function StorageTab() {
  const [items, setItems] = useState(null);
  const [stats, setStats] = useState(() => ({
    usedStorageFormatted: 0,
    usedStorage: 0,
    usedStorageInPercent: 0,
    dashoffset: 1000
  }));
  const [modal, setModal] = useState(null);
  const memoizedChangeHandler = useCallback(handleStorageChange, [items, stats]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    chrome.storage.sync.onChanged.addListener(memoizedChangeHandler);

    return () => {
      chrome.storage.sync.onChanged.removeListener(memoizedChangeHandler);
    };
  }, [memoizedChangeHandler]);

  async function init() {
    const items = [
      {
        name: "tasks",
        fullName: "Tasks"
      },
      {
        name: "notepad",
        fullName: "Notepad"
      },
      {
        name: "feeds",
        fullName: "RSS feed"
      },
      {
        name: "reminders",
        fullName: "Calendar reminders"
      },
      {
        name: "timer",
        fullName: "Timer presets"
      },
      {
        name: "countdowns",
        fullName: "Countdowns"
      },
      {
        name: "greetings",
        fullName: "Greetings"
      }
    ];

    const maxStoragePerItem = chrome.storage.sync.QUOTA_BYTES_PER_ITEM;
    let usedStorage = 0;

    for (const item of items) {
      const bytes = await getBytesInUse(item.name);
      usedStorage += bytes;
      item.bytes = bytes;
      item.usageRatio = bytes / maxStoragePerItem;
      item.usedStorage = formatBytes(bytes);
    }
    const maxStorage = items.length * maxStoragePerItem;
    const usageRatio = usedStorage / maxStorage;

    setStats({
      maxStorage,
      maxStoragePerItem,
      usedStorage,
      maxStorageFormatted: formatBytes(maxStorage),
      usedStorageInPercent: Math.ceil(usageRatio * 100),
      usedStorageFormatted: formatBytes(usedStorage),
      // 1000 = empty circle, 717 = full circle
      dashoffset: 1000 - 283 * usageRatio
    });

    setItems(items);
  }

  async function handleStorageChange(storage) {
    const [name] = Object.keys(storage);
    const bytes = await getBytesInUse(name);
    const item = items.find(item => item.name === name);
    const byteDiff = bytes - item.bytes;
    const usedStorage = stats.usedStorage + byteDiff;
    const usageRatio = usedStorage / stats.maxStorage;

    item.bytes = bytes;
    item.usageRatio = bytes / stats.maxStoragePerItem;
    item.usedStorage = formatBytes(bytes);

    setItems([...items]);
    setStats({
      ...stats,
      usedStorage,
      usedStorageInPercent: Math.ceil(usageRatio * 100),
      usedStorageFormatted: formatBytes(usedStorage),
      // 1000 = empty circle, 717 = full circle
      dashoffset: 1000 - 283 * usageRatio
    });
  }

  function getBytesInUse(name) {
    return new Promise(resolve => {
      chrome.storage.sync.getBytesInUse(name, resolve);
    });
  }

  function formatBytes(bytes) {
    const kb = bytes / 1024;

    return kb % 1 === 0 ? kb : kb.toFixed(2);
  }

  function confirmModalAction() {
    setModal(null);
    chrome.storage.sync.remove(modal.name);
  }

  function hideModal() {
    setModal(null);
  }

  if (!items) {
    return null;
  }
  return (
    <div className="setting-tab">
      <div className="storage-usage">
        <div className="storage-usage-numerical">
          <div className="storage-usage-current-numerical">
            <span>{stats.usedStorageFormatted}</span>
            <span className="storage-usage-current-numerical-units">kB</span>
          </div>
          <div>Used of {stats.maxStorageFormatted} kB</div>
        </div>
        <div className="storage-usage-percental">
          <svg viewBox="0 0 100 100" className="storage-usage-visual">
            <circle cx="50" cy="50" r="45"/>
            <circle cx="50" cy="50" r="45" strokeDasharray="1000"
              className={`storage-usage-current-visual${stats.dashoffset < 745.3 ? " full" : ""}`}
              style={{ "--dashoffset": stats.dashoffset }}/>
          </svg>
          <div className="storage-usage-current-percental">{stats.usedStorageInPercent}%</div>
          <div>Used</div>
        </div>
      </div>
      <ul>
        {items.map((item, i) => (
          <li className="storage-item" key={i}>
            <div className="storage-item-main">
              <div className="storage-item-info">
                <div>{item.fullName}</div>
                <div>{item.usedStorage} kB</div>
              </div>
              <div className="storage-item-bar">
                <div className={`storage-item-bar-inner${item.usageRatio > 0.9 ? " full" : ""}`}
                  style={{ "--scale": item.usageRatio, "--index": i }}>
                </div>
              </div>
            </div>
            <button className="btn icon-btn alt-icon-btn" onClick={() => setModal(item)} title="Delete">
              <Icon id="trash"/>
            </button>
          </li>
        ))}
      </ul>
      {modal && (
        <Modal className="notepad-modal">
          <h4 className="modal-title">Delete {modal.fullName} data?</h4>
          <p>Do you really want to delete {modal.fullName} data?</p>
          <p>All associated data will be removed.</p>
          <div className="modal-actions">
            <button className="btn text-btn" onClick={hideModal}>Cancel</button>
            <button className="btn" onClick={confirmModalAction}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
